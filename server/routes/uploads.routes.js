
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const uploadsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'uploads'
)

const recibirImagenes = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (req, file, callback) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp']

    if (!tipos.includes(file.mimetype)) {
      return callback(
        new Error('Solo se permiten imágenes JPG, PNG o WebP.')
      )
    }

    callback(null, true)
  },
}).array('images', 3)

router.post('/', requireAuth, (req, res) => {
  recibirImagenes(req, res, async (error) => {
    if (error) {
      return res.status(
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      ).json({
        error: error.code === 'LIMIT_FILE_SIZE'
          ? 'Cada imagen debe pesar como máximo 5 MB.'
          : error.message,
      })
    }

    if (!req.files?.length) {
      return res.status(400).json({
        error: 'Selecciona al menos una imagen.',
      })
    }

    const archivosGuardados = []

    try {
      await mkdir(uploadsDir, { recursive: true })

      const images = []

      for (const archivo of req.files) {
        const imagenOptimizada = await sharp(archivo.buffer, {
          limitInputPixels: 16_000_000,
        })
          .rotate()
          .resize({
            width: 1280,
            height: 1280,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer()

        const nombre = `${randomUUID()}.webp`
        const destino = path.join(uploadsDir, nombre)

        await writeFile(destino, imagenOptimizada, {
          flag: 'wx',
        })

        archivosGuardados.push(destino)
        images.push(`/uploads/${nombre}`)
      }

      return res.status(201).json({ images })
    } catch (error) {
      await Promise.allSettled(
        archivosGuardados.map((archivo) => unlink(archivo))
      )

      console.error('Error procesando imágenes:', error)

      return res.status(400).json({
        error: 'No se pudieron procesar las imágenes.',
      })
    }
  })
})

export default router
