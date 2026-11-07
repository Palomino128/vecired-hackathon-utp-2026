const ENLACES = [
  { id: 'inicio', icono: '⌂', etiqueta: 'Inicio' },
  { id: 'explorar', icono: '⌕', etiqueta: 'Explorar' },
  { id: 'mapa', icono: '📍', etiqueta: 'Mapa' },
  { id: 'publicar', icono: '+', etiqueta: 'Publicar' },
  { id: 'solidaridad', icono: '♡', etiqueta: 'Ayuda' },
  { id: 'emergencia', icono: '!', etiqueta: 'Alertas' },
]
export default function BottomNav({ actual, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ENLACES.map(({ id, icono, etiqueta }) => (
        <button key={id} type="button" onClick={() => onNavigate(id)}
          className={`bottom-nav-item ${actual === id ? 'active' : ''} ${id === 'publicar' ? 'is-publish' : ''}`}
          aria-current={actual === id ? 'page' : undefined}>
          <span className="bottom-nav-icon" aria-hidden="true">{icono}</span>
          <span>{etiqueta}</span>
        </button>
      ))}
    </nav>
  )
}
