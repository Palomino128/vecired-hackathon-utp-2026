export default function Account({ onBack, onTutorial }) {
  return <section className="page container" aria-labelledby="cuenta-titulo">
    <button className="back-link" type="button" onClick={onBack}>‹ Volver al inicio</button>
    <div className="account-banner"><span aria-hidden="true">👤</span><div><h1 id="cuenta-titulo">Mi cuenta</h1><p>Accede para publicar y recomendar en VeciRed.</p></div></div>
    <div className="detail-panel"><h2>Registro e inicio de sesión</h2><p className="hint">El inicio de sesión real será implementado por el Integrante 2 mediante PostgreSQL y un servicio de autenticación. Esta pantalla todavía no crea cuentas.</p><div className="disabled-actions"><button type="button" disabled>Iniciar sesión · próximamente</button><button type="button" disabled>Crear cuenta · próximamente</button></div></div>
    <div className="detail-panel"><h2>Aprende a usar VeciRed</h2><p>Descubre cómo buscar productos, leer recomendaciones y publicar ofertas.</p><button type="button" className="button-outline" onClick={onTutorial}>Ver tutorial</button></div>
  </section>
}
