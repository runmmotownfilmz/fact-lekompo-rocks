import { useState, useEffect } from "react";
import { Mail, Check, X, Loader2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Invitation {
  id: string;
  project_id: string;
  role: string;
  split_percentage: number | null;
  status: string;
  created_at: string;
  project_title?: string;
  inviter_name?: string;
}

interface ProjectInvitationsProps {
  userId: string;
  onAccepted: () => void;
}

const ProjectInvitations = ({ userId, onAccepted }: ProjectInvitationsProps) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_collaborators")
      .select("id, project_id, role, split_percentage, status, created_at, invited_by")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    // Fetch project titles and inviter names
    const projectIds = [...new Set(data.map((d) => d.project_id))];
    const inviterIds = [...new Set(data.map((d) => d.invited_by))];

    const [projectsRes, profilesRes] = await Promise.all([
      supabase.from("projects").select("id, title").in("id", projectIds),
      supabase.from("profiles").select("user_id, display_name, username").in("user_id", inviterIds),
    ]);

    const projectMap = new Map(
      (projectsRes.data || []).map((p) => [p.id, p.title])
    );
    const profileMap = new Map(
      (profilesRes.data || []).map((p) => [p.user_id, p.display_name || p.username || "Unknown"])
    );

    setInvitations(
      data.map((inv) => ({
        ...inv,
        project_title: projectMap.get(inv.project_id) || "Unknown Project",
        inviter_name: profileMap.get(inv.invited_by) || "Unknown",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const handleRespond = async (id: string, accept: boolean) => {
    setResponding(id);
    const { error } = await supabase
      .from("project_collaborators")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: accept ? "Invitation accepted!" : "Invitation declined" });
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      if (accept) onAccepted();
    }
    setResponding(null);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (invitations.length === 0) return null;

  return (
    <Card className="bg-card border-border border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display tracking-wide flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          PENDING INVITATIONS ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <FolderKanban className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-sm truncate">{inv.project_title}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{inv.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Invited by <span className="text-foreground">{inv.inviter_name}</span>
                {inv.split_percentage ? ` · ${inv.split_percentage}% split` : ""}
                {" · "}
                {new Date(inv.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2.5 text-xs"
                onClick={() => handleRespond(inv.id, true)}
                disabled={responding === inv.id}
              >
                {responding === inv.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <><Check className="w-3 h-3 mr-1" /> Accept</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs"
                onClick={() => handleRespond(inv.id, false)}
                disabled={responding === inv.id}
              >
                <X className="w-3 h-3 mr-1" /> Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectInvitations;
