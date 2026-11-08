import CategoryIcon from './CategoryIcon'
import LocationPinIcon from './LocationPinIcon'

import { useEffect, useState } from 'react'

export default function OfferCard({ oferta, onOpen }) {
  const imagen = Array.isArray(oferta.imagenes)
    ? oferta.imagenes[0]
    : null

  const [imagenFallida, setImagenFallida] = useState(false)

  useEffect(() => {
    setImagenFallida(false)
  }, [imagen])

  const mostrarImagen = Boolean(imagen) && !imagenFallida
  const numeroOpiniones = oferta.opiniones?.length ?? 0

  return (
    <button
      type="button"
      className="offer-card"
      onClick={() => onOpen(oferta)}
      aria-label={`Ver ${oferta.titulo}, ${oferta.zona}`}
    >
      <span
        className="offer-card-visual"
        aria-hidden="true"
        style={mostrarImagen ? { padding: 0, overflow: 'hidden' } : undefined}
      >
        {mostrarImagen ? (
          <img
            src={imagen}
            alt=""
            loading="lazy"
            onError={() => setImagenFallida(true)}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              minHeight: 90,
              objectFit: 'cover',
            }}
          />
        ) : (
          <CategoryIcon categoria={oferta.categoria} />
        )}
      </span>

      <span className="offer-card-body">
        <span className="eyebrow">
          {oferta.categoria}
        </span>

        <span className="offer-card-title">
          {oferta.titulo}
        </span>

        <span className="offer-card-desc">
          {oferta.detalle || oferta.descripcion}
        </span>

        <span className="offer-card-meta">
          <span className="vecired-location"><LocationPinIcon />{oferta.zona}</span>
          <strong>{oferta.precio}</strong>
        </span>

        <span className="offer-card-feedback">
          {numeroOpiniones
            ? `⭐ ${numeroOpiniones} ${
                numeroOpiniones === 1 ? 'opinión' : 'opiniones'
              }`
            : 'Sin opiniones todavía'}
        </span>
      </span>

      <span className="offer-card-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
