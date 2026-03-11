import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Save, Loader2, Music, FileText, Users, PieChart,
  Plus, Trash2, Upload as UploadIcon, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STATUSES = ["idea", "writing", "recording", "mixing", "mastering", "released"];
const STATUS_INDEX: Record<string, number> = Object.fromEntries(STATUSES.map((s, i) => [s, i]));

interface ProjectDetailProps {
  projectId: string;
  userId: string;
  onBack: () => void;
}

const ProjectDetail = ({ projectId, userId, onBack }: ProjectDetailProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idea");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [keySignature, setKeySignature] = useState("");
  const [featuredArtist, setFeaturedArtist] = useState("");

  // Note form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");

  // Collaborator form
  const [collabUsername, setCollabUsername] = useState("");
  const [collabRole, setCollabRole] = useState("contributor");
  const [collabSplit, setCollabSplit] = useState("0");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [projRes, notesRes, samplesRes, collabRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("project_notes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("project_samples").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("project_collaborators").select("*").eq("project_id", projectId),
    ]);

    if (projRes.data) {
      const p = projRes.data;
      setProject(p);
      setTitle(p.title);
      setDescription(p.description || "");
      setStatus(p.status);
      setGenre(p.genre || "");
      setBpm(p.bpm?.toString() || "");
      setKeySignature(p.key_signature || "");
      setFeaturedArtist(p.featured_artist || "");
    }
    if (notesRes.data) setNotes(notesRes.data);
    if (samplesRes.data) setSamples(samplesRes.data);
    if (collabRes.data) setCollaborators(collabRes.data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("projects").update({
      title, description: description || null, status, genre: genre || null,
      bpm: bpm ? parseInt(bpm) : null, key_signature: keySignature || null,
      featured_artist: featuredArtist || null,
    }).eq("id", projectId);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Project saved!" });
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;
    const { error } = await supabase.from("project_notes").insert({
      project_id: projectId, user_id: userId, title: noteTitle.trim(),
      content: noteContent, note_type: noteType,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNoteTitle(""); setNoteContent(""); fetchAll(); }
  };

  const handleDeleteNote = async (id: string) => {
    await supabase.from("project_notes").delete().eq("id", id);
    fetchAll();
  };

  const handleUploadSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${userId}/samples/${projectId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("uploads").upload(path, file);
    if (upErr) { toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    const { error } = await supabase.from("project_samples").insert({
      project_id: projectId, user_id: userId, title: file.name, file_url: urlData.publicUrl,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchAll();
  };

  const handleDeleteSample = async (id: string, fileUrl: string) => {
    const path = fileUrl.split("/uploads/")[1];
    if (path) await supabase.storage.from("uploads").remove([decodeURIComponent(path)]);
    await supabase.from("project_samples").delete().eq("id", id);
    fetchAll();
  };

  const handleAddCollaborator = async () => {
    if (!collabUsername.trim()) return;
    // Look up user by username
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("username", collabUsername.trim()).single();
    if (!profile) { toast({ title: "User not found", description: "No user with that username.", variant: "destructive" }); return; }
    if (profile.user_id === userId) { toast({ title: "That's you!", variant: "destructive" }); return; }

    const { error } = await supabase.from("project_collaborators").insert({
      project_id: projectId, user_id: profile.user_id, role: collabRole,
      split_percentage: parseFloat(collabSplit) || 0, invited_by: userId,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setCollabUsername(""); setCollabSplit("0"); fetchAll(); toast({ title: "Collaborator invited!" }); }
  };

  const handleRemoveCollaborator = async (id: string) => {
    await supabase.from("project_collaborators").delete().eq("id", id);
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-8">Project not found.</p>;

  const ownerSplit = 100 - collaborators.reduce((sum, c) => sum + (c.split_percentage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="font-display text-2xl tracking-wide flex-1 truncate">{project.title}</h2>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Status Pipeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STATUSES.map((s, i) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
              STATUS_INDEX[status] >= i
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 mb-4">
          <TabsTrigger value="details"><Music className="w-3.5 h-3.5 mr-1.5" />Details</TabsTrigger>
          <TabsTrigger value="notes"><FileText className="w-3.5 h-3.5 mr-1.5" />Notes & Lyrics</TabsTrigger>
          <TabsTrigger value="samples"><Mic className="w-3.5 h-3.5 mr-1.5" />Samples</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-3.5 h-3.5 mr-1.5" />Team & Splits</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Featured Artist</label>
                  <Input value={featuredArtist} onChange={(e) => setFeaturedArtist(e.target.value)} placeholder="e.g. DJ Maphorisa" className="bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
                  <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Lekompo" className="bg-background" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">BPM</label>
                    <Input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} className="bg-background" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Key</label>
                    <Input value={keySignature} onChange={(e) => setKeySignature(e.target.value)} placeholder="e.g. C minor" className="bg-background" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description / Notes</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background" placeholder="Project overview, goals, vibe…" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTES & LYRICS TAB */}
        <TabsContent value="notes">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-display">ADD NOTE / LYRICS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" className="bg-background flex-1" />
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[120px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="lyrics">Lyrics</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4} placeholder="Write lyrics, ideas, notes…" className="bg-background font-mono text-sm" />
              <Button size="sm" onClick={handleAddNote} disabled={!noteTitle.trim()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Note
              </Button>

              {notes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg bg-background border border-border group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{n.title}</span>
                          <Badge variant="outline" className="text-[10px]">{n.note_type}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(n.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {n.content && <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{n.content}</pre>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAMPLES TAB */}
        <TabsContent value="samples">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-display">SOUND SAMPLES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <UploadIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload audio sample (MP3, WAV)</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleUploadSample} />
              </label>

              {samples.length > 0 && (
                <div className="space-y-2 pt-2">
                  {samples.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border group">
                      <Mic className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate flex-1">{s.title}</span>
                      <audio controls src={s.file_url} className="h-8 max-w-[200px]" />
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSample(s.id, s.file_url)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM & SPLITS TAB */}
        <TabsContent value="team">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-display">COLLABORATORS & REVENUE SPLITS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ownership notice */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <strong className="text-foreground">🔒 You retain full ownership.</strong> Collaborators get edit access with your approval. Splits are for reference only.
              </div>

              {/* Add collaborator */}
              <div className="flex flex-wrap gap-2">
                <Input value={collabUsername} onChange={(e) => setCollabUsername(e.target.value)} placeholder="Username" className="bg-background flex-1 min-w-[120px]" />
                <Select value={collabRole} onValueChange={setCollabRole}>
                  <SelectTrigger className="w-[130px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="writer">Writer</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input type="number" value={collabSplit} onChange={(e) => setCollabSplit(e.target.value)} className="w-16 bg-background" min="0" max="100" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <Button size="sm" onClick={handleAddCollaborator} disabled={!collabUsername.trim()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              {/* Splits visual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Owner</Badge>
                    <span className="text-sm font-medium">You</span>
                  </div>
                  <span className="text-sm font-display">{ownerSplit}%</span>
                </div>

                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border group">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{c.role}</Badge>
                      <span className="text-sm">{c.user_id.slice(0, 8)}…</span>
                      <Badge variant={c.status === "accepted" ? "default" : "secondary"} className="text-[10px]">
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display">{c.split_percentage}%</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCollaborator(c.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split bar */}
              {collaborators.length > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden border border-border">
                  <div className="bg-primary" style={{ width: `${ownerSplit}%` }} title={`You: ${ownerSplit}%`} />
                  {collaborators.map((c, i) => (
                    <div
                      key={c.id}
                      className="bg-accent"
                      style={{ width: `${c.split_percentage}%`, opacity: 0.5 + (i * 0.15) }}
                      title={`${c.role}: ${c.split_percentage}%`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
