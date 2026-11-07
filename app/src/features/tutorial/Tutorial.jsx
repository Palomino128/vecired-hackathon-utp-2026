const PASOS = [
  { icono: '🔎', titulo: 'Encuentra lo que necesitas', detalle: 'Busca por categoría, palabra clave o zona del barrio.' },
  { icono: '⭐', titulo: 'Consulta recomendaciones', detalle: 'Abre cada ficha para leer el Visto Bueno Vecinal; las opiniones de esta demo son ficticias.' },
  { icono: '✍️', titulo: 'Comparte tu emprendimiento', detalle: 'Utiliza el botón Publicar y completa el formulario de tres pasos.' },
  { icono: '🤝', titulo: 'Conecta con tus vecinos', detalle: 'Las funciones de solidaridad y emergencias se integrarán desde los módulos del equipo.' },
]
export default function Tutorial({ onBack, onExplore }) {
  return <section className="page container" aria-labelledby="tutorial-titulo"><button className="back-link" type="button" onClick={onBack}>‹ Volver</button><div className="page-heading"><span className="eyebrow">GUÍA RÁPIDA</span><h1 id="tutorial-titulo">¿Cómo funciona VeciRed?</h1><p>Cuatro ideas para empezar a usar la aplicación.</p></div><div className="tutorial-list">{PASOS.map((paso, index) => <article key={paso.titulo} className="tutorial-step"><div className="tutorial-number">{index + 1}</div><div><span className="tutorial-emoji" aria-hidden="true">{paso.icono}</span><h2>{paso.titulo}</h2><p>{paso.detalle}</p></div></article>)}</div><button type="button" className="button-primary wide" onClick={onExplore}>Explorar ofertas →</button></section>
}
