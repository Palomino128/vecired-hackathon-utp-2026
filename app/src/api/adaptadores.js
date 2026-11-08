
import { ICONOS } from '../data/demoData'

// Dirección del backend de VeciRed.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001'
).replace(/\/$/, '')

// Convierte una ruta de imagen almacenada en PostgreSQL
// en una dirección que el navegador pueda mostrar.
function obtenerUrlImagen(ruta) {
  if (typeof ruta !== 'string') return null

  // Solo se aceptan imágenes servidas por nuestro backend.
  const rutaValida =
    /^\/uploads\/[0-9a-f-]+\.webp$/i.test(ruta)

  if (!rutaValida) return null

  return `${API_URL}${ruta}`
}

// ============================================================
// POSTGRESQL → REACT
// Convierte las publicaciones de PostgreSQL al formato VeciRed.
// ============================================================

export function aOferta(datos) {
  const categoria = datos.category || 'Hogar'

  // Convertir las imágenes guardadas en PostgreSQL.
  const imagenes = Array.isArray(datos.images)
    ? datos.images
        .map(obtenerUrlImagen)
        .filter(Boolean)
    : []

  // Convertir las opiniones, si están disponibles.
  const opiniones = Array.isArray(datos.reviews)
    ? datos.reviews.map((opinion) => ({
        autor: opinion.reviewer_name || 'Vecino',
        puntuacion: Number(opinion.rating) || 0,
        texto: opinion.comment || '',
      }))
    : []

  return {
    id: datos.id,

    // Información de la publicación.
    titulo: datos.title || '',
    categoria,
    zona: datos.neighborhood || 'Zona vecinal',
    precio: datos.price_range || 'A coordinar',
    descripcion: datos.description || '',
    detalle: datos.detail || datos.description || '',

    // Información del vecino.
    vendedor:
      datos.author_name ||
      datos.seller_name ||
      'Vecino',

    // Icono de respaldo cuando no hay fotografías.
    icono:
      datos.icon ||
      ICONOS[categoria] ||
      '🏠',

    // Fotografías reales almacenadas en el backend.
    imagenes,

    // Coordenadas para el mapa.
    lat:
      datos.latitude == null
        ? null
        : Number(datos.latitude),

    lng:
      datos.longitude == null
        ? null
        : Number(datos.longitude),

    // Opiniones vecinales.
    opiniones,

    // Información adicional.
    origen: 'api',
  }
}

// ============================================================
// REACT → POSTGRESQL
// Convierte el formulario de React al formato del backend.
// ============================================================

export function aPublicacion(oferta) {
  return {
    title: oferta.titulo,
    description: oferta.descripcion,
    category: oferta.categoria,

    type:
      oferta.categoria === 'Comida'
        ? 'producto'
        : 'servicio',

    price_range:
      oferta.precio || 'A coordinar',

    neighborhood:
      oferta.zona || 'Cercado',
  }
}
