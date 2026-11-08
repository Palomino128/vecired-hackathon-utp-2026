import { Router } from 'express';
import { query, pool } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();
const urgencies = ['critica', 'alta', 'media', 'baja'];
const types = ['prestamo', 'donacion', 'intercambio_habilidad', 'movilidad', 'ayuda_temporal'];

router.get('/requests', optionalAuth, async (req, res) => {
  try {
    const { type, status, neighborhood, urgency, q, mine } = req.query;
    const conditions = [];
    const params = [];
    const add = (sql, value) => { params.push(value); conditions.push(sql.replace('?', `$${params.length}`)); };
    if (type) add('sr.type = ?', type);
    if (status) add('sr.status = ?', status);
    if (neighborhood) add('sr.neighborhood ILIKE ?', `%${neighborhood}%`);
    if (urgency) add('sr.urgency = ?', urgency);
    if (q) { params.push(`%${q}%`); conditions.push(`(sr.title ILIKE $${params.length} OR sr.description ILIKE $${params.length} OR sr.category ILIKE $${params.length})`); }
    if (mine === 'true') {
      if (!req.user) return res.status(401).json({ error: 'Inicia sesión para ver tus publicaciones.' });
      add('sr.user_id = ?', req.user.id);
    }
    const result = await query(`SELECT sr.*, u.full_name AS author_name,
      h.full_name AS helper_name, (SELECT COUNT(*) FROM solidarity_responses r WHERE r.request_id=sr.id) AS responses_count
      FROM solidarity_requests sr JOIN users u ON u.id=sr.user_id LEFT JOIN users h ON h.id=sr.resolved_by_user_id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY sr.is_emergency DESC, CASE sr.urgency WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END, sr.created_at DESC
      LIMIT 100`, params);
    res.json(result.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al consultar el muro solidario.' }); }
});

router.get('/requests/:id', async (req, res) => {
  try {
    const found = await query(`SELECT sr.*, u.full_name AS author_name, l.full_name AS lender_name
      FROM solidarity_requests sr JOIN users u ON u.id=sr.user_id
      LEFT JOIN users l ON l.id=sr.resolved_by_user_id WHERE sr.id=$1`, [req.params.id]);
    if (!found.rows.length) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    const responses = await query(`SELECT r.*, u.full_name AS helper_name FROM solidarity_responses r JOIN users u ON u.id=r.helper_user_id WHERE r.request_id=$1 ORDER BY r.created_at`, [req.params.id]);
    res.json({ ...found.rows[0], responses: responses.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'No se pudo cargar el detalle.' }); }
});

router.post('/requests', requireAuth, async (req, res) => {
  try {
    const { type, intent='necesidad', title, description, category, neighborhood, latitude, longitude, urgency='media', is_emergency=false, departure, destination, travel_at, passengers, reason } = req.body;
    if (!types.includes(type) || !title?.trim() || !description?.trim() || !category?.trim()) return res.status(400).json({ error: 'Completa tipo, título, descripción y categoría.' });
    if (!['necesidad','ofrecimiento'].includes(intent)) return res.status(400).json({ error: 'Indica si es una necesidad o un ofrecimiento.' });
    if (!urgencies.includes(urgency)) return res.status(400).json({ error: 'Prioridad inválida.' });
    if (type === 'movilidad' && (!departure?.trim() || !destination?.trim() || !travel_at || !Number(passengers))) return res.status(400).json({ error: 'La movilidad requiere origen, destino, fecha y pasajeros.' });
    const result = await query(`INSERT INTO solidarity_requests (user_id,type,intent,title,description,category,neighborhood,latitude,longitude,urgency,is_emergency,departure,destination,travel_at,passengers,reason,loan_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`, [req.user.id,type,intent,title.trim(),description.trim(),category.trim(),neighborhood || req.user.neighborhood,latitude ?? null,longitude ?? null,urgency,Boolean(is_emergency),departure || null,destination || null,travel_at || null,passengers || null,reason || null,type === 'prestamo' ? 'solicitado' : null]);
    res.status(201).json({ request: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al publicar la solicitud.' }); }
});

router.put('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, category, neighborhood, urgency, is_emergency, status, intent, departure, destination, travel_at, passengers, reason } = req.body;
    if (status === 'resuelta') {
      const loan = await query('SELECT type,loan_status FROM solidarity_requests WHERE id=$1', [req.params.id]);
      if (loan.rows[0]?.type === 'prestamo' && loan.rows[0].loan_status !== 'devuelto') return res.status(409).json({ error: 'Un préstamo solo queda resuelto después de registrar la devolución.' });
    }
    if ((urgency !== undefined || is_emergency !== undefined) && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo un administrador puede cambiar la prioridad de una emergencia publicada.' });
    if (urgency && !urgencies.includes(urgency)) return res.status(400).json({ error: 'Prioridad inválida.' });
    if (status && !['abierta', 'en_proceso', 'resuelta', 'cancelada'].includes(status)) return res.status(400).json({ error: 'Estado inválido.' });
    const result = await query(`UPDATE solidarity_requests SET title=COALESCE($1,title), description=COALESCE($2,description), category=COALESCE($3,category), neighborhood=COALESCE($4,neighborhood), urgency=COALESCE($5,urgency), is_emergency=COALESCE($6,is_emergency), status=COALESCE($7,status), intent=COALESCE($8,intent), departure=COALESCE($9,departure), destination=COALESCE($10,destination), travel_at=COALESCE($11,travel_at), passengers=COALESCE($12,passengers), reason=COALESCE($13,reason), updated_at=NOW()
      WHERE id=$14 AND (user_id=$15 OR $16='admin') RETURNING *`, [title?.trim()||null,description?.trim()||null,category?.trim()||null,neighborhood||null,urgency||null,is_emergency??null,status||null,intent||null,departure||null,destination||null,travel_at||null,passengers||null,reason||null,req.params.id,req.user.id,req.user.role]);
    if (!result.rows.length) {
      const exists = await query('SELECT id FROM solidarity_requests WHERE id=$1', [req.params.id]);
      return res.status(exists.rows.length ? 403 : 404).json({ error: exists.rows.length ? 'Solo puedes editar tus publicaciones.' : 'Solicitud no encontrada.' });
    }
    res.json({ request: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al actualizar la solicitud.' }); }
});

router.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const result = await query("DELETE FROM solidarity_requests WHERE id=$1 AND (user_id=$2 OR $3='admin') AND NOT (type='prestamo' AND loan_status IN ('aceptado','entregado','devuelto')) RETURNING id", [req.params.id, req.user.id, req.user.role]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrada o no tienes permiso para eliminarla.' });
    res.json({ deleted: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al eliminar la publicación.' }); }
});

router.post('/requests/:id/responses', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reqRes = await client.query('SELECT * FROM solidarity_requests WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!reqRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Solicitud no encontrada.' }); }
    if (reqRes.rows[0].user_id === req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'No puedes responder a tu propia solicitud.' }); }
    if (reqRes.rows[0].status !== 'abierta') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Esta solicitud ya no está abierta.' }); }
    if (reqRes.rows[0].type === 'prestamo') {
      const prior = await client.query("SELECT id FROM solidarity_responses WHERE request_id=$1 AND helper_user_id=$2 AND status='ofrecido'", [req.params.id, req.user.id]);
      if (prior.rows.length) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Ya enviaste una propuesta para este prestamo.' }); }
    }
    if (!req.body.message?.trim()) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Escribe un mensaje para ofrecer tu ayuda.' }); }
    const response = await client.query(`INSERT INTO solidarity_responses (request_id,helper_user_id,message,proposed_solution,contact_phone) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.params.id,req.user.id,req.body.message.trim(),req.body.proposed_solution||null,req.body.contact_phone||req.user.phone||'']);
    if (reqRes.rows[0].type === 'prestamo') await client.query("UPDATE solidarity_requests SET loan_status='ofrecido' WHERE id=$1 AND loan_status='solicitado'", [req.params.id]);
    await client.query('COMMIT');
    res.status(201).json({ response: response.rows[0] });
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: 'No se pudo enviar el ofrecimiento.' }); } finally { client.release(); }
});

router.put('/requests/:id/responses/:responseId', requireAuth, async (req, res) => {
  const { decision } = req.body;
  if (!['aceptado','rechazado','completado'].includes(decision)) return res.status(400).json({ error: 'Decisión inválida.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const request = await client.query('SELECT * FROM solidarity_requests WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!request.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Solicitud no encontrada.' }); }
    if (request.rows[0].user_id !== req.user.id && req.user.role !== 'admin') { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Solo el autor puede gestionar propuestas.' }); }
    if (request.rows[0].type === 'prestamo') {
      if (decision === 'completado') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'El prÃ©stamo se completa al registrar la devoluciÃ³n.' }); }
      if (decision === 'aceptado' && request.rows[0].status !== 'abierta') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Ya hay una propuesta aceptada para este prÃ©stamo.' }); }
      if (request.rows[0].status !== 'abierta' && decision === 'rechazado') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'El prÃ©stamo ya avanzÃ³.' }); }
    }
    const response = request.rows[0].type === 'prestamo'
      ? await client.query("UPDATE solidarity_responses SET status=$1 WHERE id=$2 AND request_id=$3 AND status='ofrecido' RETURNING *", [decision,req.params.responseId,req.params.id])
      : await client.query('UPDATE solidarity_responses SET status=$1 WHERE id=$2 AND request_id=$3 RETURNING *', [decision,req.params.responseId,req.params.id]);
    if (!response.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Propuesta no encontrada.' }); }
    if (decision === 'aceptado') {
      await client.query("UPDATE solidarity_responses SET status='rechazado' WHERE request_id=$1 AND id<>$2 AND status='ofrecido'", [req.params.id,req.params.responseId]);
      await client.query("UPDATE solidarity_requests SET status='en_proceso',resolved_by_user_id=$1 WHERE id=$2", [response.rows[0].helper_user_id,req.params.id]);
      if (request.rows[0].type === 'prestamo') await client.query("UPDATE solidarity_requests SET loan_status='aceptado' WHERE id=$1", [req.params.id]);
    }
    if (decision === 'rechazado' && request.rows[0].type === 'prestamo') {
      const pending = await client.query("SELECT 1 FROM solidarity_responses WHERE request_id=$1 AND status='ofrecido' LIMIT 1", [req.params.id]);
      if (!pending.rows.length) await client.query("UPDATE solidarity_requests SET loan_status='solicitado' WHERE id=$1", [req.params.id]);
    }
    if (decision === 'completado') await client.query("UPDATE solidarity_requests SET status='resuelta' WHERE id=$1", [req.params.id]);
    await client.query('COMMIT'); res.json({ response: response.rows[0] });
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: 'No se pudo actualizar la propuesta.' }); } finally { client.release(); }
});

// Lender confirms delivery; borrower confirms the returned article.
router.put('/requests/:id/loan', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM solidarity_requests WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'PrÃ©stamo no encontrado.' }); }
    const loan = found.rows[0];
    if (loan.type !== 'prestamo') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Esta solicitud no es un prÃ©stamo.' }); }
    const { event } = req.body;
    if (event === 'entregado') {
      if (loan.resolved_by_user_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Solo quien presta el artÃ­culo puede confirmar la entrega.' }); }
      if (loan.loan_status !== 'aceptado') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Primero debe aceptarse una propuesta.' }); }
      const result = await client.query("UPDATE solidarity_requests SET loan_status='entregado',loan_delivered_at=NOW() WHERE id=$1 RETURNING *", [req.params.id]);
      await client.query("UPDATE solidarity_responses SET status='entregado' WHERE request_id=$1 AND helper_user_id=$2 AND status='aceptado'", [req.params.id,req.user.id]);
      await client.query('COMMIT'); return res.json({ request: result.rows[0] });
    }
    if (event === 'devuelto') {
      if (loan.user_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Solo quien recibiÃ³ el artÃ­culo puede confirmar la devoluciÃ³n.' }); }
      if (loan.loan_status !== 'entregado') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'La devoluciÃ³n se registra despuÃ©s de la entrega.' }); }
      const result = await client.query("UPDATE solidarity_requests SET loan_status='devuelto',loan_returned_at=NOW(),status='resuelta' WHERE id=$1 RETURNING *", [req.params.id]);
      await client.query("UPDATE solidarity_responses SET status='completado' WHERE request_id=$1 AND helper_user_id=$2", [req.params.id,loan.resolved_by_user_id]);
      await client.query('COMMIT'); return res.json({ request: result.rows[0] });
    }
    await client.query('ROLLBACK'); return res.status(400).json({ error: 'Evento de prÃ©stamo invÃ¡lido.' });
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: 'No se pudo actualizar el prÃ©stamo.' }); } finally { client.release(); }
});

export default router;
