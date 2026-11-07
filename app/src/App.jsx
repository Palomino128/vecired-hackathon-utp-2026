import { useEffect, useMemo, useState } from 'react'
import './App.css'

const datosDemo = [
  { id: 'demo-1', titulo: 'Lasañas caseras', categoria: 'Comida', icono: '🍝', zona: 'Cercado', precio: 'Desde S/ 16', detalle: 'Preparadas por una emprendedora del barrio.' },
  { id: 'demo-2', titulo: 'Servicio de gasfitería', categoria: 'Oficios', icono: '🔧', zona: 'Yanahuara', precio: 'Consultar', detalle: 'Reparaciones y mantenimiento del hogar.' },
  { id: 'demo-3', titulo: 'Clases de matemáticas', categoria: 'Clases', icono: '📚', zona: 'Cayma', precio: 'Consultar', detalle: 'Apoyo escolar y preparación de exámenes.' },
  { id: 'demo-4', titulo: 'Pastelitos artesanales', categoria: 'Comida', icono: '🧁', zona: 'José Luis Bustamante', precio: 'Desde S/ 8', detalle: 'Postres preparados por encargo.' },
  { id: 'demo-5', titulo: 'Paseo de mascotas', categoria: 'Otros', icono: '🐕', zona: 'Cercado', precio: 'Consultar', detalle: 'Paseos programados cerca de casa.' },
]

const categorias = ['Todos', 'Comida', 'Oficios', 'Clases', 'Otros']
const iconosCategoria = { Comida: '🍽️', Oficios: '🛠️', Clases: '🎓', Otros: '🐾' }

function TarjetaServicio({ item }) {
  return (
    <article className="servicio-card">
      <div className="servicio-icono" aria-hidden="true">{item.icono}</div>
      <div className="servicio-contenido">
        <div className="servicio-etiqueta">{item.categoria}</div>
        <h3>{item.titulo}</h3>
        <p>{item.detalle}</p>
        <div className="servicio-meta"><span>📍 {item.zona}</span><strong>{item.precio}</strong></div>
      </div>
    </article>
  )
}

function PanelPendiente({ simbolo, titulo, descripcion, responsable, onVolver }) {
  return (
    <section className="pendiente">
      <div className="pendiente-icono" aria-hidden="true">{simbolo}</div>
      <h2>{titulo}</h2>
      <p>{descripcion}</p>
      <div className="pendiente-responsable">Próximamente: implementación del {responsable}.</div>
      <button type="button" className="boton-secundario" onClick={onVolver}>Volver al inicio</button>
    </section>
  )
}

