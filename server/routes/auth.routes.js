
 // ==============================================================================
 // PROYECTO: VeciRed - Hackathon UTP 2026
 // INTEGRANTE 2: Base de datos y lógica (Backend)
 // ARCHIVO: server/routes/auth.routes.js
 // DESCRIPCIÓN: Registro, autenticación y perfiles de vecinos
 // ==============================================================================

import 'dotenv/config';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'Falta configurar JWT_SECRET en server/.env'
  );
}

// ==============================================================================
// FUNCIONES AUXILIARES
// ==============================================================================

function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizarCoordenada(valor, minimo, maximo) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    return NaN;
  }

  return numero;
}

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ==============================================================================
// POST /api/auth/register
// Registrar nuevo vecino
// ==============================================================================

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      neighborhood,
      address,
      latitude,
      longitude,
      bio = '',
    } = req.body || {};

    // Validar campos obligatorios
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof full_name !== 'string' ||
      typeof neighborhood !== 'string' ||
      !email.trim() ||
      !password ||
      !full_name.trim() ||
      !neighborhood.trim()
    ) {
      return res.status(400).json({
        error:
          'Email, contraseña, nombre completo y barrio son obligatorios.',
      });
    }

    const correo = normalizarEmail(email);
    const nombre = full_name.trim();
    const barrio = neighborhood.trim();

    // Validar correo
    if (!emailValido(correo) || correo.length > 255) {
      return res.status(400).json({
        error: 'Ingrese un correo electrónico válido.',
      });
    }

    // Validar contraseña
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        error:
          'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.',
      });
    }

    // Validar longitudes
    if (nombre.length > 150 || barrio.length > 100) {
      return res.status(400).json({
        error: 'Nombre o barrio demasiado largo.',
      });
    }

    // Validar campos opcionales
    if (
      (phone != null &&
        (typeof phone !== 'string' || phone.length > 30)) ||
      (address != null && typeof address !== 'string') ||
      typeof bio !== 'string'
    ) {
      return res.status(400).json({
        error: 'Los datos opcionales no son válidos.',
      });
    }

    // Validar coordenadas
    const lat = normalizarCoordenada(
      latitude,
      -90,
      90
    );

    const lng = normalizarCoordenada(
      longitude,
      -180,
      180
    );

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        error: 'Las coordenadas no son válidas.',
      });
    }

    const telefonoLimpio = phone == null ? '' : String(phone).trim();
    if (telefonoLimpio && !/^9\d{8}$/.test(telefonoLimpio)) {
      return res.status(400).json({ error: 'El celular peruano debe tener exactamente 9 dígitos y empezar con 9.' });
    }

    // Verificar si el correo ya existe
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [correo]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error:
          'Ya existe una cuenta registrada con este correo electrónico.',
      });
    }

    // Cifrar contraseña mediante bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Registrar nuevo vecino
    // El rol siempre será vecino.
    // No se aceptan roles enviados desde el frontend.
    const insertQuery = `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone,
        neighborhood,
        address,
        latitude,
        longitude,
        role,
        bio
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      )
      RETURNING
        id,
        email,
        full_name,
        phone,
        neighborhood,
        address,
        latitude,
        longitude,
        role,
        verified_neighbor,
        reputation_score,
        bio,
        created_at;
    `;

    const result = await query(insertQuery, [
      correo,
      passwordHash,
      nombre,
      telefonoLimpio || null,
      barrio,
      address || null,
      lat,
      lng,
      'vecino',
      bio,
    ]);

    const newUser = result.rows[0];

    // Generar JWT
    const token = generarToken(newUser);

    return res.status(201).json({
      message:
        'Vecino registrado exitosamente en VeciRed.',
      token,
      user: newUser,
    });

  } catch (error) {
    // Manejar correos duplicados
    if (error.code === '23505') {
      return res.status(409).json({
        error:
          'Ya existe una cuenta con este correo electrónico.',
      });
    }

    console.error('Error en /register:', error);

    return res.status(500).json({
      error: 'Error interno al registrar el usuario.',
    });
  }
});

// ==============================================================================
// POST /api/auth/login
// Inicio de sesión
// ==============================================================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Debe ingresar correo y contraseña.',
      });
    }

    const correo = normalizarEmail(email);

    // Buscar usuario
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas.',
      });
    }

    const usuario = result.rows[0];

    // Comparar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Credenciales inválidas.',
      });
    }

    // Evitar devolver el hash
    const {
      password_hash: _passwordHash,
      ...usuarioSeguro
    } = usuario;

    // Generar token
    const token = generarToken(usuarioSeguro);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: usuarioSeguro,
    });

  } catch (error) {
    console.error('Error en /login:', error);

    return res.status(500).json({
      error: 'Error interno al iniciar sesión.',
    });
  }
});

// ==============================================================================
// GET /api/auth/me
// Consultar perfil del usuario autenticado
// ==============================================================================

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        id,
        email,
        full_name,
        phone,
        neighborhood,
        address,
        latitude,
        longitude,
        role,
        verified_neighbor,
        reputation_score,
        bio,
        avatar_url,
        created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Perfil no encontrado.',
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error en /me:', error);

    return res.status(500).json({
      error: 'Error al consultar el perfil.',
    });
  }
});

// ==============================================================================
// GET /api/auth/users
// Directorio público de vecinos
// ==============================================================================

router.get('/users', async (req, res) => {
  try {
    const { neighborhood } = req.query;

    let sql = `
      SELECT
        id,
        full_name,
        neighborhood,
        role,
        verified_neighbor,
        reputation_score,
        bio,
        avatar_url
      FROM users
    `;

    const params = [];

    // Filtrar por barrio si corresponde
    if (
      typeof neighborhood === 'string' &&
      neighborhood.trim()
    ) {
      sql += ' WHERE neighborhood ILIKE $1';

      params.push(
        `%${neighborhood.trim().slice(0, 100)}%`
      );
    }

    // Máximo 50 vecinos por consulta
    sql += `
      ORDER BY
        verified_neighbor DESC,
        reputation_score DESC
      LIMIT 50;
    `;

    const result = await query(sql, params);

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error en /users:', error);

    return res.status(500).json({
      error: 'Error al listar los vecinos.',
    });
  }
});

export default router;
