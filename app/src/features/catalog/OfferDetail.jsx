import CategoryIcon from '../../components/CategoryIcon'
import LocationPinIcon from '../../components/LocationPinIcon'

import { useEffect, useState } from 'react'

export default function OfferDetail({ oferta, onBack, onMap }) {
  const opiniones = oferta.opiniones || []

  const imagenes = Array.isArray(oferta.imagenes)
    ? oferta.imagenes.filter(Boolean)
    : []

  const [indiceImagen, setIndiceImagen] = useState(0)
  const [imagenFallida, setImagenFallida] = useState(false)

  useEffect(() => {
    setIndiceImagen(0)
    setImagenFallida(false)
  }, [oferta.id])

  const imagenActual = imagenes[indiceImagen]
  const mostrarImagen = Boolean(imagenActual) && !imagenFallida

  function seleccionarImagen(indice) {
    setIndiceImagen(indice)
    setImagenFallida(false)
  }

  return (
    <section
      className="page container"
      aria-labelledby="detalle-titulo"
    >
      <button
        className="back-link"
        type="button"
        onClick={onBack}
      >
        ‹ Volver a explorar
      </button>

      {/* Fotografía principal o icono de la categoría */}
      <div
        className="detail-hero"
        style={
          mostrarImagen
            ? { padding: 0, overflow: 'hidden' }
            : undefined
        }
      >
        {mostrarImagen ? (
          <img
            src={imagenActual}
            alt={`Fotografía ${indiceImagen + 1} de ${oferta.titulo}`}
            onError={() => setImagenFallida(true)}
            style={{
              display: 'block',
              width: '100%',
              maxHeight: 360,
              aspectRatio: '16 / 10',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span aria-hidden="true">
            {<CategoryIcon categoria={oferta.categoria} />}
          </span>
        )}
      </div>

      {/* Galería de fotografías */}
      {imagenes.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginTop: 12,
            marginBottom: 20,
          }}
          aria-label="Fotografías de la publicación"
        >
          {imagenes.map((imagen, indice) => (
            <button
              key={`${imagen}-${indice}`}
              type="button"
              aria-label={`Ver fotografía ${indice + 1}`}
              aria-pressed={indiceImagen === indice}
              onClick={() => seleccionarImagen(indice)}
              style={{
                padding: 0,
                border:
                  indiceImagen === indice
                    ? '3px solid #2563eb'
                    : '2px solid transparent',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              <img
                src={imagen}
                alt={`Miniatura ${indice + 1}`}
                loading="lazy"
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Datos de la oferta */}
      <span className="eyebrow">
        {oferta.categoria} · {oferta.zona}
      </span>

      <h1 className="detail-title" id="detalle-titulo">
        {oferta.titulo}
      </h1>

      <div className="detail-price">
        {oferta.precio}
      </div>

      <button
        type="button"
        className="button-outline offer-map-link"
        onClick={onMap}
      >
        <LocationPinIcon /> Ver zona en el mapa
      </button>

      <p className="detail-description">
        {oferta.descripcion || oferta.detalle}
      </p>

      {/* Información del vecino */}
      <div className="detail-panel">
        <h2>Información</h2>

        <p>
          <strong>Ofrecido por:</strong>{' '}
          {oferta.vendedor || 'Vecino de VeciRed'}
        </p>

        <p>
          <strong>Zona:</strong> {oferta.zona}
        </p>

        <p className="hint">
          La ubicación mostrada es aproximada.
        </p>
      </div>

      {/* Opiniones */}
      <div className="detail-panel">
        <div className="section-title">
          <h2>Visto Bueno Vecinal</h2>

          {oferta.origen !== 'api' && (
            <span>Demostración</span>
          )}
        </div>

        {opiniones.length > 0 ? (
          opiniones.map((opinion, indice) => {
            const puntuacion = Math.max(
              0,
              Math.min(5, Number(opinion.puntuacion) || 0)
            )

            return (
              <div
                key={`${oferta.id}-opinion-${indice}`}
                className="review"
              >
                <div>
                  <strong>{opinion.autor}</strong>

                  <span
                    className="review-stars"
                    aria-label={`${puntuacion} de 5 estrellas`}
                  >
                    {'★'.repeat(puntuacion)}
                    {'☆'.repeat(5 - puntuacion)}
                  </span>
                </div>

                <p>{opinion.texto}</p>
              </div>
            )
          })
        ) : (
          <p className="hint">
            Esta oferta todavía no tiene recomendaciones.
          </p>
        )}

        {oferta.origen !== 'api' && (
          <p className="hint">
            Las opiniones mostradas son de demostración.
          </p>
        )}
      </div>
    </section>
  )
}
