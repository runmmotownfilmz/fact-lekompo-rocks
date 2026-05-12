CREATE TABLE public.beat_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  stripe_session_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_beat_purchases_buyer ON public.beat_purchases(buyer_id);
CREATE INDEX idx_beat_purchases_seller ON public.beat_purchases(seller_id);
CREATE INDEX idx_beat_purchases_upload ON public.beat_purchases(upload_id);

ALTER TABLE public.beat_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view own purchases"
ON public.beat_purchases FOR SELECT TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers view their sales"
ON public.beat_purchases FOR SELECT TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Admins view all purchases"
ON public.beat_purchases FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER beat_purchases_updated_at
BEFORE UPDATE ON public.beat_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();