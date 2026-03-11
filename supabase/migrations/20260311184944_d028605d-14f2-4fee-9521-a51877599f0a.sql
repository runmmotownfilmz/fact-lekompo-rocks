
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'idea',
  genre text,
  bpm integer,
  key_signature text,
  featured_artist text,
  linked_upload_id uuid REFERENCES public.uploads(id) ON DELETE SET NULL,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can do everything with projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project collaborators
CREATE TABLE public.project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'contributor',
  split_percentage numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project owner can manage collaborators" ON public.project_collaborators FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_collaborators.project_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_collaborators.project_id AND p.user_id = auth.uid())
);
CREATE POLICY "Collaborators can view their own invites" ON public.project_collaborators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Collaborators can update their status" ON public.project_collaborators FOR UPDATE USING (auth.uid() = user_id);

-- Now add collaborator view policy on projects
CREATE POLICY "Collaborators can view projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = projects.id AND pc.user_id = auth.uid() AND pc.status = 'accepted')
);

-- Project notes
CREATE TABLE public.project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text,
  note_type text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project owner can manage notes" ON public.project_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_notes.project_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_notes.project_id AND p.user_id = auth.uid())
);
CREATE POLICY "Accepted collaborators can view notes" ON public.project_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_notes.project_id AND pc.user_id = auth.uid() AND pc.status = 'accepted')
);
CREATE POLICY "Accepted collaborators can suggest notes" ON public.project_notes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_notes.project_id AND pc.user_id = auth.uid() AND pc.status = 'accepted')
);
CREATE TRIGGER update_project_notes_updated_at BEFORE UPDATE ON public.project_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project samples
CREATE TABLE public.project_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project owner can manage samples" ON public.project_samples FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_samples.project_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_samples.project_id AND p.user_id = auth.uid())
);
CREATE POLICY "Accepted collaborators can view samples" ON public.project_samples FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_samples.project_id AND pc.user_id = auth.uid() AND pc.status = 'accepted')
);
