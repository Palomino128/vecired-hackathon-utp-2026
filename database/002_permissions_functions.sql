-- ==============================================================================
-- PROYECTO: VeciRed - Hackathon UTP 2026
-- INTEGRANTE 2: Base de datos y lógica (Backend)
-- ARCHIVO: database/002_permissions_functions.sql
-- DESCRIPCIÓN: Triggers automáticos, Funciones de rating y Políticas de Seguridad
-- ==============================================================================

-- 1. Trigger: Actualización automática de updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated_at ON items;
CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_solidarity_requests_updated_at ON solidarity_requests;
CREATE TRIGGER trg_solidarity_requests_updated_at
BEFORE UPDATE ON solidarity_requests
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_emergency_reports_updated_at ON emergency_reports;
CREATE TRIGGER trg_emergency_reports_updated_at
BEFORE UPDATE ON emergency_reports
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2. Trigger: Recálculo automático del Visto Bueno Vecinal (Estrellas y Conteo)
CREATE OR REPLACE FUNCTION fn_update_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_item_id VARCHAR(100);
    v_avg DECIMAL(3, 2);
    v_count INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_item_id := OLD.item_id;
    ELSE
        target_item_id := NEW.item_id;
    END IF;

    SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0),
        COUNT(*)
    INTO v_avg, v_count
    FROM reviews
    WHERE item_id = target_item_id;

    UPDATE items
    SET
        avg_rating = v_avg,
        reviews_count = v_count,
        updated_at = NOW()
    WHERE id = target_item_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_item_rating ON reviews;
CREATE TRIGGER trg_recalculate_item_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_update_item_rating();

-- 3. Trigger: Prevención de Auto-Reseñas (Anti-Fraude)
CREATE OR REPLACE FUNCTION fn_prevent_self_review()
RETURNS TRIGGER AS $$
DECLARE
    item_owner_id UUID;
BEGIN
    SELECT user_id INTO item_owner_id
    FROM items
    WHERE id = NEW.item_id;

    IF (item_owner_id = NEW.reviewer_id) THEN
        RAISE EXCEPTION 'Operación rechazada: Un vecino no puede otorgarse Visto Bueno Vecinal a su propia publicación.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_review ON reviews;
CREATE TRIGGER trg_prevent_self_review
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_prevent_self_review();

-- 4. Función: Resolver Solicitud Solidaria
CREATE OR REPLACE FUNCTION fn_resolve_solidarity_request(
    p_request_id UUID,
    p_helper_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE solidarity_requests
    SET
        status = 'resuelta',
        resolved_by_user_id = p_helper_id,
        updated_at = NOW()
    WHERE id = p_request_id;

    UPDATE solidarity_responses
    SET status = 'completado'
    WHERE request_id = p_request_id AND helper_user_id = p_helper_id;

    SELECT row_to_json(r) INTO result
    FROM (
        SELECT sr.id, sr.title, sr.status, sr.resolved_by_user_id, sr.updated_at,
               u.full_name as helper_name
        FROM solidarity_requests sr
        LEFT JOIN users u ON u.id = sr.resolved_by_user_id
        WHERE sr.id = p_request_id
    ) r;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE solidarity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE solidarity_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_items_select ON items;
CREATE POLICY p_items_select ON items FOR SELECT USING (true);

DROP POLICY IF EXISTS p_reviews_select ON reviews;
CREATE POLICY p_reviews_select ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS p_solidarity_select ON solidarity_requests;
CREATE POLICY p_solidarity_select ON solidarity_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS p_emergency_res_select ON emergency_resources;
CREATE POLICY p_emergency_res_select ON emergency_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS p_emergency_rep_select ON emergency_reports;
CREATE POLICY p_emergency_rep_select ON emergency_reports FOR SELECT USING (true);
