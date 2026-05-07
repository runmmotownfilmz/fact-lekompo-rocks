ALTER TABLE public.ticket_orders
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS payfast_payment_id text;