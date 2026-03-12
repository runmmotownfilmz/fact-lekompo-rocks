
-- Fix infinite recursion: create security definer helpers to break the cycle

-- Helper: check if user owns a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = _user_id
  )
$$;

-- Helper: check if user is an accepted collaborator on a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_project_collaborator(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = _project_id AND user_id = _user_id AND status = 'accepted'
  )
$$;

-- Drop all existing policies on projects
DROP POLICY IF EXISTS "Collaborators can view projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can do everything with projects" ON public.projects;

-- Recreate projects policies using the helper functions
CREATE POLICY "Owners can do everything with projects"
  ON public.projects FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Collaborators can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_project_collaborator(id, auth.uid()));

-- Drop all existing policies on project_collaborators
DROP POLICY IF EXISTS "Collaborators can update their status" ON public.project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own invites" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owner can manage collaborators" ON public.project_collaborators;

-- Recreate project_collaborators policies using the helper function
CREATE POLICY "Collaborators can view their own invites"
  ON public.project_collaborators FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Collaborators can update their status"
  ON public.project_collaborators FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Project owner can manage collaborators"
  ON public.project_collaborators FOR ALL TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

-- Fix project_notes policies too (same pattern)
DROP POLICY IF EXISTS "Accepted collaborators can suggest notes" ON public.project_notes;
DROP POLICY IF EXISTS "Accepted collaborators can view notes" ON public.project_notes;
DROP POLICY IF EXISTS "Project owner can manage notes" ON public.project_notes;

CREATE POLICY "Project owner can manage notes"
  ON public.project_notes FOR ALL TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Accepted collaborators can view notes"
  ON public.project_notes FOR SELECT TO authenticated
  USING (public.is_project_collaborator(project_id, auth.uid()));

CREATE POLICY "Accepted collaborators can suggest notes"
  ON public.project_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_project_collaborator(project_id, auth.uid()));

-- Fix project_samples policies too
DROP POLICY IF EXISTS "Accepted collaborators can view samples" ON public.project_samples;
DROP POLICY IF EXISTS "Project owner can manage samples" ON public.project_samples;

CREATE POLICY "Project owner can manage samples"
  ON public.project_samples FOR ALL TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Accepted collaborators can view samples"
  ON public.project_samples FOR SELECT TO authenticated
  USING (public.is_project_collaborator(project_id, auth.uid()));
