# 05. Frontend

## Pantallas y navegación

`app/src/App.jsx` mantiene la pantalla actual con el estado `pantalla`; no emplea un router de URL para estas vistas. El acceso inferior **Ayuda** de `BottomNav` navega a `solidaridad`. La pantalla carga `SolidarityHub`. El hub tiene pestañas **Muro solidario**, **Emergencias** y **Directorio**. `mode="emergencia"` inicializa la pestaña de emergencias, aunque el acceso visible habitual es **Ayuda** y las pestañas internas.

## Componentes

| Archivo | Responsabilidad |
|---|---|
| `app/src/features/solidarity/SolidarityHub.jsx` | Pantalla integrada: lectura, filtros, formularios, detalle, respuestas, estados de préstamo y directorio. |
| `app/src/features/solidarity/solidarity.css` | Estilos responsive del hub, tarjetas, formulario, estados y detalle. |
| `app/src/components/BottomNav.jsx` | Navegación inferior y acceso **Ayuda**. |
| `app/src/App.jsx` | Monta `SolidarityHub` para las pantallas `solidaridad` y `emergencia`. |
| `app/src/api/veciredApi.js` | Cliente JSON, token guardado y funciones `apiSolidaridad` / `apiEmergencia`. |

No hay componentes separados de catálogo de recursos, inventario de donaciones, mapa de movilidad o tablero independiente de `emergency_reports`.

## Formularios y operaciones visibles

- **Publicar en el muro:** tipo, intención, título, categoría, zona y descripción/motivo. Movilidad añade partida, destino, fecha/hora y pasajeros.
- **Publicar una alerta:** título, categoría, zona, prioridad y descripción; marca la publicación en el muro como emergencia.
- **Detalle:** respuestas, aceptar/rechazar, edición/borrado propios y acciones de entrega/devolución para préstamos.
- **Registrar un recurso comunitario:** nombre, categoría, teléfonos, ubicación, zona, horario y descripción.
- La búsqueda del muro envía texto `q`; el filtro de tipos envía `type`. El directorio busca con `q`.

Las lecturas se cargan desde PostgreSQL a través de la API. No se usan arrays de demostración para las entidades de solidaridad del hub.
