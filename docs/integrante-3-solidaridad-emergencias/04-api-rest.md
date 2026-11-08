# 04. API REST

Base local habitual: `http://localhost:3001`. Las rutas se montan en `server/index.js`. Salvo donde se indica, las respuestas de error usan JSON `{ "error": "..." }`. Los endpoints autenticados requieren `Authorization: Bearer <JWT>`.

## Solidaridad — `/api/solidarity`

| Método y ruta | Auth | Descripción y parámetros |
|---|---|---|
| `GET /requests` | Opcional | Lista hasta 100 solicitudes, ordenadas por emergencia, prioridad y fecha. Query opcional: `type`, `status`, `neighborhood`, `urgency`, `q`, `mine=true`. `mine=true` requiere sesión. Devuelve array con datos de solicitud, `author_name`, `helper_name`, `responses_count`. |
| `GET /requests/:id` | No | Detalle con `author_name`, `lender_name` (join al responsable aceptado) y `responses[]`, cada una con `helper_name`. 404 si no existe. |
| `POST /requests` | Sí | Crea publicación. Body: `type`, `title`, `description`, `category`; opcionales `intent`, `neighborhood`, `latitude`, `longitude`, `urgency`, `is_emergency`, y campos movilidad `departure`, `destination`, `travel_at`, `passengers`, `reason`. Respuesta 201 `{request}`. |
| `PUT /requests/:id` | Sí | Edita título, descripción, categoría, barrio, estado e información de movilidad/intención. Solo autor o admin. `urgency` e `is_emergency` solo admin. `status` limitado al enum. No permite resolver un préstamo antes de devolución. Respuesta `{request}`. |
| `DELETE /requests/:id` | Sí | Elimina publicación propia o por admin. No permite eliminar préstamos aceptados, entregados o devueltos. Devuelve `{deleted:true}`; 404 ante falta de permiso/registro o bloqueo. |
| `POST /requests/:id/responses` | Sí | Añade respuesta. Body: `message` obligatorio, `proposed_solution`, `contact_phone` opcionales. No se responde a publicación propia ni cerrada. En préstamo, una misma cuenta no mantiene dos propuestas `ofrecido` simultáneas para esa solicitud. Devuelve 201 `{response}`. |
| `PUT /requests/:id/responses/:responseId` | Sí | Body `{decision}`. Valores reconocidos: `aceptado`, `rechazado`, `completado`. Solo autor/admin gestiona respuestas. Para préstamo, solo una respuesta `ofrecido` puede decidirse; aceptar requiere solicitud abierta y fija prestamista y estado `en_proceso`. `completado` se rechaza para préstamo: debe usarse `/loan`. |
| `PUT /requests/:id/loan` | Sí | Body `{event:"entregado"}`: solo prestamista aceptado, estado préstamo `aceptado`; fija `loan_delivered_at`. Body `{event:"devuelto"}`: solo solicitante/receptor y estado `entregado`; fija `loan_returned_at`, `loan_status=devuelto` y `status=resuelta`. Respuesta `{request}`. |

`type` admite `prestamo`, `donacion`, `intercambio_habilidad`, `movilidad`, `ayuda_temporal`. `intent` admite `necesidad` y `ofrecimiento`. En movilidad, `departure`, `destination`, `travel_at` y pasajeros positivos son requeridos.

## Emergencias — `/api/emergency`

| Método y ruta | Auth | Descripción y parámetros |
|---|---|---|
| `GET /resources` | No | Lista recursos activos. Query: `type`, `neighborhood`, `q` (busca en nombre, descripción o dirección). Devuelve array. |
| `POST /resources` | Sí | Registra recurso. Body requerido: `name`, `type`, `contact_phone`; opcional: `description`, `emergency_phone`, `address`, `neighborhood`, `latitude`, `longitude`, `operating_hours`. Tipo debe pertenecer al enum SQL. Respuesta 201 `{message, resource}`. |
| `GET /reports` | Opcional | Lista `emergency_reports`; filtros `status`, `urgency`, `neighborhood`; prioridad primero. Incluye nombre/teléfono del reportante. |
| `POST /reports` | Sí | Crea reporte geolocalizado. Body requerido: `title`, `description`, `latitude`, `longitude`; opcional: `urgency`, `affected_people_count`, `critical_needs[]`, `neighborhood`, `client_id`. Respuesta 201 `{message, report}`; idempotencia mediante `client_id`. |
| `PUT /reports/:id/status` | Sí | Body `{status, attended_by?}`. Estados permitidos: `pendiente`, `en_atencion`, `atendido`. Solo reportante, `admin` o `lider_comunitario`; asigna por defecto el nombre del usuario que actualiza como `attended_by`. |

## Autenticación y errores

`requireAuth` verifica JWT y recupera el usuario desde `users`; `optionalAuth` permite lectura anónima y adjunta usuario si el JWT es válido. Las rutas de respuesta, escritura y gestión de estado usan `requireAuth`. Los errores pueden incluir 400 (validación), 401 (sesión), 403 (rol/propiedad), 404 (recurso ausente), 409 (transición inválida) y 500 (fallo interno/DB).

## Integración desde frontend

`apiSolidaridad` y `apiEmergencia` en `app/src/api/veciredApi.js` construyen rutas prefijadas y delegan en `peticion`, que agrega JWT cuando `autenticado: true` y serializa JSON.
