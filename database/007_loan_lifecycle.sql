-- Loan workflow: borrower is solidarity_requests.user_id; accepted lender is resolved_by_user_id.
ALTER TABLE solidarity_requests
  ADD COLUMN IF NOT EXISTS loan_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS loan_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS loan_returned_at TIMESTAMPTZ;

UPDATE solidarity_requests
SET loan_status = CASE
  WHEN status = 'en_proceso' AND resolved_by_user_id IS NOT NULL THEN 'aceptado'
  WHEN status = 'abierta' AND EXISTS (SELECT 1 FROM solidarity_responses r WHERE r.request_id=solidarity_requests.id AND r.status='ofrecido') THEN 'ofrecido'
  WHEN status = 'abierta' THEN 'solicitado'
  ELSE loan_status
END
WHERE type = 'prestamo' AND loan_status IS NULL AND status <> 'resuelta';

DO $$ BEGIN
  ALTER TABLE solidarity_requests
    ADD CONSTRAINT solidarity_loan_status_check
    CHECK (loan_status IS NULL OR loan_status IN ('solicitado','ofrecido','aceptado','entregado','devuelto'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_solidarity_loan_status
  ON solidarity_requests (loan_status) WHERE type = 'prestamo';
