# VeciRed — Integrante 3: Solidaridad y Emergencias

Documentación funcional y técnica del módulo existente en el proyecto. Está redactada a partir de las rutas, componentes, esquema SQL y configuración presentes en el repositorio; distingue las funciones conectadas al frontend de las rutas que existen solo en el backend.

## Documentos

1. [Descripción funcional](01-descripcion-funcional.md)
2. [Arquitectura y tecnologías](02-arquitectura.md)
3. [Modelo de datos](03-modelo-datos.md)
4. [API REST](04-api-rest.md)
5. [Frontend](05-frontend.md)
6. [Reglas de negocio y seguridad](06-reglas-negocio-y-seguridad.md)
7. [Pruebas funcionales y resultados](07-pruebas-funcionales.md)
8. [Manual de usuario](08-manual-usuario.md)
9. [Instalación y ejecución](09-instalacion-y-ejecucion.md)

## Alcance técnico observado

El frontend React consume el muro y el directorio mediante la API Express. La persistencia usa PostgreSQL y las tablas `solidarity_requests`, `solidarity_responses`, `emergency_resources` y `emergency_reports`, además de `users`. Las migraciones del módulo están en `database/006_solidarity_mobility.sql` y `database/007_loan_lifecycle.sql`.

El módulo ofrece publicaciones de necesidad/ofrecimiento, solicitudes de préstamo, donación, intercambio de habilidades, movilidad, respuestas y el ciclo de préstamo con confirmación separada de entrega y devolución. Incluye vista destacada de emergencias y consulta/registro de recursos.

## Límites que deben tenerse presentes

- El tab **Emergencias** de `SolidarityHub` crea y consulta filas en `solidarity_requests` con `is_emergency=true`. Las rutas `/api/emergency/reports` usan otra tabla y no son llamadas por el frontend actual.
- El frontend del directorio lista y registra recursos. No muestra un detalle independiente ni controles de edición/desactivación; esos endpoints no están implementados.
- Los estados de solicitudes son los del enum `request_status`. Los préstamos usan además `loan_status` y fechas agregadas por la migración 007.
- La migración y persistencia contra la base real no pudieron comprobarse en el entorno revisado: `npm run migrate` falló al autenticar el usuario configurado (`28P01`). Véase [pruebas](07-pruebas-funcionales.md).
- Las pruebas de build y lint del frontend sí terminaron correctamente; no existe un script `test` en los `package.json` revisados.

## Diagramas incluidos

La arquitectura, relaciones de datos, ciclo de préstamo, movilidad y atención de emergencias se ilustran con Mermaid en los documentos correspondientes.
