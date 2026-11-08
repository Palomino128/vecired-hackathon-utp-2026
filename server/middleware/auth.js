// ==============================================================================
// PROYECTO: VeciRed - Hackathon UTP 2026
// INTEGRANTE 2: Base de datos y lógica (Backend)
// ARCHIVO: server/middleware/auth.js
// DESCRIPCIÓN: Middleware de autenticación y verificación de identidad
// ==============================================================================

import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe estar configurado con al menos 32 caracteres.');
}

/**
 * Middleware para validar que el usuario esté autenticado.
 * Acepta:
 * 1. Header 'Authorization: Bearer <token>'
 * 2. Header 'x-user-id: <uuid>' (en entorno de desarrollo y pruebas)
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id || decoded.sub;
      } catch (err) {
        return res.status(401).json({
          error: 'Token inválido o expirado',
          code: 'UNAUTHORIZED_TOKEN',
        });
      }
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Acceso no autorizado: Debe iniciar sesión para realizar esta acción',
        code: 'UNAUTHORIZED',
      });
    }

    const userRes = await query(
      'SELECT id, email, full_name, phone, neighborhood, role, verified_neighbor FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: 'El usuario asociado a la sesión no existe',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    console.error('Error en requireAuth:', error);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
}

/**
 * Middleware opcional: si viene token lo parsea, si no continúa como visitante anónimo
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id || decoded.sub;
      } catch (err) {
        // Ignorar token inválido en modo opcional
      }
}

    if (userId) {
      const userRes = await query(
        'SELECT id, email, full_name, phone, neighborhood, role, verified_neighbor FROM users WHERE id = $1',
        [userId]
      );
      if (userRes.rows.length > 0) {
        req.user = userRes.rows[0];
      }
    }

    next();
  } catch (error) {
    next();
  }
}
