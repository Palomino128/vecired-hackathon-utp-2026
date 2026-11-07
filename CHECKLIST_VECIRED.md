# VeciRed — Lista maestra de control

**Proyecto:** Hackathon UTP – El Comercio 2026  
**Producto:** aplicación móvil instalable (PWA *mobile-first*) para economía de proximidad, recomendaciones vecinales, solidaridad y emergencias.  
**Estado:** las casillas comienzan desmarcadas; marcar solo cuando exista código integrado y evidencia de prueba.  
**Rama estable:** `main`.

> **Alcance de las 48 horas:** entregar una versión mínima funcional e integrada. La aplicación debe funcionar conectada y ofrecer funciones **limitadas pero reales** sin internet. No afirmar que envía alertas a otros dispositivos mientras no exista conectividad.

## 0. Organización y control de versiones — Prioridad P0

- [ ] **ORG-01** Crear el repositorio `VeciRed-Hackathon-UTP-2026` con `README.md` y `.gitignore` para Node. **Responsable:** Integrante 1.
- [ ] **ORG-02** Invitar a los otros tres integrantes y confirmar que todos pueden clonar el repositorio. **Responsable:** Integrante 1.
- [ ] **ORG-03** Inicializar React + Vite en `app/` y verificar `npm install`, `npm run dev` y `npm run build`. **Responsable:** Integrante 1.
- [ ] **ORG-04** Publicar en `main` una estructura común y carpetas por módulo antes de abrir ramas. **Responsable:** Integrante 1, con acuerdo del equipo.
- [ ] **ORG-05** Crear y publicar las ramas `feature/frontend`, `feature/backend`, `feature/solidaridad`, `feature/offline-integracion`, todas desde la misma base de `main`. **Responsable:** cada integrante crea su rama.
- [ ] **ORG-06** Acordar el formato de datos y las funciones compartidas (contratos de API), antes de conectar pantallas al backend. **Responsables:** Integrantes 1, 2, 3 y 4.
- [ ] **ORG-07** Mantener `main` estable: integrar mediante *Pull Requests*, con revisión y ejecución de pruebas. **Coordinador:** Integrante 4; **apoyo:** dueño de cada módulo.
- [ ] **ORG-08** Añadir `.env.example` sin secretos y excluir `.env`, `node_modules/` y datos personales del repositorio. **Responsable:** Integrante 2.

## 1. Interfaz móvil y mercado local — Integrante 1

### Código — Prioridad P0

- [ ] **UI-01** Crear diseño *mobile-first*: pantalla vertical, tamaños táctiles adecuados, textos legibles y navegación inferior.
- [ ] **UI-02** Implementar inicio con buscador, categorías y accesos a Mercado, Solidaridad y Emergencias.
- [ ] **UI-03** Implementar listado de productos y servicios del barrio, con tarjetas y estados de carga/vacío/error.
- [ ] **UI-04** Agregar filtros por categoría y zona/cercanía; indicar cuando no haya permiso de ubicación.
- [ ] **UI-05** Implementar detalle de oferta: nombre, descripción, precio o modalidad, contacto, zona aproximada y recomendaciones.
- [ ] **UI-06** Crear formulario para publicar productos y servicios mediante un flujo sencillo de **máximo tres pasos de pantalla**; validar los campos.
- [ ] **UI-07** Implementar componentes visuales de registro, acceso y perfil; usar el servicio de autenticación del Integrante 2.
- [ ] **UI-08** Crear vista de tutorial breve y guía de iconos/acciones.
- [ ] **UI-09** Crear componentes compartidos (botones, tarjetas, campos, alertas y estados) para que el Integrante 3 los reutilice.
- [ ] **UI-10** Integrar las pantallas con funciones de consulta/publicación del Integrante 2, sin duplicar lógica de base de datos.

### Documentación — Prioridad P0

- [ ] **DOC-UI-01** `docs/01_diseno_ux.md`: usuarios objetivo, estructura de navegación, pantallas y decisiones de accesibilidad.
- [ ] **DOC-UI-02** Adjuntar capturas o enlaces del prototipo y explicar el flujo de publicación.

### Criterio de aceptación

- [ ] **TEST-UI** En un teléfono Android, el usuario puede navegar, buscar un servicio, abrir su ficha y completar una publicación; no hay desbordamiento horizontal.

## 2. Backend, cuentas y recomendaciones — Integrante 2

### Código — Prioridad P0

