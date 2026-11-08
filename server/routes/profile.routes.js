import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const router = Router()
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')
const RUTA_AVATAR = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i

// PUT /api/profile/me
// Solo el usuario autenticado puede actualizar su propio perfil.
// El rol, correo y estado de verificación NO pueden modificarse aquí.
router.put('/me', requireAuth, async (req, res) => {
  try {
    const body = req.body || {}
    const updates = []
    const values = []
    const add = (col, value) => {
      values.push(value)
      updates.push(`${col} = $${values.length}`)
    }

    if (Object.hasOwn(body, 'avatar_url')) {
      const avatar = body.avatar_url
      if (avatar !== null && avatar !== '' && (typeof avatar !== 'string' || !RUTA_AVATAR.test(avatar))) {
        return res.status(400).json({ error: 'La foto debe provenir del servicio de imágenes de VeciRed.' })
      }
      if (avatar && !existsSync(path.join(uploadsDir, path.basename(avatar)))) {
        return res.status(400).json({ error: 'La imagen no existe en el servidor.' })
      }
      add('avatar_url', avatar || null)
    }

    if (Object.hasOwn(body, 'phone')) {
      const phone = body.phone
      if (phone !== null && typeof phone !== 'string') {
        return res.status(400).json({ error: 'Teléfono inválido.' })
      }
      const clean = phone?.trim() || null
      if (clean && !/^9\d{8}$/.test(clean)) {
        return res.status(400).json({ error: 'El celular peruano debe tener exactamente 9 dígitos y empezar con 9.' })
      }
      add('phone', clean)
    }

    if (Object.hasOwn(body, 'full_name')) {
      if (typeof body.full_name !== 'string') {
        return res.status(400).json({ error: 'Nombre inválido.' })
      }
      const clean = body.full_name.trim()
      if (clean.length < 2 || clean.length > 150) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 150 caracteres.' })
      }
      add('full_name', clean)
    }

    if (Object.hasOwn(body, 'neighborhood')) {
      if (typeof body.neighborhood !== 'string') {
        return res.status(400).json({ error: 'Barrio inválido.' })
      }
      const clean = body.neighborhood.trim()
      if (clean.length < 2 || clean.length > 100) {
        return res.status(400).json({ error: 'El barrio debe tener entre 2 y 100 caracteres.' })
      }
      add('neighborhood', clean)
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No se enviaron cambios válidos de perfil.' })
    }

    values.push(req.user.id)
    const result = await query(`
      UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, email, full_name, phone, neighborhood, role,
                avatar_url, verified_neighbor, reputation_score, bio, created_at
    `, values)

    if (!result.rows.length) return res.status(404).json({ error: 'Cuenta no encontrada.' })
    return res.json(result.rows[0])
  } catch (error) {
    console.error('[Perfil] No se pudo actualizar:', error)
    return res.status(500).json({ error: 'No se pudo actualizar el perfil.' })
  }
})

export default router
