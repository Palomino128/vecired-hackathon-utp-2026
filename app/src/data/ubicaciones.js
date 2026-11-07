// Referencias aproximadas de ZONAS de Arequipa, NO domicilios ni ubicaciones verificadas.
// Datos ficticios utilizados exclusivamente para demostrar el mapa de VeciRed.
export const CENTROS_ZONA = {
  Cercado: { lat: -16.3988, lng: -71.5369 },
  Cayma: { lat: -16.3769, lng: -71.5462 },
  Yanahuara: { lat: -16.3913, lng: -71.5481 },
  'José Luis Bustamante y Rivero': { lat: -16.4245, lng: -71.5211 },
  'Cerro Colorado': { lat: -16.3608, lng: -71.5704 },
}
export const CENTRO_AREQUIPA = { lat: -16.3988, lng: -71.5369 }

const variaciones = [
  { lat: 0.0014, lng: -0.0016 },
  { lat: -0.0009, lng: 0.0013 },
  { lat: 0.0006, lng: 0.0017 },
  { lat: -0.0017, lng: -0.0007 },
]

export function ofertaAPunto(oferta, indice = 0) {
  const centro = CENTROS_ZONA[oferta.zona] || CENTRO_AREQUIPA
  // En la DEMO, la ubicación se dispersa ligeramente dentro del barrio para
  // evitar confundir el marcador con el domicilio exacto del vecino.
  const delta = variaciones[indice % variaciones.length]
  return {
    id: oferta.id,
    lat: centro.lat + delta.lat,
    lng: centro.lng + delta.lng,
    titulo: oferta.titulo,
    categoria: oferta.categoria,
    zona: oferta.zona,
    tipo: 'oferta',
    origen: 'demo',
    oferta,
  }
}
