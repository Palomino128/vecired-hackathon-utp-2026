# VeciRed — organización segura, módulos y coordinación

**Fecha:** 8 de noviembre de 2026. **Rama de trabajo:** `fix/ux-perfil-publicar`.

## Estructura que preservamos

```text
VeciRed-Hackathon-UTP-2026/
├── app/                      # React + Vite + PWA
│   ├── src/App.jsx           # Composición y navegación: archivo de integración compartido
│   ├── src/components/       # BottomNav, OfferCard, iconos, PhotoFileField
│   ├── src/features/auth/    # Cuenta y perfil
│   ├── src/features/catalog/ # Catálogo, publicación, edición, detalle
│   ├── src/features/map/     # Mapa: mantenerlo disponible para el compañero
│   ├── src/features/tutorial/# Tutorial
│   ├── src/api/             # Cliente HTTP y adaptadores
│   ├── src/offline/         # IndexedDB y sincronización
│   ├── src/data/            # Barrios y categorías usados por catálogo y mapa
│   └── src/styles/          # CSS adicional
├── server/                   # Express, auth, uploads, rutas REST
├── database/                 # Migraciones PostgreSQL
└── docs/                     # Guías técnicas y del usuario
```

## Qué se ordenó con este paquete

- Se centralizó el pin SVG en `app/src/components/LocationPinIcon.jsx`. No se toca `MapPage` ni `ubicaciones`.
- El flujo de publicación conserva sus tres pasos; las fotos se seleccionan desde el paso 2 y pueden ajustarse en el 3. Antes del POST existe una confirmación explícita.
- Se documentan módulos compartidos y se incluye `ORGANIZAR_RESPALDOS.js` para mover **opcionalmente** solo archivos sin seguimiento `.bak*` y restos accidentales a un respaldo externo.
- **No** se mueven carpetas reales, no se renombran imports, no se borran fuentes ni se cambia la base de datos.

## Colaboración sin conflictos

1. Que el compañero integre su funcionalidad en una rama propia y entregue commit/PR.
2. Hacer `git fetch origin` antes del siguiente merge.
3. Evitar modificar simultáneamente `app/src/App.jsx`, `app/vite.config.js`, `app/src/data/ubicaciones.js` y `server/index.js`.
4. Si `main` avanza, incorporar esos cambios en la rama de correcciones con una revisión; **no** hacer `git push --force`.
5. Probar en local `npm run build`, publicaciones con/sin fotos y navegación al mapa.

## Archivos temporales y secretos

- No agregar `.env`, `node_modules`, `dist`, `uploads` ni archivos `.bak` al repositorio.
- `ORGANIZAR_RESPALDOS.js` solo mueve rutas detectadas como **sin seguimiento** por Git y seleccionadas en su lista segura; prueba antes sin `--apply`.
- Los TXT instructivos quedan en su lugar por ahora: pueden tener información útil del equipo.
- No modificar ni borrar archivos de otros miembros sin revisar el historial.

## Despliegue público

Frontend Vercel ≠ backend en producción: para registrar y publicar desde internet faltan desplegar Express, PostgreSQL y almacenamiento persistente de imágenes, con `VITE_API_URL` y CORS configurados.
