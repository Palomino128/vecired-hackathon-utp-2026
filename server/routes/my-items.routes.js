import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const VALID_IMAGES = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i
const TIPOS_CIERRE = new Set(['venta', 'prestamo', 'donacion', 'otro'])

function validarTexto(valor, nombre, minimo, maximo) {
  if (typeof valor !== 'string' || valor.trim().length < minimo || valor.trim().length > maximo) {
    return `${nombre} debe tener entre ${minimo} y ${maximo} caracteres.`
  }
  return null
}

// Estas rutas usan SIEMPRE el ID del token, nunca un user_id del navegador.
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.full_name AS author_name FROM items i
       JOIN users u ON u.id = i.user_id
       WHERE i.user_id = $1 ORDER BY i.created_at DESC LIMIT 200`,
      [req.user.id],
    )
    res.json(result.rows)
  } catch (error) {
    console.error('[Mis publicaciones] Error al listar:', error)
    res.status(500).json({ error: 'No se pudieron cargar tus publicaciones.' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const body = req.body || {}
    const tituloError = validarTexto(body.title, 'Título', 3, 150)
    const descripcionError = validarTexto(body.description, 'Descripción', 5, 5000)
    const categoriaError = validarTexto(body.category, 'Categoría', 2, 60)
    const zonaError = validarTexto(body.neighborhood, 'Barrio', 2, 100)
    if (tituloError || descripcionError || categoriaError || zonaError) {
      return res.status(400).json({ error: tituloError || descripcionError || categoriaError || zonaError })
    }
    if (body.price_range != null && (typeof body.price_range !== 'string' || body.price_range.length > 60)) {
      return res.status(400).json({ error: 'El precio debe tener máximo 60 caracteres.' })
    }
    if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 3 || !body.images.every((r) => typeof r === 'string' && VALID_IMAGES.test(r)))) {
      return res.status(400).json({ error: 'Solo se permiten hasta tres fotografías de VeciRed.' })
    }

    const resultado = await query(
      `UPDATE items SET title=$1, description=$2, category=$3, neighborhood=$4,
          price_range=$5, images=COALESCE($6::text[], images), updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [
        body.title.trim(), body.description.trim(), body.category.trim(),
        body.neighborhood.trim(), (body.price_range || 'A coordinar').trim(),
        body.images === undefined ? null : body.images,
        req.params.id, req.user.id,
      ],
    )
    if (!resultado.rows.length) return res.status(404).json({ error: 'No se encontró una publicación propia con ese ID.' })
    res.json({ item: resultado.rows[0] })
  } catch (error) {
    console.error('[Mis publicaciones] Error al editar:', error)
    res.status(500).json({ error: 'No se pudo actualizar la publicación.' })
  }
})

router.patch('/:id/complete', async (req, res) => {
  const tipo = req.body?.completion_type
  if (!TIPOS_CIERRE.has(tipo)) {
    return res.status(400).json({ error: 'Elige venta, prestamo, donacion u otro.' })
  }
  try {
    const resultado = await query(
      `UPDATE items SET status='archivado', completion_type=$1, completed_at=NOW(), updated_at=NOW()
       WHERE id=$2 AND user_id=$3 AND status <> 'archivado' RETURNING *`,
      [tipo, req.params.id, req.user.id],
    )
    if (!resultado.rows.length) return res.status(404).json({ error: 'Publicación no encontrada, ajena o ya finalizada.' })
    res.json({ item: resultado.rows[0] })
  } catch (error) {
    console.error('[Mis publicaciones] Error al finalizar:', error)
    res.status(500).json({ error: 'No se pudo finalizar la publicación.' })
  }
})

router.patch('/:id/pause', async (req, res) => {
  try {
    const resultado = await query(
      `UPDATE items SET status='pausado', updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status='activo' RETURNING *`,
      [req.params.id, req.user.id],
    )
    if (!resultado.rows.length) return res.status(404).json({ error: 'No se pudo pausar esta publicación.' })
    res.json({ item: resultado.rows[0] })
  } catch (error) {
    console.error('[Mis publicaciones] Error al pausar:', error)
    res.status(500).json({ error: 'No se pudo pausar.' })
  }
})

router.patch('/:id/reactivate', async (req, res) => {
  try {
    const resultado = await query(
      `UPDATE items SET status='activo', completion_type=NULL, completed_at=NULL, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status IN ('pausado','archivado','agotado') RETURNING *`,
      [req.params.id, req.user.id],
    )
    if (!resultado.rows.length) return res.status(404).json({ error: 'No se pudo reactivar esta publicación.' })
    res.json({ item: resultado.rows[0] })
  } catch (error) {
    console.error('[Mis publicaciones] Error al reactivar:', error)
    res.status(500).json({ error: 'No se pudo reactivar.' })
  }
})

export default router
