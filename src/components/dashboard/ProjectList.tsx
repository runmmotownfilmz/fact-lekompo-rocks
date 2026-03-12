import { useState } from "react";
import { Plus, FolderKanban, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  genre: string | null;
  featured_artist: string | null;
  created_at: string;
  user_id?: string;
  is_collab?: boolean;
}

interface ProjectListProps {
  projects: Project[];
  userId: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  writing: "bg-accent/20 text-accent",
  recording: "bg-primary/20 text-primary",
  mixing: "bg-primary/30 text-primary",
  mastering: "bg-primary/40 text-primary",
  released: "bg-primary text-primary-foreground",
};

const ProjectList = ({ projects, userId, onSelect, onRefresh }: ProjectListProps) => {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("projects").insert({ title: newTitle.trim(), user_id: userId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewTitle("");
      onRefresh();
      toast({ title: "Project created!" });
    }
    setCreating(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      onRefresh();
      toast({ title: "Project deleted" });
    }
    setDeleting(null);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          PROJECT MANAGEMENT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new project */}
        <div className="flex gap-2">
          <Input
            placeholder="New project title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="bg-background border-border"
          />
          <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} size="sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No projects yet. Create one to start planning your next track!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{p.title}</span>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[p.status] || ""}`}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.genre && <span>{p.genre}</span>}
                    {p.featured_artist && <span>ft. {p.featured_artist}</span>}
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, p.id, p.title)}
                    disabled={deleting === p.id}
                  >
                    {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectList;
