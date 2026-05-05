
CREATE TABLE public.ticket_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_email text NOT NULL,
  to_user_id uuid,
  claim_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX idx_ticket_transfers_ticket ON public.ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_token ON public.ticket_transfers(claim_token);
CREATE INDEX idx_ticket_transfers_from ON public.ticket_transfers(from_user_id);

ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Senders view own transfers"
ON public.ticket_transfers FOR SELECT TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Admins view all transfers"
ON public.ticket_transfers FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Senders create transfers for their tickets"
ON public.ticket_transfers FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.is_checked_in = false
  )
);

CREATE POLICY "Senders can cancel their pending transfers"
ON public.ticket_transfers FOR UPDATE TO authenticated
USING (auth.uid() = from_user_id AND status = 'pending')
WITH CHECK (auth.uid() = from_user_id);
