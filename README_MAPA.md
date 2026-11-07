# VeciRed - Integración del mapa en `feature/frontend`

Este ZIP incluye el frontend completo del **Paso 2** más el mapa. Es compatible con la base React/Vite ya creada en `app/`.

## Requisitos

- **Instalar una única dependencia nueva:** ejecutar desde `app/` `npm install leaflet@1.9.4`.
- Mantener los `package.json` y `package-lock.json` generados en tu propio repositorio: `npm install` los actualiza automáticamente.
- No reemplazar `.git`, `package.json`, el backend, ni los archivos de otras ramas.

## Para probar

Desde `D:\VeciRed-Hackathon-UTP-2026\app`:

```bat
npm install leaflet@1.9.4
npm run lint
npm run build
npm run dev
```

Abrir `http://localhost:5173/`, tocar **Mapa**, probar filtros, marcadores y búsqueda. En los permisos de ubicación, aceptar o rechazar: ambos caminos deben funcionar.

**Nota**: las ofertas, valoraciones y coordenadas son ficticias; el mapa es solo la interfaz. Las nuevas solicitudes de solidaridad y los datos reales todavía no están conectados. No funciona como mapa base descargable offline. La PWA offline corresponde al Integrante 4.

## Para el equipo

- `app/src/components/map/VeciRedMap.jsx`: componente reutilizable; recibe array `puntos` con `{id,lat,lng,titulo,categoria,zona,tipo}` y callback `alSeleccionar`.
- `app/src/features/map/MapPage.jsx`: pantalla de mapa para ofertas, filtros y geolocalización local.
- `app/src/data/ubicaciones.js`: coordenadas aproximadas ficticias para la demo, **no** domicilios.
- Se agregan botones Mapa en navegación, catálogo y detalle.
- Es necesario incluir los cambios de `app/package.json` y `app/package-lock.json` cuando hagas commit, por la nueva dependencia Leaflet.
- El Integrante 3 puede usar `VeciRedMap` para emergencias, pasándole puntos de tipo `solicitud` o `recurso`.

## Política de OpenStreetMap

Usamos el servidor público `tile.openstreetmap.org` solo para visualización interactiva en línea. No descargar mosaicos masivamente ni almacenarlos para mapas offline. Para mapas offline reales habrá que usar otro proveedor con permiso o tiles propios.
