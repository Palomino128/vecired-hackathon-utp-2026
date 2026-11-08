// Cinco accesos principales, todos con iconos SVG del mismo estilo.
// Alertas se consulta desde Ayuda; Mi cuenta permanece en la cabecera.

const ENLACES = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'explorar', etiqueta: 'Explorar' },
  { id: 'publicar', etiqueta: 'Publicar' },
  { id: 'mapa', etiqueta: 'Mapa' },
  { id: 'solidaridad', etiqueta: 'Ayuda' },
]


function Icono({ id }) {
  const formas = {
    inicio: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-7h6v7" /></>,
    explorar: <><circle cx="11" cy="11" r="7" /><path d="m16.2 16.2 4.1 4.1" /></>,
    mapa: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    publicar: <><path d="M12 5v14M5 12h14" /></>,
    solidaridad: <><path d="M12 21s-8.6-5.2-8.6-11.2A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.6 3.3C20.6 15.8 12 21 12 21Z" /></>,
  }
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {formas[id]}
    </svg>
  )
}

export default function BottomNav({ actual, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ENLACES.map(({ id, etiqueta }) => {
        const activo = actual === id || (id === 'solidaridad' && actual === 'emergencia')
        return (
          <button
            key={id} type="button" onClick={() => onNavigate(id)}
            className={`bottom-nav-item${activo ? ' active' : ''}${id === 'publicar' ? ' is-publish' : ''}`}
            aria-current={activo ? 'page' : undefined}
            aria-label={id === 'publicar' ? 'Crear publicación' : etiqueta}
          >
            <span className="bottom-nav-icon"><Icono id={id} /></span>
            <span className="bottom-nav-label">{etiqueta}</span>
          </button>
        )
      })}
    </nav>
  )
}
