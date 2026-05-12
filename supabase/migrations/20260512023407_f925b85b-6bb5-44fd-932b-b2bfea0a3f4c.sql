CREATE TABLE public.scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT NOT NULL,
  ticket_id UUID,
  status TEXT NOT NULL,
  message TEXT,
  scanned_by UUID,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_logs_qr_code ON public.scan_logs(qr_code);
CREATE INDEX idx_scan_logs_scanned_at ON public.scan_logs(scanned_at DESC);
CREATE INDEX idx_scan_logs_ticket_id ON public.scan_logs(ticket_id);

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scan logs"
ON public.scan_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));