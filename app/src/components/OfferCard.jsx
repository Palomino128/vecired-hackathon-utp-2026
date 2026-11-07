export default function OfferCard({ oferta, onOpen }) {
  const numeroOpiniones = oferta.opiniones?.length ?? 0
  return (
    <button type="button" className="offer-card" onClick={() => onOpen(oferta)} aria-label={`Ver ${oferta.titulo}, ${oferta.zona}`}>
      <span className="offer-card-visual" aria-hidden="true">{oferta.icono}</span>
      <span className="offer-card-body">
        <span className="eyebrow">{oferta.categoria}</span>
        <span className="offer-card-title">{oferta.titulo}</span>
        <span className="offer-card-desc">{oferta.detalle}</span>
        <span className="offer-card-meta"><span>📍 {oferta.zona}</span><strong>{oferta.precio}</strong></span>
        <span className="offer-card-feedback">{numeroOpiniones ? `★ ${numeroOpiniones} opinión de ejemplo${numeroOpiniones > 1 ? 's' : ''}` : 'Sin opiniones todavía'}</span>
      </span>
      <span className="offer-card-chevron" aria-hidden="true">›</span>
    </button>
  )
}