- [ ] **BE-01** Crear proyecto Supabase y documentar variables de entorno necesarias.
- [ ] **BE-02** Definir tablas de perfiles, categorías, ofertas/productos/servicios, recomendaciones, solicitudes solidarias, respuestas, grupos de apoyo y recursos de emergencia.
- [ ] **BE-03** Establecer relaciones, índices básicos, restricciones y migraciones SQL versionadas en `supabase/`.
- [ ] **BE-04** Implementar registro, inicio y cierre de sesión; vincular cada contenido a su autor.
- [ ] **BE-05** Implementar consultar, crear y editar publicaciones; controlar que solo el autor pueda cambiarlas.
- [ ] **BE-06** Implementar categorías, búsqueda y filtros por zona; exponer un formato de respuesta acordado.
- [ ] **BE-07** Implementar «Visto Bueno Vecinal»: valoración y comentario ligados a usuarios autenticados, con reglas contra duplicados básicos y sin presentar opiniones como verificadas sin evidencia.
- [ ] **BE-08** Implementar las operaciones de solicitudes solidarias, respuestas, actualización de estado y recursos de emergencia que consumirá el Integrante 3.
- [ ] **BE-09** Configurar políticas **Row Level Security (RLS)** y permisos mínimos; no incluir claves `service_role` o secretos en el frontend.
- [ ] **BE-10** Preparar datos ficticios de demostración etiquetados como tales, sin publicar información privada real.

### Documentación — Prioridad P0

- [ ] **DOC-BE-01** `docs/02_arquitectura_datos.md`: arquitectura, diagrama entidad-relación, tablas y permisos.
- [ ] **DOC-BE-02** Especificar los contratos de funciones (`getOfertas`, `crearOferta`, `getSolicitudes`, `crearSolicitud`, etc.) y los campos que devuelve cada una.

### Criterio de aceptación

- [ ] **TEST-BE** Dos cuentas distintas pueden leer ofertas y crear las suyas, pero ninguna puede modificar o eliminar los contenidos de la otra sin permiso.

## 3. Economía solidaria y modo emergencia — Integrante 3

### Código — Prioridad P0

- [ ] **SOL-01** Crear muro de solicitudes y ofrecimientos con categorías: préstamo, donación, intercambio, ayuda/servicio y movilidad solidaria básica.
- [ ] **SOL-02** Permitir crear solicitudes y ofrecimientos con descripción, zona aproximada y disponibilidad; reutilizar las funciones del Integrante 2.
- [ ] **SOL-03** Permitir responder «Puedo ayudar» y gestionar estados: abierta, en proceso y resuelta.
- [ ] **SOL-04** Crear vista «Modo emergencia» con solicitudes prioritarias, etiquetas de urgencia y recursos de apoyo.
- [ ] **SOL-05** Mostrar directorio de grupos de apoyo y recursos críticos, sin asegurar que estén disponibles en tiempo real si no se ha confirmado.
- [ ] **SOL-06** Mostrar mapa con puntos de ofertas/solicitudes mediante datos y ubicaciones aproximadas; solicitar consentimiento para GPS.
- [ ] **SOL-07** Evitar revelar direcciones exactas de viviendas y menores; coordinar contactos sin publicar información sensible.

### Documentación — Prioridad P0

- [ ] **DOC-SOL-01** `docs/03_requisitos_casos_uso.md`: requisitos funcionales, casos de uso y escenarios cotidianos/de emergencia.
- [ ] **DOC-SOL-02** Registrar ejemplos de demostración: préstamo de taladro o muletas, recomendación de oficio, ayuda ante aniego y traslado solidario.

### Criterio de aceptación

- [ ] **TEST-SOL** Usuario A crea una solicitud; usuario B ofrece ayuda; A cambia el estado a «resuelta». El modo emergencia muestra una solicitud prioritaria sin exponer la dirección exacta.

## 4. Offline, integración, pruebas y publicación — Integrante 4

### Código — Prioridad P0

- [ ] **OFF-01** Configurar manifiesto PWA, iconos, nombre e instalación desde navegador compatible en Android.
- [ ] **OFF-02** Configurar Service Worker y caché del esqueleto de aplicación para abrirla después de una primera carga con internet.
- [ ] **OFF-03** Guardar en IndexedDB las ofertas, solicitudes y recursos consultados; indicar la fecha de última actualización.
- [ ] **OFF-04** Permitir crear una solicitud sin conexión y guardarla en cola local con identificador único y estado «Pendiente de sincronización».
- [ ] **OFF-05** Al recuperar internet con la app abierta, intentar sincronizar, mostrar éxito/error y prevenir duplicaciones básicas.
- [ ] **OFF-06** Mostrar estado visible «En línea / Sin conexión» y diferenciar información guardada de información actualizada.
- [ ] **OFF-07** Definir comportamiento offline del mapa: solo marcadores/datos guardados y, si no hay mapas base almacenados, mostrar aviso; no prometer mapas completos sin conexión.
- [ ] **OFF-08** Integrar los cambios aprobados desde las ramas al `main` mediante Pull Requests pequeños; resolver conflictos en coordinación con sus autores.
- [ ] **OFF-09** Ejecutar pruebas móviles y automatizadas básicas si el tiempo lo permite; corregir fallos críticos.
- [ ] **OFF-10** Publicar una versión HTTPS y probar la instalación y uso desde un celular físico.

### Documentación — Prioridad P0

