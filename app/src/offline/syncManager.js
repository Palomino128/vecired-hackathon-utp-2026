import { initDB, OUTBOX_STORE } from './db.js'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
const TOKEN_KEY = 'vecired_token'

// La identidad se extrae únicamente para separar las colas locales.
// El servidor valida el JWT de forma independiente en cada solicitud.
export function obtenerIdVecinoActual() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const segmento = token?.split('.')[1]
    if (!segmento) return null
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return typeof payload.id === 'string' ? payload.id : null
  } catch {
    return null
  }
}

function generarClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `vecired-${crypto.randomUUID()}`
  }
  return `vecired-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Guarda datos de una publicación SIN archivos, y SIN guardar contraseñas ni JWT.
// Se conserva en IndexedDB hasta que /api/sync/batch confirma la operación.
export async function saveToOutbox(data) {
  const owner_id = obtenerIdVecinoActual()
  if (!owner_id) {
    throw new Error('Debes iniciar sesión para guardar publicaciones sin conexión.')
  }
  if (!data?.title?.trim() || !data?.description?.trim() || !data?.neighborhood) {
    throw new Error('Completa título, descripción y zona antes de guardar.')
  }
  if (data.images?.length) {
    throw new Error('No se admiten fotografías en la cola sin conexión.')
  }

  const client_id = generarClientId()
  const registro = {
    id: client_id, // IndexedDB usa keyPath id
    client_id,     // El endpoint SQL utiliza esta clave para idempotencia
    owner_id,
    entity: 'items',
    action: 'create',
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category || 'Hogar',
      type: data.type || 'servicio',
      neighborhood: data.neighborhood,
      price_range: data.price_range || 'A coordinar',
    },
    createdAt: new Date().toISOString(),
  }

  const db = await initDB()
  await db.put(OUTBOX_STORE, registro)
  return registro
}

export async function getOutboxItems() {
  const db = await initDB()
  return db.getAll(OUTBOX_STORE)
}

let sincronizacionActiva = null

// Reintenta solo las operaciones de la cuenta actual. No borra fallidas.
export async function sincronizarPendientes() {
  if (sincronizacionActiva) return sincronizacionActiva

  sincronizacionActiva = (async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const owner_id = obtenerIdVecinoActual()
    if (!navigator.onLine || !token || !owner_id) {
      return { sincronizadas: 0, fallidas: 0, pendientes: 0 }
    }

    const db = await initDB()
    const entradas = (await db.getAll(OUTBOX_STORE)).filter(
      (entrada) =>
        entrada.owner_id === owner_id &&
        entrada.entity === 'items' &&
        entrada.action === 'create' &&
        entrada.client_id
    )

    if (!entradas.length) {
      return { sincronizadas: 0, fallidas: 0, pendientes: 0 }
    }

    // Por lotes pequeños para evitar solicitudes demasiado grandes.
    let sincronizadas = 0
    let fallidas = 0
    for (let pos = 0; pos < entradas.length; pos += 20) {
      const lote = entradas.slice(pos, pos + 20)
      const respuesta = await fetch(`${API_URL}/api/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          queue: lote.map(({ action, entity, data, client_id }) => ({
            action, entity, data, client_id,
          })),
        }),
      })
      const contenido = await respuesta.json().catch(() => null)
      if (!respuesta.ok) {
        throw new Error(contenido?.error || `Sincronización fallida (HTTP ${respuesta.status}).`)
      }

      const confirmadas = new Set([
        ...(contenido?.results?.synced || []),
        ...(contenido?.results?.duplicatesIgnored || []),
      ].map((item) => item.client_id).filter(Boolean))

      for (const entrada of lote) {
        if (confirmadas.has(entrada.client_id)) {
          // No borrar si el usuario cambió de cuenta durante el envío.
          if (obtenerIdVecinoActual() === owner_id) {
            await db.delete(OUTBOX_STORE, entrada.id)
            sincronizadas += 1
          }
        } else {
          fallidas += 1
        }
      }
    }
    return { sincronizadas, fallidas, pendientes: (await db.getAll(OUTBOX_STORE)).filter((r) => r.owner_id === owner_id).length }
  })()

  try {
    return await sincronizacionActiva
  } finally {
    sincronizacionActiva = null
  }
}
