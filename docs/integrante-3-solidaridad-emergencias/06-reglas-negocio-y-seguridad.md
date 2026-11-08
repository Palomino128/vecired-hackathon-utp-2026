# 06. Reglas de negocio y seguridad

## Publicaciones y respuestas

- Crear publicaciones requiere autenticación; título, descripción y categoría son obligatorios y `type` debe ser uno de los tipos admitidos.
- La zona usa el valor recibido o el barrio del usuario autenticado.
- Una persona no puede responder a su propia publicación ni enviar respuesta a una solicitud cerrada.
- Solo el autor puede administrar propuestas (un admin también puede aceptar/rechazar en el handler actual).
- Solo el autor puede editar o eliminar su publicación, con excepción administrativa. El endpoint de edición limita prioridad y `is_emergency` a admin.
- Los campos de prioridad en creación se validan contra `critica`, `alta`, `media`, `baja`.

## Préstamos

1. El solicitante es `solidarity_requests.user_id`; el prestamista es el `helper_user_id` de la respuesta aceptada y se copia a `resolved_by_user_id`.
2. La respuesta aceptada solo puede aceptarse si el estado general sigue `abierta`; el `FOR UPDATE` de la fila principal serializa decisiones concurrentes.
3. La respuesta escogida queda `aceptado`; otras respuestas que seguían `ofrecido` pasan a `rechazado`.
4. Solo el usuario asignado como prestamista puede confirmar `entregado`, y solo desde `loan_status=aceptado`.
5. Solo el usuario que creó la solicitud (receptor) puede confirmar `devuelto`, y solo tras entrega.
6. La devolución registra fecha, pone `loan_status=devuelto`, `status=resuelta` y respuesta del prestamista `completado`.
7. Una solicitud de préstamo no se puede marcar resuelta por el endpoint genérico ni eliminar una vez aceptada/entregada/devuelta.

## Movilidad y estados generales

La API exige origen, destino, fecha y cantidad positiva. Los ofrecimientos de transporte son filas de `solidarity_responses`; aceptar asigna responsable y cambia el estado general a `en_proceso`. No hay transición específica de movilidad o registro estructurado del cierre del viaje.

## Emergencias y directorio

- La prioridad en listas se ordena crítica, alta, media, baja.
- En la interfaz, el modo de emergencia utiliza `solidarity_requests.is_emergency`, no `emergency_reports`.
- La API de estado de `emergency_reports` valida estados y reserva actualización a reportante, admin o líder comunitario.
- Recursos listados deben tener `is_active=true`. Crear recursos requiere autenticación, nombre, tipo y teléfono de contacto.

## Autenticación

El middleware acepta `Authorization: Bearer <token>`, valida JWT y vuelve a consultar el registro del usuario. La clave `JWT_SECRET` debe existir y tener al menos 32 caracteres. El cliente mantiene el token en `localStorage` con clave `vecired_token`. En este código el middleware no implementa el fallback `x-user-id` que algunos comentarios describen.

`database/002_permissions_functions.sql` habilita RLS y crea políticas de SELECT público en las tablas de catálogo/solicitudes; la autorización descrita arriba se realiza principalmente en los handlers Express. La política SQL de lectura no reemplaza los controles de propiedad de la aplicación.

## Límites de historial

Las columnas `created_at`, `updated_at`, `loan_delivered_at` y `loan_returned_at` dan fechas puntuales; no existe tabla de eventos/auditoría para conservar cada transición o quién cambió cada atributo históricamente. El nombre de responsable de `emergency_reports.attended_by` es texto, no FK.
