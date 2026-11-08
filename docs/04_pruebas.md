# 04. Plan y Matriz de Pruebas — Motor Offline, PWA e IndexedDB

Este documento describe el protocolo de aseguramiento de calidad (QA) para validar las capacidades **Offline-First**, la instalación como **Progressive Web App (PWA)**, el almacenamiento local en **IndexedDB** (`vecired_offline`) y la integridad de la cola de salida (`outbox`) al perder y recuperar la conectividad en **VeciRed**.

---

## 1. Preparación del Entorno de Pruebas

1. Abrir una terminal en la carpeta `app/` del proyecto:
   ```bash
   cd app
   npm install
   npm run dev
   ```
2. Abrir Google Chrome o Microsoft Edge en `http://localhost:5173`.
3. Abrir las **Herramientas de Desarrollador (DevTools)** presionando `F12` o `Ctrl + Shift + I` (`Cmd + Option + I` en macOS).

---

## 2. Procedimiento Paso a Paso para las Pruebas

### A. Cómo Simular la Desconexión (Modo Offline)
1. En las **DevTools**, dirigirse a la pestaña **Network** (Red) o **Application > Service Workers**.
2. En el selector de velocidad de red (donde por defecto dice *No throttling*), cambiar la opción a **Offline** (o marcar la casilla **Offline** en la sección *Service Workers*).
3. Verificar inmediatamente en la esquina inferior izquierda de la pantalla la aparición del widget flotante rojo ([`OfflineWidget`](../app/src/offline/OfflineWidget.jsx)) con el texto **"Sin conexión"**.

### B. Cómo Verificar el Guardado en IndexedDB (`Application > IndexedDB`)
1. Estando en modo **Offline**, hacer clic en el botón **Publicar** de la barra de navegación inferior.
2. Completar los 3 pasos del asistente ([`PublishWizard`](../app/src/features/catalog/PublishWizard.jsx)):
   - **Paso 1:** Seleccionar categoría (ej. *Comida*).
   - **Paso 2:** Ingresar título (ej. *Empanadas artesanales*) y descripción.
   - **Paso 3:** Elegir zona (ej. *Cercado*), precio opcional y presionar **Publicar demostración**.
3. Confirmar que aparece la alerta temporal verde de éxito:
   > **"Guardado localmente. Se sincronizará al recuperar la conexión"**
4. En las **DevTools**, ir a la pestaña **Application** (Aplicación) > menú lateral **Storage** > **IndexedDB**.
5. Desplegar la base de datos **`vecired_offline`** y seleccionar el almacén de objetos **`outbox`**.
6. Si no aparece de inmediato, hacer clic derecho sobre `IndexedDB` y seleccionar **Refresh IndexedDB**.
7. Verificar que el registro existe con su clave `id` autoincremental, los datos del formulario (`titulo`, `categoria`, `descripcion`, `zona`, `precio`) y la marca temporal `createdAt` en formato ISO 8601.

### C. Cómo Comprobar la Reconexión y Ausencia de Duplicados
1. Con registros pendientes en `vecired_offline > outbox`, volver a la pestaña **Network** de las DevTools y cambiar el estado de **Offline** a **No throttling** (Online).
2. Verificar que el evento `window.ononline` se dispara automáticamente y el widget flotante rojo **"Sin conexión"** desaparece de inmediato.
3. Inspeccionar el almacén `outbox` en **Application > IndexedDB > vecired_offline > outbox**:
   - Cada operación offline posee un identificador único (`id` autoincremental en IndexedDB y `id: local-<timestamp>` en la entidad de oferta).
   - Al consultar la cola mediante `getOutboxItems()` en [`syncManager.js`](../app/src/offline/syncManager.js), cada publicación se lee una única vez por su clave primaria, garantizando idempotencia y evitando registros duplicados al reconectar o cambiar repetidamente entre estados *Offline* y *Online*.

---

## 3. Matriz de Casos de Prueba

| ID | Escenario de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-01** | Detección visual de caída de red | Aplicación abierta con conexión activa (`navigator.onLine === true`). | 1. Abrir DevTools > Network.<br>2. Activar modo **Offline**. | El componente `OfflineWidget` aparece fijo en la esquina inferior izquierda mostrando **"Sin conexión"**. | ✅ Aprobado |
| **CP-02** | Ocultamiento automático al recuperar red | Aplicación en modo **Offline** con el widget visible. | 1. En DevTools > Network, desactivar **Offline** (pasar a **No throttling**). | El evento `online` actualiza el estado y el `OfflineWidget` desaparece por completo de la pantalla (`return null`). | ✅ Aprobado |
| **CP-03** | Creación de base de datos local `vecired_offline` | Navegador sin datos previos del sitio (o tras limpiar almacenamiento). | 1. Ejecutar guardado offline o invocar `initDB()`.<br>2. Abrir **Application > IndexedDB**. | Se crea la base de datos `vecired_offline` (versión `1`) con el object store `outbox` y `keyPath: 'id'`. | ✅ Aprobado |
| **CP-04** | Guardado en cola `outbox` al publicar sin internet | Modo **Offline** activo en DevTools. | 1. Abrir modal **Publicar**.<br>2. Completar los 3 pasos.<br>3. Enviar el formulario. | 1. Se muestra la alerta temporal *"Guardado localmente. Se sincronizará al recuperar la conexión"*.<br>2. El objeto queda almacenado en `Application > IndexedDB > vecired_offline > outbox`. | ✅ Aprobado |
| **CP-05** | Persistencia tras recarga de página en Offline | Al menos 1 publicación guardada en `outbox` y navegador en **Offline**. | 1. Recargar la página (`F5`).<br>2. Revisar **Application > IndexedDB > vecired_offline > outbox**. | Los registros en `outbox` permanecen intactos en el disco local y la PWA carga desde el caché del Service Worker. | ✅ Aprobado |
| **CP-06** | Prevención de duplicados al alternar conexión | 1 publicación registrada en `outbox`. | 1. Alternar 3 veces entre **Offline** y **Online** en DevTools.<br>2. Refrescar la vista de `outbox` en IndexedDB y el catálogo. | No se generan entradas duplicadas en `outbox` ni se duplica la tarjeta en el listado del catálogo. | ✅ Aprobado |
| **CP-07** | Generación de Manifiesto y Service Worker (Build PWA) | Proyecto con `vite-plugin-pwa` configurado en `vite.config.js`. | 1. Ejecutar `npm run build` dentro de `app/`.<br>2. Inspeccionar la carpeta `app/dist/`. | Se generan correctamente `sw.js`, `workbox-*.js` y `manifest.webmanifest` con el nombre `VeciRed`. | ✅ Aprobado |
