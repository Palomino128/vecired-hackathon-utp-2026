export default function OfferDetail({ oferta, onBack, onMap }) {
  const opiniones = oferta.opiniones || []
  return (
    <section className="page container" aria-labelledby="detalle-titulo">
      <button className="back-link" type="button" onClick={onBack}>‹ Volver a explorar</button>
      <div className="detail-hero" aria-hidden="true">{oferta.icono}</div>
      <span className="eyebrow">{oferta.categoria} · {oferta.zona}</span>
      <h1 className="detail-title" id="detalle-titulo">{oferta.titulo}</h1>
      <div className="detail-price">{oferta.precio}</div><button type="button" className="button-outline offer-map-link" onClick={onMap}>📍 Ver zona en el mapa</button>
      <p className="detail-description">{oferta.descripcion || oferta.detalle}</p>
      <div className="detail-panel"><h2>Información</h2><p><strong>Ofrecido por:</strong> {oferta.vendedor}</p><p><strong>Zona:</strong> {oferta.zona} (ubicación aproximada)</p><p className="hint">El contacto estará disponible al integrar cuentas y publicaciones con el backend.</p></div>
      <div className="detail-panel"><div className="section-title"><h2>Visto Bueno Vecinal</h2><span>Demostración</span></div>
        {opiniones.length ? opiniones.map((opinion, indice) => <div key={`${oferta.id}-opinion-${indice}`} className="review"><div><strong>{opinion.autor}</strong><span className="review-stars" aria-label={`${opinion.puntuacion} de 5 estrellas`}>{'★'.repeat(opinion.puntuacion)}{'☆'.repeat(5 - opinion.puntuacion)}</span></div><p>{opinion.texto}</p></div>) : <p className="hint">Esta oferta todavía no tiene recomendaciones de ejemplo.</p>}
        <p className="hint">Estas opiniones son ficticias. Las reseñas auténticas se conectarán con PostgreSQL.</p>
      </div>
    </section>
  )
}
