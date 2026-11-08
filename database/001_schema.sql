-- ==============================================================================
-- PROYECTO: VeciRed - Hackathon UTP 2026
-- INTEGRANTE 2: Base de datos y lógica (Backend)
-- ARCHIVO: database/001_schema.sql
-- ADAPTADO A: Zonas de Arequipa y Categorías del Frontend (Integrante 1)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos Enumerados (ENUMs)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'vecino',
        'comerciante',
        'profesional',
        'lider_comunitario',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE item_type AS ENUM (
        'producto',
        'servicio'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM (
        'activo',
        'pausado',
        'agotado',
        'archivado'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM (
        'prestamo',
        'donacion',
        'intercambio_habilidad',
        'movilidad',
        'ayuda_temporal'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'abierta',
        'en_proceso',
        'resuelta',
        'cancelada'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE emergency_urgency AS ENUM (
        'baja',
        'media',
        'alta',
        'critica'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE support_resource_type AS ENUM (
        'salud',
        'bomberos',
        'seguridad_vecinal',
        'comedor_popular',
        'refugio',
        'voluntariado'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- TABLA 1: users (Usuarios y perfiles vecinales)
-- Zonas compatibles: 'Cercado', 'Cayma', 'Yanahuara', 'José Luis Bustamante y Rivero', 'Cerro Colorado'
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    neighborhood VARCHAR(100) NOT NULL,          -- Zona: 'Cercado', 'Yanahuara', 'Cayma', etc.
    address TEXT,                                -- Dirección referencial
    latitude DECIMAL(10, 7),                     -- Coordenada Arequipa (aprox -16.3988)
    longitude DECIMAL(10, 7),                    -- Coordenada Arequipa (aprox -71.5369)
    avatar_url TEXT DEFAULT '',
    role user_role DEFAULT 'vecino',
    verified_neighbor BOOLEAN DEFAULT false,     -- Aval comunitario verificado
    reputation_score DECIMAL(3, 2) DEFAULT 5.0,  -- Puntuación de confianza vecinal
    bio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA 2: items (Directorio de Oficios y Ofertas Locales)
-- Categorías: 'Comida', 'Oficios', 'Clases', 'Mascotas', 'Hogar'
-- ==============================================================================
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(100) PRIMARY KEY,                 -- Acepta UUIDs y IDs de demo ('demo-lasanas', 'demo-gasfitero')
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type item_type NOT NULL DEFAULT 'servicio',  -- 'producto' o 'servicio'
    title VARCHAR(150) NOT NULL,                 -- oferta.titulo
    description TEXT NOT NULL,                   -- oferta.descripcion
    detail TEXT DEFAULT '',                      -- oferta.detalle
    category VARCHAR(60) NOT NULL,               -- 'Comida', 'Oficios', 'Clases', 'Mascotas', 'Hogar'
    price_range VARCHAR(60) DEFAULT 'A coordinar', -- oferta.precio (ej. 'Desde S/ 16', 'A cotizar')
    currency VARCHAR(10) DEFAULT 'PEN',
    availability VARCHAR(100) DEFAULT 'Inmediata',
    neighborhood VARCHAR(100) NOT NULL,          -- oferta.zona ('Cercado', 'Yanahuara', etc.)
    latitude DECIMAL(10, 7),                     -- oferta.lat para el Mapa Leaflet
    longitude DECIMAL(10, 7),                    -- oferta.lng para el Mapa Leaflet
    seller_name VARCHAR(150) DEFAULT 'Vecino Local', -- oferta.vendedor
    icon VARCHAR(20) DEFAULT '🏠',               -- oferta.icono ('🍝', '🧰', '📚', '🐾', '🏡', '🔧')
    images TEXT[] DEFAULT '{}',
    phone_contact VARCHAR(30),
    status item_status DEFAULT 'activo',
    avg_rating DECIMAL(3, 2) DEFAULT 0.0,        -- Promedio de estrellas calculado por trigger
    reviews_count INT DEFAULT 0,                 -- Cantidad de recomendaciones recibidas
    emergency_service BOOLEAN DEFAULT false,     -- Oficio esencial durante contingencias
    client_id VARCHAR(100),                      -- Idempotencia para sincronización Offline (Int. 4)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA 3: reviews (Sistema Visto Bueno Vecinal: estrellas y opiniones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id VARCHAR(100) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(150) DEFAULT 'Vecino del Barrio', -- opinion.autor
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- opinion.puntuacion (1 a 5 estrellas)
    comment TEXT NOT NULL,                       -- opinion.texto
    neighbor_verified BOOLEAN DEFAULT true,      -- Valida si reside en la misma zona
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_item_review UNIQUE (item_id, reviewer_id)
);

-- ==============================================================================
-- TABLA 4: solidarity_requests (Muro Solidario: sin dinero)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS solidarity_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type request_type NOT NULL,                  -- 'prestamo', 'donacion', 'intercambio_habilidad', etc.
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(60) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,          -- Zona de Arequipa
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    urgency emergency_urgency DEFAULT 'media',
    is_emergency BOOLEAN DEFAULT false,
    status request_status DEFAULT 'abierta',
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA 5: solidarity_responses (Respuestas a solicitudes solidarias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS solidarity_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES solidarity_requests(id) ON DELETE CASCADE,
    helper_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_solution TEXT,
    contact_phone VARCHAR(30),
    status VARCHAR(30) DEFAULT 'ofrecido',       -- 'ofrecido', 'aceptado', 'completado'
    client_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA 6: emergency_resources (Directorio de grupos y apoyo en emergencias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    type support_resource_type NOT NULL,         -- 'salud', 'bomberos', 'seguridad_vecinal', etc.
    description TEXT NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    address TEXT,
    neighborhood VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    operating_hours VARCHAR(100) DEFAULT '24/7',
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLA 7: emergency_reports (Tablero de vulnerabilidad y alertas críticas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    urgency emergency_urgency DEFAULT 'alta',
    affected_people_count INT DEFAULT 1,
    critical_needs TEXT[] DEFAULT '{}',
    neighborhood VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendiente',      -- 'pendiente', 'en_atencion', 'atendido'
    attended_by VARCHAR(150),
    client_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES ESTRATÉGICOS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_neighborhood ON users(neighborhood);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_neighborhood ON items(neighborhood);
CREATE INDEX IF NOT EXISTS idx_items_emergency ON items(emergency_service) WHERE emergency_service = true;
CREATE INDEX IF NOT EXISTS idx_items_client_id ON items(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_solidarity_requests_status ON solidarity_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