function App() {
  const [pestana, setPestana] = useState('inicio')
  const [categoria, setCategoria] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [publicaciones, setPublicaciones] = useState(datosDemo)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enLinea, setEnLinea] = useState(navigator.onLine)
  const [formulario, setFormulario] = useState({ titulo: '', categoria: 'Comida', zona: '', detalle: '' })

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine)
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
    }
  }, [])

  const filtrados = useMemo(() => publicaciones.filter((item) => {
    const coincideCategoria = categoria === 'Todos' || item.categoria === categoria
    const texto = `${item.titulo} ${item.detalle} ${item.zona}`.toLocaleLowerCase('es')
    return coincideCategoria && texto.includes(busqueda.trim().toLocaleLowerCase('es'))
  }), [publicaciones, categoria, busqueda])

  function abrirPublicar() {
    setMensaje('')
    setFormularioAbierto(true)
  }

  function agregarPublicacion(evento) {
    evento.preventDefault()
    const nueva = {
      id: `local-${Date.now()}`,
      titulo: formulario.titulo.trim(),
      categoria: formulario.categoria,
      icono: iconosCategoria[formulario.categoria],
      zona: formulario.zona.trim(),
      precio: 'Consultar',
      detalle: formulario.detalle.trim(),
    }
    if (!nueva.titulo || !nueva.zona || !nueva.detalle) return
    setPublicaciones((anterior) => [nueva, ...anterior])
    setFormulario({ titulo: '', categoria: 'Comida', zona: '', detalle: '' })
    setCategoria('Todos')
    setBusqueda('')
    setFormularioAbierto(false)
    setPestana('explorar')
    setMensaje('Publicación de prueba agregada. Solo existe en esta sesión; todavía no se guardó en la nube.')
  }

  function navegar(nueva) {
    if (nueva === 'publicar') return abrirPublicar()
    setMensaje('')
    setPestana(nueva)
  }

  return (
    <div className="aplicacion">
      <header className="cabecera">
        <div className="marca"><span className="marca-icono">V</span><span>Veci<span className="marca-verde">Red</span></span></div>
        <span className={`estado-red ${enLinea ? 'conectado' : 'desconectado'}`}>
          <span className="estado-punto" /> {enLinea ? 'En línea' : 'Sin conexión'}
        </span>
      </header>

      <main className="contenido-principal">
        {pestana === 'inicio' && (
          <>
            <section className="hero">
              <span className="hero-etiqueta">✦ TU COMUNIDAD, MÁS CERCA</span>
              <h1>Descubre lo mejor de tu barrio.</h1>
              <p>Encuentra productos y servicios locales, comparte recomendaciones y apoya a tus vecinos.</p>
              <button className="boton-hero" type="button" onClick={() => navegar('explorar')}>Explorar mi barrio <span aria-hidden="true">→</span></button>
            </section>

            <section className="seccion">
              <div className="seccion-titulos"><h2>¿Qué necesitas hoy?</h2><span className="subtitulo">Explora por categoría</span></div>
              <div className="accesos">
                {categorias.filter((c) => c !== 'Todos').map((c) => (
                  <button type="button" key={c} className="acceso" onClick={() => { setCategoria(c); navegar('explorar') }}>
                    <span className="acceso-icono">{iconosCategoria[c]}</span><span>{c}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="seccion">
              <div className="titulo-con-accion"><h2>En tu comunidad</h2><button type="button" onClick={() => navegar('explorar')}>Ver todo →</button></div>
              <div className="lista-servicios">{publicaciones.slice(0, 3).map((item) => <TarjetaServicio key={item.id} item={item} />)}</div>
            </section>
            <div className="nota-demo">🧪 Datos de demostración. Los negocios y recomendaciones mostrados no están verificados.</div>
          </>
        )}

        {pestana === 'explorar' && (
          <section className="seccion explorar">
            <h1>Explora tu barrio</h1>
            <p className="texto-ayuda">Productos y servicios que puedes descubrir cerca de ti.</p>
            <label className="buscador"><span aria-hidden="true">🔎</span><input aria-label="Buscar productos o servicios" placeholder="Buscar lasañas, gasfitero, clases..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label>
            <div className="filtros" aria-label="Filtrar por categoría">
              {categorias.map((c) => <button type="button" key={c} aria-pressed={categoria === c} className={`filtro ${categoria === c ? 'activo' : ''}`} onClick={() => setCategoria(c)}>{c}</button>)}
            </div>
            {mensaje && <p className="mensaje" role="status">{mensaje}</p>}
            <p className="contador">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} · datos de muestra</p>
            <div className="lista-servicios">
              {filtrados.length ? filtrados.map((item) => <TarjetaServicio key={item.id} item={item} />) : <p className="sin-resultados">No encontramos coincidencias. Prueba con otra búsqueda.</p>}
            </div>
          </section>
        )}

        {pestana === 'solidaridad' && <PanelPendiente simbolo="🤝" titulo="Red de solidaridad" descripcion="Aquí aparecerán las solicitudes de ayuda, préstamos, donaciones e intercambios vecinales." responsable="Integrante 3" onVolver={() => navegar('inicio')} />}
        {pestana === 'emergencia' && <PanelPendiente simbolo="🚨" titulo="Modo emergencia" descripcion="Aquí se consultarán los recursos disponibles y solicitudes urgentes. Esta pantalla todavía no ofrece asistencia ni envía alertas." responsable="Integrante 3" onVolver={() => navegar('inicio')} />}
      </main>

      <nav className="navegacion" aria-label="Navegación principal">
        {[
          ['inicio', '⌂', 'Inicio'],
          ['explorar', '⌕', 'Explorar'],
          ['publicar', '+', 'Publicar'],
          ['solidaridad', '♡', 'Ayuda'],
          ['emergencia', '!', 'Alertas'],
        ].map(([clave, icono, texto]) => (
          <button key={clave} type="button" className={`nav-item ${pestana === clave ? 'seleccionado' : ''} ${clave === 'publicar' ? 'nav-publicar' : ''}`} onClick={() => navegar(clave)} aria-current={pestana === clave ? 'page' : undefined}>
            <span className="nav-icono" aria-hidden="true">{icono}</span><span>{texto}</span>
          </button>
        ))}
      </nav>

      {formularioAbierto && <div className="modal-fondo" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setFormularioAbierto(false) }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div className="modal-encabezado"><h2 id="modal-titulo">Publicar un servicio</h2><button type="button" className="cerrar" aria-label="Cerrar formulario" onClick={() => setFormularioAbierto(false)}>×</button></div>
          <p className="texto-ayuda">Versión de prueba: la publicación solo se verá hasta recargar la página.</p>
          <form onSubmit={agregarPublicacion} className="formulario">
            <label>¿Qué ofreces?<input required maxLength={70} placeholder="Ej. Postres caseros" value={formulario.titulo} onChange={(e) => setFormulario((v) => ({ ...v, titulo: e.target.value }))} /></label>
            <label>Categoría<select value={formulario.categoria} onChange={(e) => setFormulario((v) => ({ ...v, categoria: e.target.value }))}>{categorias.filter((c) => c !== 'Todos').map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Zona o barrio<input required maxLength={60} placeholder="Ej. Cayma" value={formulario.zona} onChange={(e) => setFormulario((v) => ({ ...v, zona: e.target.value }))} /></label>
            <label>Descripción<textarea required rows={3} maxLength={260} placeholder="Describe tu producto o servicio" value={formulario.detalle} onChange={(e) => setFormulario((v) => ({ ...v, detalle: e.target.value }))} /></label>
            <button type="submit" className="boton-principal">Agregar publicación de prueba</button>
          </form>
        </section>
      </div>}
    </div>
  )
}

export default App
