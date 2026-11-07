import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './VeciRedMap.css'
import { CENTRO_AREQUIPA } from '../../data/ubicaciones'

// Mapa reutilizable: no depende del catálogo. El Integrante 3 puede usarlo
// con puntos del muro solidario o de emergencias usando las mismas propiedades.
// punto: { id, lat, lng, titulo, categoria, zona, tipo }.
const COLORES = {
  Comida: '#de7b43', Oficios: '#187c85', Clases: '#6f6dd5',
  Mascotas: '#a65b85', Hogar: '#3f8964', solicitud: '#d34b4b',
  recurso: '#4179ca', oferta: '#168476',
}

export default function VeciRedMap({ puntos = [], alSeleccionar, posicionUsuario, destacadoId, centro = CENTRO_AREQUIPA }) {
  const contenedorRef = useRef(null)
  const mapaRef = useRef(null)
  const capaPuntosRef = useRef(null)
  const capaUsuarioRef = useRef(null)
  const onSelectRef = useRef(alSeleccionar)
  onSelectRef.current = alSeleccionar

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return undefined
    const mapa = L.map(contenedorRef.current, {
      zoomControl: false, scrollWheelZoom: false,
    }).setView([centro.lat, centro.lng], 12)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(mapa)
    L.control.zoom({ position: 'bottomright' }).addTo(mapa)
    capaPuntosRef.current = L.layerGroup().addTo(mapa)
    mapaRef.current = mapa
    // Soluciona mapas vacíos si se montan dentro de una pantalla React.
    const frame = window.requestAnimationFrame(() => mapa.invalidateSize())
    return () => {
      window.cancelAnimationFrame(frame)
      mapa.remove()
      mapaRef.current = null
      capaPuntosRef.current = null
      capaUsuarioRef.current = null
    }
    // El mapa se crea una única vez; centro se actualiza en el efecto siguiente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const capa = capaPuntosRef.current
    if (!capa) return
    capa.clearLayers()
    puntos.forEach((punto) => {
      if (!Number.isFinite(punto.lat) || !Number.isFinite(punto.lng)) return
      const color = COLORES[punto.categoria] || COLORES[punto.tipo] || '#0b786b'
      const marcador = L.circleMarker([punto.lat, punto.lng], {
        radius: punto.id === destacadoId ? 12 : 9,
        color: '#ffffff', weight: 3, fillColor: color, fillOpacity: 1,
      })
      const etiqueta = document.createElement('div')
      const titulo = document.createElement('strong')
      titulo.textContent = punto.titulo || 'Punto comunitario'
      const zona = document.createElement('div')
      zona.textContent = `${punto.zona || 'Zona'} · ubicación aproximada`
      etiqueta.append(titulo, zona)
      marcador.bindTooltip(etiqueta, { direction: 'top', offset: [0, -9] })
      marcador.on('click', () => onSelectRef.current?.(punto))
      marcador.addTo(capa)
    })
  }, [puntos, destacadoId])

  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    mapa.setView([centro.lat, centro.lng], 12, { animate: true })
  }, [centro.lat, centro.lng])

  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (capaUsuarioRef.current) {
      mapa.removeLayer(capaUsuarioRef.current)
      capaUsuarioRef.current = null
    }
    if (!posicionUsuario) return
    capaUsuarioRef.current = L.circleMarker([posicionUsuario.lat, posicionUsuario.lng], {
      radius: 9, color: '#ffffff', weight: 3,
      fillColor: '#2861c5', fillOpacity: 1,
    }).addTo(mapa)
    capaUsuarioRef.current.bindTooltip('Tu ubicación (solo en tu dispositivo)')
    mapa.setView([posicionUsuario.lat, posicionUsuario.lng], 14, { animate: true })
  }, [posicionUsuario])

  useEffect(() => {
    if (!destacadoId || !mapaRef.current) return
    const punto = puntos.find((item) => item.id === destacadoId)
    if (punto) mapaRef.current.panTo([punto.lat, punto.lng], { animate: true })
  }, [destacadoId, puntos])

  return <div ref={contenedorRef} className="vecired-leaflet-map" role="region" aria-label="Mapa interactivo de VeciRed en Arequipa" />
}
