
-- Fix permissive play_history insert - require either authenticated user or allow anonymous plays
DROP POLICY "Anyone can insert play" ON public.play_history;
CREATE POLICY "Authenticated users can log plays" ON public.play_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
