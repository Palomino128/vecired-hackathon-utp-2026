-- Integrante 3: movilidad solidaria y gestión de respuestas.
ALTER TABLE solidarity_requests
  ADD COLUMN IF NOT EXISTS intent VARCHAR(20) NOT NULL DEFAULT 'necesidad' CHECK (intent IN ('necesidad','ofrecimiento')),
  ADD COLUMN IF NOT EXISTS departure TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS travel_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passengers INT CHECK (passengers IS NULL OR passengers > 0),
  ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE INDEX IF NOT EXISTS idx_solidarity_priority
  ON solidarity_requests (is_emergency DESC, urgency, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solidarity_responses_request
  ON solidarity_responses (request_id, created_at);

-- Requests remain public; application auth enforces author-only edits and priority changes.
