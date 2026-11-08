import { useEffect, useState } from 'react'
import { CATEGORIAS, ICONOS, ZONAS } from '../../data/demoData'
import { saveToOutbox } from '../../offline/syncManager'

const INICIAL = { titulo: '', categoria: 'Comida', descripcion: '', zona: 'Cercado', precio: '' }

export default function PublishWizard({ onClose, onCreate }) {
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState(INICIAL)
  const [error, setError] = useState('')
  const [alertaOffline, setAlertaOffline] = useState('')

  useEffect(() => {
    const cerrarEsc = (evento) => { if (evento.key === 'Escape') onClose() }
    window.addEventListener('keydown', cerrarEsc)
    return () => window.removeEventListener('keydown', cerrarEsc)
  }, [onClose])

  const cambiar = (campo, valor) => { setDatos((actual) => ({ ...actual, [campo]: valor })); setError('') }
  function siguiente() {
    if (paso === 2 && (!datos.titulo.trim() || !datos.descripcion.trim())) {
      setError('Escribe un título y una descripción para continuar.')
      return
    }
    setError('')
    setPaso((actual) => Math.min(3, actual + 1))
  }
  async function crear(evento) {
    evento.preventDefault()
    if (!datos.titulo.trim() || !datos.descripcion.trim() || !datos.zona) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    const nuevaOferta = {
      id: `local-${Date.now()}`, titulo: datos.titulo.trim(), categoria: datos.categoria,
      descripcion: datos.descripcion.trim(), detalle: datos.descripcion.trim(),
      zona: datos.zona, precio: datos.precio.trim() || 'A coordinar',
      icono: ICONOS[datos.categoria] || '🏠', vendedor: 'Mi publicación (solo demo)', opiniones: [],
    }

    if (!navigator.onLine) {
      await saveToOutbox(nuevaOferta)
      setAlertaOffline('Guardado localmente. Se sincronizará al recuperar la conexión')
      setTimeout(() => {
        setAlertaOffline('')
        onCreate(nuevaOferta)
      }, 1800)
      return
    }

    onCreate(nuevaOferta)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onClose() }}>
      <section className="wizard" role="dialog" aria-modal="true" aria-labelledby="publicar-titulo">
        <header className="wizard-header"><div><span className="eyebrow">PUBLICACIÓN DEMO</span><h2 id="publicar-titulo">Publicar una oferta</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Cerrar formulario">×</button></header>
        <div className="steps-label">Paso {paso} de 3</div>
        <div className="steps-progress" aria-hidden="true"><span style={{ width: `${(paso / 3) * 100}%` }} /></div>
        <form onSubmit={crear}>
          {paso === 1 && <div className="wizard-stage"><h3>¿Qué vas a ofrecer?</h3><p>Elige una categoría para que tus vecinos puedan encontrarte.</p><div className="category-grid">{CATEGORIAS.filter((item) => item !== 'Todos').map((item) => <button type="button" key={item} aria-pressed={datos.categoria === item} className={`category-option ${datos.categoria === item ? 'chosen' : ''}`} onClick={() => cambiar('categoria', item)}><span>{ICONOS[item]}</span>{item}</button>)}</div></div>}
          {paso === 2 && <div className="wizard-stage"><h3>Cuéntanos qué ofreces</h3><label className="form-label">Nombre del producto o servicio<input autoFocus maxLength={70} placeholder="Ej. Lasañas caseras" value={datos.titulo} onChange={(e) => cambiar('titulo', e.target.value)} /></label><label className="form-label">Descripción<textarea maxLength={280} rows={5} placeholder="Describe tu producto o servicio..." value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} /></label></div>}
          {paso === 3 && <div className="wizard-stage"><h3>¿Dónde lo ofreces?</h3><label className="form-label">Zona o barrio<select value={datos.zona} onChange={(e) => cambiar('zona', e.target.value)}>{ZONAS.filter((zona) => zona !== 'Todas las zonas').map((zona) => <option key={zona}>{zona}</option>)}</select></label><label className="form-label">Precio o modalidad (opcional)<input maxLength={60} placeholder="Ej. Desde S/ 15, A coordinar" value={datos.precio} onChange={(e) => cambiar('precio', e.target.value)} /></label><div className="info-panel">Esta publicación se mostrará únicamente en tu sesión actual. Aún no se guarda ni se envía a otros vecinos.</div></div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {alertaOffline && (
            <p
              role="status"
              aria-live="polite"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                marginTop: '10px',
                textAlign: 'center',
              }}
            >
              {alertaOffline}
            </p>
          )}
          <div className="wizard-actions">{paso > 1 && <button className="button-outline" type="button" onClick={() => { setPaso((actual) => actual - 1); setError('') }}>Atrás</button>}{paso < 3 ? <button className="button-primary" type="button" onClick={siguiente}>Continuar →</button> : <button className="button-primary" type="submit">Publicar demostración</button>}</div>
        </form>
      </section>
    </div>
  )
}
