import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Trash2, Loader2, ArrowLeft, Play, Eye, TrendingUp, Disc, BarChart3, FolderKanban, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import ProjectList from "@/components/dashboard/ProjectList";
import ProjectDetail from "@/components/dashboard/ProjectDetail";
import ProjectInvitations from "@/components/dashboard/ProjectInvitations";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Upload {
  id: string;
  title: string;
  type: string;
  genre: string | null;
  plays_count: number | null;
  downloads_count: number | null;
  is_published: boolean | null;
  created_at: string;
  cover_image_url: string | null;
  file_url: string | null;
  bpm: number | null;
  price: number | null;
}

const chartConfig = {
  plays: { label: "Plays", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUploads();
    fetchProjects();
  }, [user]);

  const fetchUploads = async () => {
    if (!user) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("uploads")
      .select("id, title, type, genre, plays_count, downloads_count, is_published, created_at, cover_image_url, file_url, bpm, price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setUploads(data);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setFetching(false);
  };

  const fetchProjects = async () => {
    if (!user) return;
    // Fetch owned projects
    const { data: owned } = await supabase
      .from("projects")
      .select("id, title, description, status, genre, featured_artist, created_at, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch projects where user is an accepted collaborator
    const { data: collabLinks } = await supabase
      .from("project_collaborators")
      .select("project_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    let collabProjects: any[] = [];
    if (collabLinks && collabLinks.length > 0) {
      const collabIds = collabLinks.map((c) => c.project_id);
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, status, genre, featured_artist, created_at, user_id")
        .in("id", collabIds)
        .order("created_at", { ascending: false });
      if (data) collabProjects = data;
    }

    // Merge, owned first, mark collaborator projects
    const all = [
      ...(owned || []).map((p) => ({ ...p, is_collab: false })),
      ...collabProjects.map((p) => ({ ...p, is_collab: true })),
    ];
    setProjects(all);
  };

  const handleTogglePublish = async (upload: Upload) => {
    const newStatus = !upload.is_published;
    const { error } = await supabase.from("uploads").update({ is_published: newStatus }).eq("id", upload.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setUploads((prev) => prev.map((u) => (u.id === upload.id ? { ...u, is_published: newStatus } : u)));
    toast({ title: newStatus ? "Published" : "Unpublished", description: `"${upload.title}" is now ${newStatus ? "live" : "a draft"}.` });
  };

  const handleDelete = async (upload: Upload) => {
    if (!confirm(`Delete "${upload.title}"? This cannot be undone.`)) return;
    setDeleting(upload.id);
    try {
      if (upload.file_url) {
        const path = upload.file_url.split("/uploads/")[1];
        if (path) await supabase.storage.from("uploads").remove([decodeURIComponent(path)]);
      }
      if (upload.cover_image_url?.includes("/uploads/")) {
        const path = upload.cover_image_url.split("/uploads/")[1];
        if (path) await supabase.storage.from("uploads").remove([decodeURIComponent(path)]);
      }
      const { error } = await supabase.from("uploads").delete().eq("id", upload.id);
      if (error) throw error;
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      toast({ title: "Deleted", description: `"${upload.title}" has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) { navigate("/auth"); return null; }

  const totalPlays = uploads.reduce((sum, u) => sum + (u.plays_count || 0), 0);
  const totalDownloads = uploads.reduce((sum, u) => sum + (u.downloads_count || 0), 0);
  const publishedCount = uploads.filter((u) => u.is_published).length;

  const chartData = uploads
    .filter((u) => (u.plays_count || 0) > 0)
    .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
    .slice(0, 10)
    .map((u) => ({ name: u.title.length > 15 ? u.title.slice(0, 15) + "…" : u.title, plays: u.plays_count || 0 }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="font-display text-4xl">ARTIST DASHBOARD</h1>
              </div>
              <Button variant="hero" onClick={() => navigate("/upload")}>
                <Music className="w-4 h-4 mr-2" /> Upload New Track
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Disc, value: uploads.length, label: "Total Tracks" },
              { icon: Play, value: totalPlays.toLocaleString(), label: "Total Plays" },
              { icon: TrendingUp, value: totalDownloads.toLocaleString(), label: "Downloads" },
              { icon: Eye, value: publishedCount, label: "Published" },
            ].map(({ icon: Icon, value, label }) => (
              <Card key={label} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-display">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs: Uploads & Projects */}
          <Tabs defaultValue="uploads" className="w-full">
            <TabsList className="mb-6 bg-muted/50">
              <TabsTrigger value="uploads"><Music className="w-3.5 h-3.5 mr-1.5" />Uploads</TabsTrigger>
              <TabsTrigger value="projects"><FolderKanban className="w-3.5 h-3.5 mr-1.5" />Projects</TabsTrigger>
            </TabsList>

            {/* UPLOADS TAB */}
            <TabsContent value="uploads" className="space-y-6">
              {chartData.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle className="text-lg font-display tracking-wide">TOP TRACKS BY PLAYS</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-lg font-display tracking-wide">YOUR UPLOADS</CardTitle></CardHeader>
                <CardContent>
                  {fetching ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : uploads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No uploads yet. Start sharing your music!</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/upload")}>Upload Your First Track</Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead>Track</TableHead>
                            <TableHead className="hidden sm:table-cell">Type</TableHead>
                            <TableHead className="hidden md:table-cell">Genre</TableHead>
                            <TableHead className="text-right">Plays</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">Downloads</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploads.map((upload) => (
                            <TableRow key={upload.id} className="border-border">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {upload.cover_image_url ? (
                                    <img src={upload.cover_image_url} alt={upload.title} className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>
                                  )}
                                  <span className="font-medium truncate max-w-[150px]">{upload.title}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell capitalize text-muted-foreground">{upload.type.replace("_", " ")}</TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground">{upload.genre || "—"}</TableCell>
                              <TableCell className="text-right font-medium">{(upload.plays_count || 0).toLocaleString()}</TableCell>
                              <TableCell className="hidden sm:table-cell text-right text-muted-foreground">{(upload.downloads_count || 0).toLocaleString()}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <Switch checked={!!upload.is_published} onCheckedChange={() => handleTogglePublish(upload)} />
                                  <span className={`text-xs ${upload.is_published ? "text-primary" : "text-muted-foreground"}`}>{upload.is_published ? "Live" : "Draft"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{new Date(upload.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(upload)} disabled={deleting === upload.id} className="text-muted-foreground hover:text-destructive">
                                  {deleting === upload.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROJECTS TAB */}
            <TabsContent value="projects" className="space-y-4">
              <ProjectInvitations userId={user.id} onAccepted={fetchProjects} />
              {selectedProject ? (
                <ProjectDetail
                  projectId={selectedProject}
                  userId={user.id}
                  onBack={() => { setSelectedProject(null); fetchProjects(); }}
                />
              ) : (
                <ProjectList
                  projects={projects}
                  userId={user.id}
                  onSelect={setSelectedProject}
                  onRefresh={fetchProjects}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
