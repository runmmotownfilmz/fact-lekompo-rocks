
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Allow system inserts (via trigger with SECURITY DEFINER)
-- No INSERT policy needed since trigger uses SECURITY DEFINER

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to generate notifications on collaborator status change
CREATE OR REPLACE FUNCTION public.notify_on_collaborator_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_title TEXT;
  _responder_name TEXT;
  _action TEXT;
BEGIN
  -- Only trigger when status changes from 'pending' to 'accepted' or 'declined'
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    -- Get project title
    SELECT title INTO _project_title FROM public.projects WHERE id = NEW.project_id;
    
    -- Get responder display name
    SELECT COALESCE(display_name, username, 'Someone') INTO _responder_name 
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    _action := CASE WHEN NEW.status = 'accepted' THEN 'accepted' ELSE 'declined' END;
    
    -- Notify the project owner (invited_by)
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.invited_by,
      'collab_response',
      _responder_name || ' ' || _action || ' your invitation',
      _responder_name || ' has ' || _action || ' your invitation to collaborate on "' || COALESCE(_project_title, 'Unknown Project') || '".',
      jsonb_build_object('project_id', NEW.project_id, 'collaborator_id', NEW.user_id, 'action', _action)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to project_collaborators
CREATE TRIGGER on_collaborator_response
  AFTER UPDATE ON public.project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_collaborator_response();
