# 05. Manual de Instalación y Despliegue (PWA & Producción)

Este documento detalla los requisitos técnicos, las variables de entorno, la instalación local y el procedimiento paso a paso para desplegar **VeciRed** en **Vercel**, garantizando el funcionamiento de su **Service Worker**, el manifiesto **PWA** y la base de datos local **IndexedDB**.

---

## 1. Requisitos Previos

- **Node.js:** versión `18.x` o `20.x` LTS recomendada.
- **Gestor de paquetes:** `npm` (v9 o superior).
- **Navegador moderno compatible con PWA:** Chrome, Edge, Brave, Safari (iOS 16.4+) o Firefox.
- **Cuenta en GitHub y Vercel:** para integración y despliegue continuo (CI/CD).

---

## 2. Instalación y Ejecución en Entorno Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Ronaldo23200944/VeciRed-Hackathon-UTP-2026.git
   cd VeciRed-Hackathon-UTP-2026/app
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```
   *(Esto instalará React, Leaflet, `idb` para IndexedDB y `vite-plugin-pwa` para el Service Worker).*

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Compilar y previsualizar la versión de producción (con Service Worker activo):**
   ```bash
   npm run build
   npm run preview
   ```
   Abrir `http://localhost:4173` para probar el empaquetado final y el registro automático (`autoUpdate`) del Service Worker.

---

## 3. Requerimiento Crítico de HTTPS para el Service Worker

> [!IMPORTANT]
> **Por estándar de seguridad de la W3C, los Service Workers y la instalación de PWAs solo funcionan sobre orígenes seguros (`HTTPS`).**

- **En Desarrollo Local:** Los navegadores permiten una única excepción de seguridad para `http://localhost` y `http://127.0.0.1`, por lo que puedes probar tanto el Service Worker como IndexedDB sin certificado SSL en tu máquina.
- **En Producción o Pruebas en Celulares Reales:** Si accedes mediante una dirección IP local por `HTTP` (por ejemplo, `http://192.168.1.15:5173`), el navegador **bloqueará** `navigator.serviceWorker` y deshabilitará el botón *"Instalar aplicación / Agregar a pantalla de inicio"*.
- **Solución en Producción:** Desplegar en plataformas como **Vercel** que aprovisionan certificados **TLS/HTTPS automáticos** (Let's Encrypt) desde el primer despliegue.

---

## 4. Variables de Entorno (`.env`)

En Vite, todas las variables de entorno expuestas al cliente deben llevar el prefijo **`VITE_`**.
Si deseas conectar la cola offline (`outbox`) o los módulos del proyecto a un backend en producción, crea un archivo `.env` dentro de la carpeta `app/` (o configúralas en el panel de Vercel):

```env
# URL base de la API para sincronización cuando el dispositivo recupera la red
VITE_API_BASE_URL=https://api.vecired.org/v1

# Nombre y entorno de la aplicación
VITE_APP_NAME=VeciRed
VITE_APP_ENV=production

# Proveedor de teselas del mapa (OpenStreetMap por defecto)
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

> **Nota:** La aplicación funciona de manera autónoma incluso si no se definen variables `.env`, utilizando sus valores por defecto y almacenamiento local en `IndexedDB` (`vecired_offline`).

---

## 5. Guía Paso a Paso de Despliegue en Vercel

Dado que el código fuente de la aplicación se encuentra dentro del subdirectorio **`app/`**, es fundamental configurar el **Root Directory** en Vercel:

1. **Iniciar sesión en Vercel:**
   Ingresa a [https://vercel.com](https://vercel.com) con tu cuenta de GitHub.

2. **Importar el repositorio:**
   - Haz clic en **Add New... > Project**.
   - Selecciona el repositorio **`VeciRed-Hackathon-UTP-2026`** y presiona **Import**.

3. **Configurar los ajustes del proyecto (Paso Clave):**
   - **Framework Preset:** `Vite` (Vercel lo detectará automáticamente al elegir la carpeta raíz).
   - **Root Directory:** Haz clic en **Edit** y selecciona la carpeta **`app`**.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Configurar Variables de Entorno:**
   - Despliega la sección **Environment Variables** y agrega las variables `VITE_*` necesarias (según la sección 4).

5. **Desplegar:**
   - Haz clic en **Deploy**.
   - En menos de 1 minuto, Vercel generará una URL pública segura bajo **`https://<tu-proyecto>.vercel.app`**.

6. **Verificación Post-Despliegue:**
   - Abre la URL `https://...vercel.app` desde tu navegador o teléfono móvil.
   - Abre **DevTools > Application > Manifest** y **Service Workers** para confirmar que el manifiesto de `VeciRed` y el Service Worker (`sw.js`) están activos bajo HTTPS.
