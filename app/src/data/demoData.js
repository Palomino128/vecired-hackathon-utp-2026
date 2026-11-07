// Datos ficticios de demostración. No son ofertas ni valoraciones verificadas.
export const CATEGORIAS = ['Todos', 'Comida', 'Oficios', 'Clases', 'Mascotas', 'Hogar']
export const ZONAS = ['Todas las zonas', 'Cercado', 'Cayma', 'Yanahuara', 'José Luis Bustamante y Rivero', 'Cerro Colorado']
export const ICONOS = { Comida: '🍝', Oficios: '🧰', Clases: '📚', Mascotas: '🐾', Hogar: '🏡' }

export const OFERTAS_DEMO = [
  {
    id: 'demo-lasanas', titulo: 'Lasañas caseras', categoria: 'Comida', zona: 'Cercado',
    precio: 'Desde S/ 16', detalle: 'Lasañas recién horneadas, preparadas por encargo.',
    descripcion: 'Porciones individuales y familiares. Se coordinan horarios de recojo por mensaje.',
    vendedor: 'Emprendimiento local (demo)', icono: '🍝',
    opiniones: [{ autor: 'Vecino de muestra', puntuacion: 5, texto: 'Muy buena sazón y entrega puntual.' }],
  },
  {
    id: 'demo-gasfitero', titulo: 'Servicio de gasfitería', categoria: 'Oficios', zona: 'Yanahuara',
    precio: 'A cotizar', detalle: 'Reparaciones básicas de caños y tuberías.',
    descripcion: 'Atención de reparaciones domésticas; condiciones y disponibilidad por coordinar.',
    vendedor: 'Profesional local (demo)', icono: '🔧',
    opiniones: [{ autor: 'Vecino de muestra', puntuacion: 4, texto: 'Explicó claramente el trabajo realizado.' }],
  },
  {
    id: 'demo-clases', titulo: 'Clases de matemáticas', categoria: 'Clases', zona: 'Cayma',
    precio: 'A coordinar', detalle: 'Refuerzo escolar y preparación para evaluaciones.',
    descripcion: 'Clases individuales y grupales en horarios previamente coordinados.',
    vendedor: 'Docente particular (demo)', icono: '📚', opiniones: [],
  },
  {
    id: 'demo-postres', titulo: 'Pastelitos artesanales', categoria: 'Comida', zona: 'José Luis Bustamante y Rivero',
    precio: 'Desde S/ 8', detalle: 'Postres y pastelitos hechos por encargo.',
    descripcion: 'Opciones para reuniones familiares y celebraciones pequeñas.',
    vendedor: 'Emprendimiento local (demo)', icono: '🧁', opiniones: [],
  },
  {
    id: 'demo-mascotas', titulo: 'Paseo de mascotas', categoria: 'Mascotas', zona: 'Cerro Colorado',
    precio: 'A coordinar', detalle: 'Paseos cerca de casa en horarios acordados.',
    descripcion: 'Servicio de paseos para mascotas. Solicita detalles antes de contratar.',
    vendedor: 'Cuidador local (demo)', icono: '🐕', opiniones: [],
  },
  {
    id: 'demo-carpintero', titulo: 'Reparación de muebles', categoria: 'Hogar', zona: 'Cercado',
    precio: 'A cotizar', detalle: 'Ajustes y pequeñas reparaciones de muebles.',
    descripcion: 'Servicio de mantenimiento y arreglos menores de madera.',
    vendedor: 'Taller local (demo)', icono: '🪑', opiniones: [],
  },
]
