import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Play, Lock, Globe, Users, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean | null;
  is_collaborative: boolean | null;
  created_at: string;
  user_id: string;
  song_count?: number;
}

const Playlists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newIsCollaborative, setNewIsCollaborative] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const fetchPlaylists = async () => {
    setLoading(true);
    let query = supabase.from("playlists").select("*").order("created_at", { ascending: false });
    
    if (user) {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
    } else {
      query = query.eq("is_public", true);
    }

    const { data } = await query.limit(50);
    if (data) setPlaylists(data);
    setLoading(false);
  };

  const createPlaylist = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!newTitle.trim()) return;

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        is_public: newIsPublic,
        is_collaborative: newIsCollaborative,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setPlaylists((prev) => [data, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setDialogOpen(false);
      toast({ title: "Playlist created!" });
    }
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Playlist deleted" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-display text-5xl md:text-6xl">
                YOUR <span className="text-gradient">PLAYLISTS</span>
              </h1>
              <p className="text-muted-foreground mt-2">Create, share, and discover curated music collections</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg" disabled={!user}>
                  <Plus className="w-4 h-4 mr-2" /> New Playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Create Playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="My Playlist" className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Describe your playlist..." rows={3} className="bg-background border-border" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)} className="accent-primary" />
                      <Globe className="w-4 h-4" /> Public
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newIsCollaborative} onChange={(e) => setNewIsCollaborative(e.target.checked)} className="accent-primary" />
                      <Users className="w-4 h-4" /> Collaborative
                    </label>
                  </div>
                  <Button onClick={createPlaylist} variant="hero" className="w-full">Create Playlist</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!user && (
            <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
              <Music className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-display text-2xl mb-2">Sign in to create playlists</h3>
              <p className="text-muted-foreground mb-4">Create and share your music collections with the community</p>
              <Button onClick={() => navigate("/auth")} variant="hero">Sign In</Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden bg-card border border-border mb-3 relative">
                    {playlist.cover_image_url ? (
                      <img src={playlist.cover_image_url} alt={playlist.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Music className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="default" size="icon" className="rounded-full h-12 w-12">
                        <Play className="w-5 h-5 ml-0.5" />
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!playlist.is_public && (
                        <span className="bg-background/80 backdrop-blur-sm p-1 rounded">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      {playlist.is_collaborative && (
                        <span className="bg-background/80 backdrop-blur-sm p-1 rounded">
                          <Users className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {user && playlist.user_id === user.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                        className="absolute top-2 left-2 bg-destructive/80 backdrop-blur-sm p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-destructive-foreground" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold truncate">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{playlist.description || "Playlist"}</p>
                </div>
              ))}
              {playlists.length === 0 && (
                <p className="text-muted-foreground text-center col-span-full py-12">No playlists yet. Create the first one!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Playlists;
