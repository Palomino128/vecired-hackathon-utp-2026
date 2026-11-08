
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
).replace(/\/$/, '')

const TOKEN_KEY = 'vecired_token'

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event('vecired:auth-changed'))
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('vecired:auth-changed'))
}

async function peticion(ruta, opciones = {}) {
  const { method = 'GET', body, autenticado = false } = opciones
  const token = autenticado ? obtenerToken() : null

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: {
      ...(body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.error || datos?.message || `Error HTTP ${respuesta.status}`
    )
  }

  return datos
}

export async function registrarVecino(datos) {
  const resultado = await peticion('/api/auth/register', {
    method: 'POST',
    body: datos,
  })

  if (resultado.token) guardarToken(resultado.token)
  return resultado
}

export async function iniciarSesion(datos) {
  const resultado = await peticion('/api/auth/login', {
    method: 'POST',
    body: datos,
  })

  if (resultado.token) guardarToken(resultado.token)
  return resultado
}

export function obtenerPerfil() {
  return peticion('/api/auth/me', { autenticado: true })
}

export function obtenerPublicaciones() {
  return peticion('/api/items')
}

export function crearPublicacion(datos) {
  return peticion('/api/items', {
    method: 'POST',
    body: datos,
    autenticado: true,
  })
}


export async function subirImagenes(archivos) {
  if (!archivos.length) return []

  const token = obtenerToken()

  if (!token) {
    throw new Error('Inicia sesión en Mi cuenta antes de publicar.')
  }

  const formulario = new FormData()

  archivos.forEach((archivo) => {
    formulario.append('images', archivo)
  })

  const respuesta = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formulario,
  })

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.error || 'No se pudieron subir las imágenes.'
    )
  }

  if (!Array.isArray(datos?.images)) {
    throw new Error('El servidor no devolvió las imágenes.')
  }

  return datos.images
}
