// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/index.js
// DESCRIPCIÓN: Servidor principal API REST en Express conectado a PostgreSQL
// ==============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import itemsRoutes from './routes/items.routes.js';
import myItemsRoutes from './routes/my-items.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import solidarityRoutes from './routes/solidarity.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import syncRoutes from './routes/sync.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';
import uploadsRoutes from './routes/uploads.routes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Middlewares Globales

const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 2. Endpoint de Salud
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    service: 'VeciRed Backend API - Arequipa',
    version: '1.0.0 - Hackathon UTP 2026',
    database: {
      engine: 'PostgreSQL',
      ...dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

// 3. Montaje de Rutas Modulares
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/my-items', myItemsRoutes);
app.use('/api/uploads', uploadsRoutes)
app.use('/api/reviews', reviewsRoutes);
app.use('/api/solidarity', solidarityRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sync', syncRoutes);

// 4. Manejo de Rutas No Encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// 5. Middleware de Manejo de Errores Globales
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_SERVER_ERROR',
  });
});

// 6. Iniciar Servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 VeciRed API Backend corriendo en: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Base de Datos: PostgreSQL`);
    console.log(`=======================================================`);
  });
}

export default app;
