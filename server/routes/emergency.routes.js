// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/routes/emergency.routes.js
// DESCRIPCIÓN: Directorio de Apoyo Crítico y Tablero de Emergencia Vecinal
// ==============================================================================

import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ==============================================================================
// 1. DIRECTORIO DE RECURSOS Y GRUPOS DE APOYO EN EMERGENCIAS
// ==============================================================================

// GET /api/emergency/resources - Directorio de apoyo comunitario
router.get('/resources', async (req, res) => {
  try {
    const { type, neighborhood, q } = req.query;
    const conditions = ['is_active = true'];
    const params = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (neighborhood) {
      conditions.push(`neighborhood ILIKE $${paramIndex}`);
      params.push(`%${neighborhood}%`);
      paramIndex++;
    }

    if (q) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const sqlText = `
      SELECT * FROM emergency_resources
      ${whereClause}
      ORDER BY verified DESC, name ASC;
    `;

    const result = await query(sqlText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /emergency/resources:', error);
    res.status(500).json({ error: 'Error al consultar el directorio de emergencias' });
  }
});

// POST /api/emergency/resources - Registrar nuevo punto o grupo de apoyo
router.post('/resources', requireAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      contact_phone,
      emergency_phone,
      address,
      neighborhood,
      latitude,
      longitude,
      operating_hours = '24/7',
    } = req.body;

    if (!name || !type || !contact_phone) {
      return res.status(400).json({
        error: 'Los campos name, type y contact_phone son obligatorios.',
      });
    }

    const itemNeighborhood = neighborhood || req.user.neighborhood || 'Zona Vecinal';

    const insertSql = `
      INSERT INTO emergency_resources (
        name, type, description, contact_phone, emergency_phone,
        address, neighborhood, latitude, longitude, operating_hours, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      name.trim(),
      type,
      description || '',
      contact_phone.trim(),
      emergency_phone || null,
      address || '',
      itemNeighborhood,
      latitude || null,
      longitude || null,
      operating_hours,
      req.user.id,
    ]);

    res.status(201).json({
      message: 'Recurso de emergencia registrado en el directorio',
      resource: result.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /emergency/resources:', error);
    res.status(500).json({ error: 'Error al registrar el recurso de emergencia' });
  }
});

// ==============================================================================
// 2. TABLERO DE AYUDA HUMANITARIA Y REPORTES DE VULNERABILIDAD
// ==============================================================================

// GET /api/emergency/reports - Consultar reportes geolocalizados de vulnerabilidad
router.get('/reports', optionalAuth, async (req, res) => {
  try {
    const { status, urgency, neighborhood } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`er.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (urgency) {
      conditions.push(`er.urgency = $${paramIndex}`);
      params.push(urgency);
      paramIndex++;
    }

    if (neighborhood) {
      conditions.push(`er.neighborhood ILIKE $${paramIndex}`);
      params.push(`%${neighborhood}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlText = `
      SELECT
        er.*,
        u.full_name as reporter_name,
        u.phone as reporter_phone
      FROM emergency_reports er
      JOIN users u ON u.id = er.reporter_id
      ${whereClause}
      ORDER BY
        CASE er.urgency
          WHEN 'critica' THEN 1
          WHEN 'alta' THEN 2
          WHEN 'media' THEN 3
          ELSE 4
        END,
        er.created_at DESC;
    `;

    const result = await query(sqlText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /emergency/reports:', error);
    res.status(500).json({ error: 'Error al consultar el tablero de emergencia' });
  }
});

// POST /api/emergency/reports - Emitir reporte de vulnerabilidad o necesidad crítica
router.post('/reports', requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      urgency = 'alta',
      affected_people_count = 1,
      critical_needs = [],
      neighborhood,
      latitude,
      longitude,
      client_id,
    } = req.body;

    if (!title || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'title, description, latitude y longitude son campos obligatorios para geolocalizar la emergencia.',
      });
    }

    // Evitar reportes duplicados de la cola offline
    if (client_id) {
      const existing = await query('SELECT * FROM emergency_reports WHERE client_id = $1', [client_id]);
      if (existing.rows.length > 0) {
        return res.status(200).json({
          message: 'Reporte sincronizado previamente',
          report: existing.rows[0],
        });
      }
    }

    const itemNeighborhood = neighborhood || req.user.neighborhood || 'Zona Vecinal';

    const insertSql = `
      INSERT INTO emergency_reports (
        reporter_id, title, description, urgency, affected_people_count,
        critical_needs, neighborhood, latitude, longitude, client_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      req.user.id,
      title.trim(),
      description.trim(),
      urgency,
      affected_people_count,
      critical_needs,
      itemNeighborhood,
      latitude,
      longitude,
      client_id || null,
    ]);

    res.status(201).json({
      message: '¡Alerta de emergencia comunitaria publicada!',
      report: result.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /emergency/reports:', error);
    res.status(500).json({ error: 'Error al emitir el reporte de emergencia' });
  }
});

// PUT /api/emergency/reports/:id/status - Actualizar estado de atención de la emergencia
router.put('/reports/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, attended_by } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Debe indicar el nuevo estado (en_atencion, atendido, pendiente)' });
    }

    const current = await query('SELECT reporter_id FROM emergency_reports WHERE id=$1', [id]);
    if (!current.rows.length) return res.status(404).json({ error: 'El reporte de emergencia no fue encontrado.' });
    if (current.rows[0].reporter_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'lider_comunitario') {
      return res.status(403).json({ error: 'Solo quien reportó o un responsable comunitario puede actualizar la atención.' });
    }
    if (!['pendiente', 'en_atencion', 'atendido'].includes(status)) return res.status(400).json({ error: 'Estado de atención inválido.' });

    const updateSql = `
      UPDATE emergency_reports
      SET
        status = $1,
        attended_by = COALESCE($2, attended_by, $3),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;

    const result = await query(updateSql, [
      status,
      attended_by || null,
      req.user.full_name,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'El reporte de emergencia no fue encontrado.' });
    }

    res.json({
      message: 'Estado de atención actualizado',
      report: result.rows[0],
    });
  } catch (error) {
    console.error('Error en /emergency/reports/:id/status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del reporte' });
  }
});

export default router;
