// Íconos SVG coherentes para categorías y acciones de la interfaz.
export default function CategoryIcon({ categoria = '', size = 24 }) {
  const tipo = String(categoria).toLocaleLowerCase('es')
  let dibujo
  if (tipo.includes('comida')) {
    dibujo = <><path d="M4 3v8a4 4 0 0 0 4 4V3M4 7h4M8 15v6" /><path d="M17 3c-3 3-3 9 0 11v7M17 3v11h3" /></>
  } else if (tipo.includes('oficio') || tipo.includes('servicio')) {
    dibujo = <><path d="M14 7a6 6 0 0 0-8 8l-4 4a2 2 0 0 0 3 3l4-4a6 6 0 0 0 8-8l-4 4-3-3 4-4Z" /></>
  } else if (tipo.includes('clase') || tipo.includes('tutorial') || tipo.includes('enseñ')) {
    dibujo = <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1ZM12 6v14" /></>
  } else if (tipo.includes('mascota')) {
    dibujo = <><circle cx="7" cy="8" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="17" cy="8" r="1" /><path d="M7 16c0-3 3-5 5-5s5 2 5 5-2 4-5 3c-3 1-5 0-5-3Z" /></>
  } else if (tipo.includes('hogar')) {
    dibujo = <><path d="m3 11 9-8 9 8v9H3v-9M9 20v-7h6v7" /></>
  } else if (tipo.includes('mapa')) {
    dibujo = <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>
  } else if (tipo.includes('perfil')) {
    dibujo = <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
  } else if (tipo.includes('alerta') || tipo.includes('emergencia')) {
    dibujo = <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 4h.01" /></>
  } else if (tipo.includes('ayuda') || tipo.includes('solidar')) {
    dibujo = <><path d="M12 21s-8-5-8-11a5 5 0 0 1 8-3.5A5 5 0 0 1 20 10c0 6-8 11-8 11Z" /></>
  } else if (tipo.includes('buscar') || tipo.includes('explorar')) {
    dibujo = <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>
  } else if (tipo.includes('publicar')) {
    dibujo = <><path d="M12 5v14M5 12h14" /></>
  } else if (tipo.includes('opiniones')) {
    dibujo = <><path d="m12 2 3 6 7 .9-5 5 1.3 7L12 17.6 5.7 21 7 14l-5-5 7-.9L12 2Z" /></>
  } else {
    dibujo = <><path d="m3 7 9-4 9 4v11l-9 4-9-4V7ZM3 7l9 4 9-4M12 11v11" /></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{dibujo}</svg>
}
