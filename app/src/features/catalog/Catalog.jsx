import OfferCard from '../../components/OfferCard'
import { CATEGORIAS, ZONAS } from '../../data/demoData'

export default function Catalog({ ofertas, busqueda, onBusqueda, categoria, onCategoria, zona, onZona, onOpen, onMap }) {
  const consulta = busqueda.trim().toLocaleLowerCase('es')
  const filtradas = ofertas.filter((oferta) => {
    const porCategoria = categoria === 'Todos' || oferta.categoria === categoria
    const porZona = zona === 'Todas las zonas' || oferta.zona === zona
    const texto = `${oferta.titulo} ${oferta.categoria} ${oferta.descripcion} ${oferta.zona}`.toLocaleLowerCase('es')
    return porCategoria && porZona && texto.includes(consulta)
  })

  return (
    <section className="page container" aria-labelledby="explorar-titulo">
      <div className="page-heading"><span className="eyebrow">MERCADO VECINAL</span><h1 id="explorar-titulo">Explora tu barrio</h1><p>Descubre productos y servicios cerca de ti.</p></div>
      <label className="search-field"><span aria-hidden="true">⌕</span><input type="search" placeholder="Lasañas, gasfitero, clases..." aria-label="Buscar productos y servicios" value={busqueda} onChange={(e) => onBusqueda(e.target.value)} /></label>
      <div className="field-compact"><label htmlFor="zona-filtro">Zona de búsqueda</label><select id="zona-filtro" value={zona} onChange={(e) => onZona(e.target.value)}>{ZONAS.map((opcion) => <option key={opcion}>{opcion}</option>)}</select></div>
      <div className="chip-row" role="group" aria-label="Filtrar por categoría">
        {CATEGORIAS.map((opcion) => <button key={opcion} type="button" className={`chip ${categoria === opcion ? 'selected' : ''}`} aria-pressed={categoria === opcion} onClick={() => onCategoria(opcion)}>{opcion}</button>)}
      </div>
      <div className="list-heading"><h2>Resultados</h2><button type="button" className="map-inline-button" onClick={onMap}>📍 Ver mapa</button><span>{filtradas.length} encontrados</span></div>
      <div className="offer-list">
        {filtradas.length > 0 ? filtradas.map((oferta) => <OfferCard key={oferta.id} oferta={oferta} onOpen={onOpen} />) : <div className="empty-state"><span>🔎</span><h3>No hay resultados</h3><p>Prueba con otra categoría, zona o palabra.</p><button className="button-outline" type="button" onClick={() => { onCategoria('Todos'); onZona('Todas las zonas'); onBusqueda('') }}>Borrar filtros</button></div>}
      </div>
      <p className="demo-disclaimer">Contenido ficticio de demostración; las ofertas no representan negocios verificados.</p>
    </section>
  )
}
