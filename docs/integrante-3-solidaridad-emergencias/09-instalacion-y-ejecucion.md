# 09. Instalación y ejecución

## Requisitos observados

- Node.js/npm compatibles con las versiones de Vite y las dependencias del proyecto (la comprobación documentada se ejecutó con Node.js 22 y npm 10).
- PostgreSQL accesible con una base y un usuario cuyas credenciales tengan permisos de esquema y datos requeridos.
- Navegador moderno.

## Configuración backend

Desde la raíz, instala dependencias del servidor y configura `server/.env`:

```env
PORT=3001
JWT_SECRET=<secreto aleatorio de al menos 32 caracteres>
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=<base configurada por el equipo>
POSTGRES_USER=<usuario configurado por el equipo>
POSTGRES_PASSWORD=<contraseña configurada por el equipo>
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

En `server/db.js`, si se configura `DATABASE_URL`, esta conexión tiene preferencia sobre los campos individuales. `PGSSLMODE=require` activa SSL en el caso de `DATABASE_URL`. El código contiene valores locales de fallback; no deben confundirse con credenciales verificadas de un entorno.

```powershell
cd server
npm install
npm run migrate
npm run dev
```

`npm run migrate` llama `server/migrate.js`, que ejecuta `001_schema.sql`, `002_permissions_functions.sql`, `006_solidarity_mobility.sql` y `007_loan_lifecycle.sql`. Debe terminar correctamente antes de probar el flujo. Esta documentación no confirma que una base determinada ya tenga estas migraciones aplicadas.

## Configuración frontend

En una terminal separada:

```powershell
cd app
npm install
npm run dev
```

Abre la URL de Vite que imprime la terminal (por defecto `http://localhost:5173`). Para apuntar la aplicación a una API distinta, configura `app/.env`:

```env
VITE_API_URL=http://localhost:3001
```

El nombre es `VITE_API_URL`, tal como lo lee `app/src/api/veciredApi.js`.

## Verificaciones disponibles

```powershell
cd app
npm run build
npm run lint
```

El backend ofrece `npm start`, `npm run dev` y `npm run migrate`; no define script `test`. La API publica `GET /api/health`, cuyo resultado indica el estado de conectividad PostgreSQL.

Para verificar persistencia se requiere una base configurada y autenticación real de dos usuarios. En el entorno examinado, `npm run migrate` falló con error PostgreSQL `28P01`; la ejecución no aplicó los SQL. No uses resultados de build/lint como sustituto de la prueba de integración.