- [ ] **DOC-OFF-01** `docs/04_pruebas.md`: casos, dispositivo, resultado, evidencia y errores pendientes.
- [ ] **DOC-OFF-02** `docs/05_manual_instalacion.md`: Node, instalación, variables de entorno, base de datos, despliegue y funcionamiento offline.
- [ ] **DOC-OFF-03** `docs/06_manual_usuario.md`: iniciar sesión, consultar, publicar, recomendar, solicitar ayuda y sincronizar.
- [ ] **DOC-OFF-04** Actualizar `README.md` con descripción, tecnologías, integrantes, enlace de demostración, capturas y limitaciones conocidas.

### Criterio de aceptación

- [ ] **TEST-OFF** Con la app previamente abierta online: activar modo avión, reabrir la app, consultar datos guardados, crear solicitud pendiente, desactivar modo avión y comprobar que aparece en la nube sin duplicarse.

## 5. Pruebas finales de extremo a extremo — Todos

- [ ] **QA-01** Ejecutar `npm run build` sin errores desde `app/`.
- [ ] **QA-02** Verificar navegación en celular Android real y al menos un ancho de pantalla reducido.
- [ ] **QA-03** Publicar una lasaña/pastelito, encontrarla por categoría y abrir su ficha.
- [ ] **QA-04** Publicar un servicio (clases o gasfitería), buscarlo y registrar una recomendación desde otra cuenta.
- [ ] **QA-05** Publicar solicitud de préstamo de herramienta, recibir respuesta y marcarla resuelta.
- [ ] **QA-06** Registrar una ayuda por emergencia y localizarla por zona aproximada.
- [ ] **QA-07** Negar permiso GPS y verificar que la aplicación sigue funcionando mediante selección manual de zona.
- [ ] **QA-08** Desactivar internet, comprobar consulta local y sincronización posterior de una solicitud.
- [ ] **QA-09** Validar que no se filtran direcciones privadas, datos de menores ni credenciales.
- [ ] **QA-10** Comprobar enlaces, botones, textos de error, pantallas vacías y estados de carga.
- [ ] **QA-11** Dejar capturas/video breve de la demostración y registrar errores pendientes sin ocultarlos.
- [ ] **QA-12** Confirmar que `main` contiene el código, documentación y guía para ejecutar/reproducir la demo.

## 6. Reglas de integración

1. Cada desarrollador trabaja normalmente **solo en su rama**; no crear ramas a partir del trabajo a medio terminar de otro compañero.
2. El Integrante 1 publica la base inicial estable en `main`. Todos parten de ella.
3. El Integrante 2 es dueño del esquema y operaciones de datos; el Integrante 1 y el 3 consumen funciones acordadas, usando datos de demostración al principio.
4. El Integrante 3 es dueño de las pantallas y flujos de solidaridad/emergencia; reutiliza componentes compartidos sin modificar arbitrariamente el módulo de catálogo.
5. El Integrante 4 coordina integraciones frecuentes y es dueño del almacenamiento offline y despliegue. **No espera al último momento para unir el código.**
6. Cada Pull Request debe indicar qué cambió, cómo probarlo, capturas si modifica interfaz y dependencias pendientes.
7. Se fusiona a `main` únicamente tras revisión y prueba; después cada miembro actualiza su rama desde la versión nueva de `main`.
8. Los cambios de archivos compartidos (`package.json`, rutas, componentes base, contratos y esquema SQL) requieren avisar al equipo previamente.

## 7. Fuera del alcance inicial (no empezar sin aprobarlo entre los cuatro)

- [ ] Pagos dentro de la app o pasarela bancaria.
- [ ] Chat en tiempo real o videollamadas propias.
- [ ] Verificación de identidad profesional avanzada.
- [ ] Seguimiento GPS permanente o transporte escolar de menores.
- [ ] Inteligencia artificial de recomendaciones.
- [ ] Despacho de alertas a dispositivos remotos sin internet.
- [ ] Mapas offline completos de una ciudad sin descarga y licencia previstas.
- [ ] Publicación en tiendas de aplicaciones, salvo que la organización lo exija expresamente.

> **Nota:** estas casillas son exclusiones; **no** se marcan como tareas terminadas. Servirán para evitar que el alcance crezca sin control.

## 8. Definición de «terminado» para cada tarea

Solo marcar una tarea como terminada si se cumplen estos puntos:

- [ ] Código guardado y subido a la rama del responsable.
- [ ] Funcionalidad probada, no solo diseñada en Figma.
- [ ] Errores visibles y casos sin datos contemplados.
- [ ] Dependencias y cambios de datos comunicados al equipo.
- [ ] Pull Request aprobado e integrado a `main`.
- [ ] Documentación y evidencia de prueba actualizadas.

---

**Convención:** `P0` = imprescindible para la demo. Si sobra tiempo, proponer mejoras secundarias solo después de cerrar y probar todos los P0.  
**Uso:** guarda este archivo en la raíz del repositorio como `CHECKLIST_VECIRED.md`. GitHub renderiza las casillas como listas marcables en Markdown; para persistir cambios edita el archivo y realiza un commit.
