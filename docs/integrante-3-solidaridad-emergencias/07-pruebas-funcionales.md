# 07. Pruebas funcionales y resultados

## Resultados ejecutados en el entorno revisado

| Comprobación | Resultado real |
|---|---|
| `npm run build` desde `app/` | **Correcta**. Vite generó el bundle y los archivos PWA. |
| `npm run lint` desde `app/` | **Correcta**. Oxlint terminó sin errores. |
| `node --check server/routes/solidarity.routes.js` | **Correcta**. |
| `node --check server/migrate.js` | **Correcta**. |
| `git diff --check` | **Correcta**, con aviso de conversión de fin de línea CRLF para una ruta. |
| `npm run migrate` desde `server/` | **Falló antes de ejecutar archivos SQL**: PostgreSQL respondió `28P01` (autenticación de contraseña fallida para el usuario de conexión configurado). No se aplicó la migración en esa ejecución. |
| Prueba HTTP con dos cuentas / persistencia de cambios | **No ejecutada**. El backend no obtuvo conexión autenticada a la base. |

Los `package.json` no declaran script `test`; por tanto no se informa una suite automatizada aprobada. Las pruebas abajo son casos reproducibles con resultado esperado y estado no ejecutado, no evidencia de aceptación funcional.

## Casos funcionales

### F-01 — Publicar y buscar necesidad/ofrecimiento

- **Objetivo:** comprobar creación persistente, lista, búsqueda y detalle.
- **Precondición:** sesión válida y base migrada.
- **Pasos:** crear desde **Publicar en el muro**; buscar por texto; abrir tarjeta con **Ver detalle y responder →**.
- **Datos:** tipo `ayuda_temporal`, intención `necesidad`, título y categoría válidos.
- **Esperado:** `POST /api/solidarity/requests` devuelve 201; la fila reaparece en lista y detalle.
- **Obtenido/estado:** no ejecutada; conexión DB no disponible por error de autenticación.

### F-02 — Solicitud de donación y propuesta

- **Objetivo:** verificar solicitud de donación y decisiones de propuesta.
- **Precondición:** dos cuentas y solicitud abierta tipo `donacion`.
- **Pasos:** cuenta A publica; cuenta B responde; A acepta o rechaza.
- **Esperado:** respuesta persistida en `solidarity_responses`; aceptación asigna responsable y estado `en_proceso`, rechazo actualiza respuesta.
- **Obtenido/estado:** no ejecutada; conexión DB no disponible.

### F-03 — Préstamo entre vecinos (prueba de entrega)

- **Objetivo:** comprobar los siete pasos solicitud, propuesta, aceptación, identidades, estado, entrega y devolución.
- **Precondiciones:** migración 007 aplicada; dos usuarios con JWT válido.
- **Pasos:** A publica tipo `prestamo`; B abre detalle y envía mensaje de oferta; A acepta la respuesta; B confirma entrega; A registra devolución.
- **Esperado:** `user_id=A`, `resolved_by_user_id=B`; los estados recorren `solicitado` → `ofrecido` → `aceptado` → `entregado` → `devuelto`; las fechas se guardan y estado general termina `resuelta`.
- **Obtenido/estado:** no ejecutada contra PostgreSQL. Build/lint/sintaxis sí pasaron, pero no prueban persistencia ni autorización entre cuentas.

### F-04 — Intercambio de habilidades

- **Objetivo:** verificar publicación y respuesta de servicio/habilidad.
- **Precondición:** cuentas autenticadas.
- **Pasos:** publicar `intercambio_habilidad`, responder desde otra cuenta, aceptar/rechazar en detalle.
- **Esperado:** registros en las tablas de solicitud y respuesta, responsable en caso de aceptación.
- **Obtenido/estado:** no ejecutada; DB no autenticó.

### F-05 — Movilidad solidaria

- **Objetivo:** verificar campos obligatorios y respuesta de transporte.
- **Precondición:** sesión válida.
- **Pasos:** publicar `movilidad` con partida/destino/fecha/pasajeros; otra cuenta ofrece traslado; solicitante acepta.
- **Esperado:** valores guardados en columnas de movilidad; responsable y estado `en_proceso` tras aceptar.
- **Obtenido/estado:** no ejecutada; DB no autenticó.

### F-06 — Emergencia priorizada

- **Objetivo:** verificar marca y orden de emergencia.
- **Precondición:** cuenta autenticada y tabla migrada.
- **Pasos:** en **Emergencias**, crear alerta de prioridad alta; listar; comprobar orden respecto a otra prioridad; intentar cambiar prioridad como vecino/admin.
- **Esperado:** fila en `solidarity_requests` con `is_emergency=true`; el listado la destaca y ordena; solo admin puede modificar prioridad posterior a la creación.
- **Obtenido/estado:** no ejecutada en DB.

### F-07 — Registrar y consultar recurso

- **Objetivo:** verificar persistencia y filtro del directorio.
- **Precondición:** sesión válida.
- **Pasos:** registrar recurso con categoría y teléfono, buscar por nombre y usar **Llamar**.
- **Esperado:** fila activa en `emergency_resources`; el filtro la devuelve y el enlace `tel:` usa teléfono de emergencia o de contacto.
- **Obtenido/estado:** no ejecutada; DB no autenticó.

## Interpretación

El código y frontend compilan, pero el flujo de entrega solicitado por el usuario no se confirmó con datos guardados reales en la base. Antes de presentar aceptación de integración, hay que configurar credenciales válidas, ejecutar `npm run migrate` y repetir F-03 con dos cuentas, revisando las filas en ambas tablas.
