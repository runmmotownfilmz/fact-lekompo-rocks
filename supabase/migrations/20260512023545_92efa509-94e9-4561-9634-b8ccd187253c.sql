ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;
ALTER TABLE public.scan_logs REPLICA IDENTITY FULL;