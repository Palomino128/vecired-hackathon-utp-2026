import CategoryIcon from '../../components/CategoryIcon'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORIAS, ZONAS } from '../../data/demoData'
import { CENTROS_ZONA, CENTRO_AREQUIPA, ofertaAPunto } from '../../data/ubicaciones'
import OfferCard from '../../components/OfferCard'
import VeciRedMap from '../../components/map/VeciRedMap'
import './MapPage.css'

export default function MapPage({ ofertas, categoria, onCategoria, zona, onZona, busqueda, onBusqueda, onOpen, onPublish, enLinea, destacadoId }) {
  const [seleccionadoId, setSeleccionadoId] = useState(destacadoId || null)
  const [posicionUsuario, setPosicionUsuario] = useState(null)
  const [estadoGps, setEstadoGps] = useState('')

  useEffect(() => {
    if (destacadoId) setSeleccionadoId(destacadoId)
  }, [destacadoId])

  const ofertasFiltradas = useMemo(() => {
    const textoBuscado = busqueda.trim().toLocaleLowerCase('es')
    return ofertas.filter((oferta) => {
      const coincideCategoria = categoria === 'Todos' || oferta.categoria === categoria
      const coincideZona = zona === 'Todas las zonas' || oferta.zona === zona
      const texto = `${oferta.titulo} ${oferta.descripcion} ${oferta.categoria} ${oferta.zona}`.toLocaleLowerCase('es')
      return coincideCategoria && coincideZona && texto.includes(textoBuscado)
    })
  }, [ofertas, categoria, zona, busqueda])

  const puntos = useMemo(() => ofertasFiltradas.map(ofertaAPunto), [ofertasFiltradas])
  const seleccionado = ofertasFiltradas.find((oferta) => oferta.id === seleccionadoId) || null
  const centro = CENTROS_ZONA[zona] || CENTRO_AREQUIPA

  function localizar() {
    if (!navigator.geolocation) {
      setEstadoGps('Este dispositivo no permite consultar la ubicación. Puedes seleccionar tu zona manualmente.')
      return
    }
    setEstadoGps('Solicitando permiso de ubicación...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosicionUsuario({ lat: coords.latitude, lng: coords.longitude })
        setEstadoGps('Tu ubicación se muestra solo en tu dispositivo. No se guarda ni se publica.')
      },
      () => setEstadoGps('No fue posible obtener tu ubicación. Selecciona una zona del listado.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  return <section className="page container map-page" aria-labelledby="titulo-mapa">
    <div className="page-heading">
      <span className="eyebrow">EXPLORA CERCA DE TI</span>
      <h1 id="titulo-mapa">Mapa vecinal</h1>
      <p>Encuentra productos y servicios por barrio. Los marcadores de esta demostración son ficticios y aproximados.</p>
    </div>
    <div className="map-actions">
      <button type="button" className="button-outline" onClick={localizar}>⌖ Mi ubicación</button>
      <button type="button" className="button-primary" onClick={onPublish}>＋ Publicar</button>
    </div>
    {estadoGps && <p className="map-gps-status" role="status">{estadoGps}</p>}
    <label className="search-field"><span aria-hidden="true">⌕</span><input type="search" value={busqueda} onChange={(e) => onBusqueda(e.target.value)} placeholder="Buscar lasañas, oficios, clases..." aria-label="Buscar en el mapa" /></label>
    <div className="field-compact"><label htmlFor="mapa-zona">Zona de búsqueda</label><select id="mapa-zona" value={zona} onChange={(e) => onZona(e.target.value)}>{ZONAS.map((opcion) => <option key={opcion}>{opcion}</option>)}</select></div>
    <div className="chip-row" role="group" aria-label="Filtrar puntos por categoría">{CATEGORIAS.map((opcion) => <button key={opcion} type="button" className={`chip ${opcion === categoria ? 'selected' : ''}`} aria-pressed={opcion === categoria} onClick={() => { onCategoria(opcion); setSeleccionadoId(null) }}>{opcion}</button>)}</div>
    <div className="map-count" role="status"><strong>{ofertasFiltradas.length}</strong> ofertas de demostración en la zona seleccionada</div>
    {enLinea ? <>
      <VeciRedMap puntos={puntos} alSeleccionar={(punto) => setSeleccionadoId(punto.id)} posicionUsuario={posicionUsuario} destacadoId={seleccionadoId} centro={centro} />
      <p className="map-note">Mapa base: © OpenStreetMap. Los puntos son aproximados y no muestran domicilios reales.</p>
    </> : <div className="map-offline" role="status"><span aria-hidden="true"><CategoryIcon categoria="Alertas" /></span><strong>Mapa base no disponible sin internet</strong><p>En este prototipo puedes consultar la lista de ejemplo que ya viene con la aplicación. El almacenamiento offline real lo integrará el Integrante 4.</p></div>}
    {seleccionado && <div className="map-selected"><h2>Oferta seleccionada</h2><OfferCard oferta={seleccionado} onOpen={onOpen} /></div>}
    <div className="map-list-header"><h2>{enLinea ? 'Ofertas en el mapa' : 'Ofertas de ejemplo'}</h2><span>{ofertasFiltradas.length} resultados</span></div>
    <div className="offer-list">{ofertasFiltradas.length ? ofertasFiltradas.map((oferta) => <OfferCard key={oferta.id} oferta={oferta} onOpen={onOpen} />) : <div className="empty-state"><span><CategoryIcon categoria="Mapa" /></span><h3>No hay ofertas para mostrar</h3><p>Prueba cambiando la categoría, la zona o la búsqueda.</p></div>}</div>
    <p className="demo-disclaimer">Información ficticia para demostración. La conexión con PostgreSQL y los puntos de emergencia será implementada por los demás integrantes.</p>
  </section>
}
