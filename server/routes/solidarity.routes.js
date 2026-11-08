// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/routes/solidarity.routes.js
// DESCRIPCIÓN: Muro Colaborativo de Solidaridad (Préstamos, Donaciones, Ayuda sin dinero)
// ==============================================================================

import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ------------------------------------------------------------------------------
// GET /api/solidarity/requests - Listar solicitudes del muro colaborativo
// ------------------------------------------------------------------------------
router.get('/requests', optionalAuth, async (req, res) => {
  try {
    const {
      type,
      status,
      neighborhood,
      is_emergency,
      urgency,
      limit = 50,
      offset = 0,
    } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`sr.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (status) {
      conditions.push(`sr.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (neighborhood) {
      conditions.push(`sr.neighborhood ILIKE $${paramIndex}`);
      params.push(`%${neighborhood}%`);
      paramIndex++;
    }

    if (is_emergency === 'true' || is_emergency === '1') {
      conditions.push(`sr.is_emergency = true`);
    }

    if (urgency) {
      conditions.push(`sr.urgency = $${paramIndex}`);
      params.push(urgency);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlText = `
      SELECT
        sr.*,
        u.full_name as author_name,
        u.phone as author_phone,
        u.verified_neighbor as author_verified,
        h.full_name as helper_name,
        (SELECT COUNT(*) FROM solidarity_responses resp WHERE resp.request_id = sr.id) as responses_count
      FROM solidarity_requests sr
      JOIN users u ON u.id = sr.user_id
      LEFT JOIN users h ON h.id = sr.resolved_by_user_id
      ${whereClause}
      ORDER BY
        sr.is_emergency DESC,
        CASE sr.urgency
          WHEN 'critica' THEN 1
          WHEN 'alta' THEN 2
          WHEN 'media' THEN 3
          ELSE 4
        END,
        sr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sqlText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /solidarity/requests:', error);
    res.status(500).json({ error: 'Error al consultar el muro solidario' });
  }
});

// ------------------------------------------------------------------------------
// GET /api/solidarity/requests/:id - Detalle de solicitud y sus respuestas
// ------------------------------------------------------------------------------
router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const requestRes = await query(
      `SELECT sr.*, u.full_name as author_name, u.phone as author_phone,
              h.full_name as helper_name
       FROM solidarity_requests sr
       JOIN users u ON u.id = sr.user_id
       LEFT JOIN users h ON h.id = sr.resolved_by_user_id
       WHERE sr.id = $1`,
      [id]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const responsesRes = await query(
      `SELECT resp.*, u.full_name as helper_name, u.phone as helper_phone_db
       FROM solidarity_responses resp
       JOIN users u ON u.id = resp.helper_user_id
       WHERE resp.request_id = $1
       ORDER BY resp.created_at ASC`,
      [id]
    );

    const requestData = requestRes.rows[0];
    requestData.responses = responsesRes.rows;

    res.json(requestData);
  } catch (error) {
    console.error('Error en GET /solidarity/requests/:id:', error);
    res.status(500).json({ error: 'Error al cargar la solicitud solidaria' });
  }
});

// ------------------------------------------------------------------------------
// POST /api/solidarity/requests - Crear solicitud en el muro (Préstamo, donación, etc.)
// ------------------------------------------------------------------------------
router.post('/requests', requireAuth, async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      category,
      neighborhood,
      latitude,
      longitude,
      urgency = 'media',
      is_emergency = false,
      client_id,
    } = req.body;

    if (!type || !title || !description || !category) {
      return res.status(400).json({
        error: 'Los campos type, title, description y category son requeridos.',
      });
    }

    // Comprobar idempotencia offline
    if (client_id) {
      const existing = await query('SELECT * FROM solidarity_requests WHERE client_id = $1', [client_id]);
      if (existing.rows.length > 0) {
        return res.status(200).json({
          message: 'Solicitud sincronizada previamente',
          request: existing.rows[0],
        });
      }
    }

    const itemNeighborhood = neighborhood || req.user.neighborhood || 'Zona Vecinal';

    const insertSql = `
      INSERT INTO solidarity_requests (
        user_id, type, title, description, category, neighborhood,
        latitude, longitude, urgency, is_emergency, client_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      req.user.id,
      type,
      title.trim(),
      description.trim(),
      category.trim(),
      itemNeighborhood,
      latitude || req.user.latitude || null,
      longitude || req.user.longitude || null,
      urgency,
      is_emergency,
      client_id || null,
    ]);

    res.status(201).json({
      message: 'Solicitud solidaria publicada exitosamente',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /solidarity/requests:', error);
    res.status(500).json({ error: 'Error al registrar la solicitud solidaria' });
  }
});

// ------------------------------------------------------------------------------
// POST /api/solidarity/requests/:id/responses - Responder y ofrecer ayuda
// ------------------------------------------------------------------------------
router.post('/requests/:id/responses', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, proposed_solution, contact_phone, client_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Debe incluir un mensaje para el vecino.' });
    }

    // Verificar existencia de la solicitud
    const reqRes = await query('SELECT * FROM solidarity_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: 'La solicitud solidaria no existe.' });
    }

    const insertSql = `
      INSERT INTO solidarity_responses (
        request_id, helper_user_id, message, proposed_solution, contact_phone, client_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      id,
      req.user.id,
      message.trim(),
      proposed_solution || null,
      contact_phone || req.user.phone || '',
      client_id || null,
    ]);

    // Si la solicitud estaba 'abierta', podemos pasarla a 'en_proceso'
    await query("UPDATE solidarity_requests SET status = 'en_proceso' WHERE id = $1 AND status = 'abierta'", [id]);

    res.status(201).json({
      message: 'Tu ofrecimiento de ayuda fue enviado al vecino',
      response: result.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /responses:', error);
    res.status(500).json({ error: 'Error al enviar el ofrecimiento de ayuda' });
  }
});

// ------------------------------------------------------------------------------
// PUT /api/solidarity/requests/:id/resolve - Marcar solicitud como RESUELTA
// ------------------------------------------------------------------------------
router.put('/requests/:id/resolve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { helper_user_id } = req.body;

    const reqRes = await query('SELECT * FROM solidarity_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const solRequest = reqRes.rows[0];

    // Solo el autor de la solicitud o un admin puede marcarla como resuelta
    if (solRequest.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso Denegado: Solo el creador de la solicitud puede marcarla como resuelta.',
      });
    }

    const helperId = helper_user_id || req.body.helper_id || null;

    const updateSql = `
      UPDATE solidarity_requests
      SET
        status = 'resuelta',
        resolved_by_user_id = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await query(updateSql, [helperId, id]);

    if (helperId) {
      await query(
        "UPDATE solidarity_responses SET status = 'completado' WHERE request_id = $1 AND helper_user_id = $2",
        [id, helperId]
      );
    }

    res.json({
      message: '¡Excelente! La necesidad vecinal ha sido resuelta gracias a la comunidad.',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Error en /requests/:id/resolve:', error);
    res.status(500).json({ error: 'Error al marcar la solicitud como resuelta' });
  }
});

export default router;
