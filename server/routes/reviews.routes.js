// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/routes/reviews.routes.js
// DESCRIPCIÓN: Sistema Visto Bueno Vecinal (Estrellas, comentarios y aval comunitario)
// ==============================================================================

import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ------------------------------------------------------------------------------
// GET /api/reviews/item/:itemId - Consultar recomendaciones de un producto/servicio
// ------------------------------------------------------------------------------
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const sqlText = `
      SELECT
        r.id,
        r.item_id,
        r.reviewer_id,
        r.rating,
        r.comment,
        r.neighbor_verified,
        r.created_at,
        u.full_name as reviewer_name,
        u.neighborhood as reviewer_neighborhood,
        u.verified_neighbor as reviewer_verified
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.item_id = $1
      ORDER BY r.created_at DESC;
    `;

    const result = await query(sqlText, [itemId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /reviews/item/:itemId:', error);
    res.status(500).json({ error: 'Error al consultar las recomendaciones del vecino' });
  }
});

// ------------------------------------------------------------------------------
// POST /api/reviews - Emitir "Visto Bueno Vecinal" (Recomendar con estrellas)
// REGLA CRUCIAL: No se permite auto-calificación; actualiza rating automáticamente
// ------------------------------------------------------------------------------
router.post('/', requireAuth, async (req, res) => {
  try {
    const { item_id, rating, comment } = req.body;

    if (!item_id || !rating || !comment) {
      return res.status(400).json({
        error: 'Los campos item_id, rating (1-5) y comment son obligatorios.',
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        error: 'La calificación del Visto Bueno Vecinal debe ser un número entero entre 1 y 5 estrellas.',
      });
    }

    // 1. Verificar existencia del ítem y comprobar que NO sea auto-reseña
    const itemRes = await query('SELECT user_id, neighborhood FROM items WHERE id = $1', [item_id]);
    if (itemRes.rows.length === 0) {
      return res.status(404).json({ error: 'El producto o servicio que intentas calificar no existe.' });
    }

    const targetItem = itemRes.rows[0];

    // ANTI-FRAUD: Prevención de auto-calificación
    if (targetItem.user_id === req.user.id) {
      return res.status(400).json({
        error: 'Regla de Integridad: No puedes otorgarte Visto Bueno Vecinal a tu propia publicación.',
        code: 'SELF_REVIEW_NOT_ALLOWED',
      });
    }

    // Comprobar si el evaluador vive en el mismo barrio (aval vecinal certificado)
    const isSameNeighborhood = targetItem.neighborhood === req.user.neighborhood;

    // 2. Insertar o actualizar la reseña (un vecino solo puede emitir una reseña por ítem)
    const insertReviewSql = `
      INSERT INTO reviews (item_id, reviewer_id, rating, comment, neighbor_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (item_id, reviewer_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        neighbor_verified = EXCLUDED.neighbor_verified,
        updated_at = NOW()
      RETURNING *;
    `;

    const reviewRes = await query(insertReviewSql, [
      item_id,
      req.user.id,
      numRating,
      comment.trim(),
      isSameNeighborhood,
    ]);

    // 3. Obtener el promedio y conteo actualizados del ítem
    // (Por si el trigger de PostgreSQL se ejecutó, consultamos el valor más reciente de items)
    const updatedItemRes = await query(
      'SELECT id, title, avg_rating, reviews_count FROM items WHERE id = $1',
      [item_id]
    );

    res.status(201).json({
      message: '¡Visto Bueno Vecinal registrado con éxito! Tu recomendación fortalece la confianza del barrio.',
      review: reviewRes.rows[0],
      itemStats: updatedItemRes.rows[0],
    });
  } catch (error) {
    console.error('Error en POST /reviews:', error);
    res.status(500).json({ error: error.message || 'Error al registrar el Visto Bueno Vecinal' });
  }
});

// ------------------------------------------------------------------------------
// DELETE /api/reviews/:id - Eliminar recomendación (solo el autor)
// ------------------------------------------------------------------------------
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'La recomendación no existe.' });
    }

    const review = existing.rows[0];

    if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso Denegado: Solo puedes retirar tu propia recomendación.',
        code: 'FORBIDDEN_REVIEW_DELETION',
      });
    }

    await query('DELETE FROM reviews WHERE id = $1', [id]);

    // Obtener stats actualizadas
    const updatedItemRes = await query(
      'SELECT id, avg_rating, reviews_count FROM items WHERE id = $1',
      [review.item_id]
    );

    res.json({
      message: 'Recomendación retirada correctamente',
      deleted_id: id,
      itemStats: updatedItemRes.rows[0],
    });
  } catch (error) {
    console.error('Error en DELETE /reviews/:id:', error);
    res.status(500).json({ error: 'Error al retirar la recomendación' });
  }
});

export default router;
