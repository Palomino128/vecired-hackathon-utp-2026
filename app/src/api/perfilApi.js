import { obtenerToken } from './veciredApi'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
const FORMATO_AVATAR = /^\/uploads\/[0-9a-f-]+\.webp$/i

export function obtenerAvatarUrl(ruta) {
  if (!ruta || typeof ruta !== 'string' || !FORMATO_AVATAR.test(ruta)) return null
  return `${API_URL}${ruta}`
}

export async function actualizarPerfil(cambios) {
  const token = obtenerToken()
  if (!token) throw new Error('Inicia sesión para editar tu perfil.')

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}/api/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cambios),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) throw new Error(datos.error || `Error HTTP ${respuesta.status}`)
  return datos
}
