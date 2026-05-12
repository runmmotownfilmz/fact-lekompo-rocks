import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AudioPlayer, { type Track } from "@/components/AudioPlayer";
import { toast } from "sonner";
import {
  Play, Download, ShoppingCart, Music2, Package, Plug, Loader2,
  Search, Upload as UploadIcon, CheckCircle2,
} from "lucide-react";

interface UploadRow {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  cover_image_url: string | null;
  genre: string | null;
  bpm: number | null;
  price: number | null;
  description: string | null;
  plays_count: number | null;
  downloads_count: number | null;
  user_id: string;
  composer: string | null;
}

type Filter = "all" | "beat" | "music_pack" | "plugin";

const filters: { id: Filter; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Music2 },
  { id: "beat", label: "Beats", icon: Music2 },
  { id: "music_pack", label: "FL Packs", icon: Package },
  { id: "plugin", label: "Plugins", icon: Plug },
];

const Beats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Fetch items
  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("uploads")
        .select("id,title,type,file_url,cover_image_url,genre,bpm,price,description,plays_count,downloads_count,user_id,composer")
        .eq("is_published", true)
        .in("type", ["beat", "music_pack", "plugin"])
        .order("created_at", { ascending: false });
      const { data } = await q;
      setItems((data || []) as UploadRow[]);
      setLoading(false);
    })();
  }, []);

  // Fetch user's paid purchases
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("beat_purchases")
        .select("upload_id")
        .eq("buyer_id", user.id)
        .eq("status", "paid");
      setPurchasedIds(new Set((data || []).map(p => p.upload_id)));
    })();
  }, [user]);

  // Handle Stripe redirect verification
  useEffect(() => {
    const sessionId = params.get("session_id");
    const purchase = params.get("purchase");
    if (purchase === "cancel") {
      toast.error("Payment cancelled");
      setParams({});
      return;
    }
    if (sessionId && user) {
      (async () => {
        const { data } = await supabase.functions.invoke("verify-beat-payment", {
          body: { session_id: sessionId },
        });
        if (data?.paid && data?.upload) {
          toast.success("Payment successful — downloading your file");
          setPurchasedIds(prev => new Set(prev).add(data.upload.id));
          if (data.upload.file_url) {
            window.open(data.upload.file_url, "_blank");
          }
        }
        setParams({});
      })();
    }
  }, [params, user, setParams]);

  const handleBuy = useCallback(async (item: UploadRow) => {
    if (!user) { navigate("/auth"); return; }
    if (!item.price || Number(item.price) <= 0) {
      if (item.file_url) {
        window.open(item.file_url, "_blank");
        toast.success("Downloading…");
        await supabase
          .from("uploads")
          .update({ downloads_count: (item.downloads_count || 0) + 1 })
          .eq("id", item.id);
      }
      return;
    }
    if (purchasedIds.has(item.id) && item.file_url) {
      window.open(item.file_url, "_blank");
      return;
    }
    setPurchasing(item.id);
    const { data, error } = await supabase.functions.invoke("create-beat-checkout", {
      body: { upload_id: item.id },
    });
    setPurchasing(null);
    if (error || !data?.url) {
      toast.error(data?.error || error?.message || "Checkout failed");
      return;
    }
    window.location.href = data.url;
  }, [user, navigate, purchasedIds]);

  const handlePreview = (item: UploadRow) => {
    if (!item.file_url) return;
    setCurrentTrack({
      id: item.id,
      title: item.title,
      artist: item.composer || "Producer",
      audioUrl: item.file_url,
      coverUrl: item.cover_image_url || undefined,
    });
  };

  const filtered = items.filter(i => {
    if (filter !== "all" && i.type !== filter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`min-h-screen bg-background ${currentTrack ? "pb-24" : ""}`}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Hero */}
          <div className="mb-10 text-center">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Producer Marketplace</span>
            <h1 className="font-display text-5xl md:text-7xl mt-2">
              BEAT <span className="text-gradient">EXCHANGE</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Buy and sell beats, FL Studio music packs, and plugins. List for free or set your price.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Button variant="hero" size="lg" onClick={() => navigate("/upload")}>
                <UploadIcon className="w-4 h-4 mr-2" /> Start Selling
              </Button>
              {user && (
                <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
                  My Uploads
                </Button>
              )}
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col md:flex-row gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {filters.map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                      filter === f.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 md:max-w-sm md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search beats, packs, plugins…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-2xl border border-border">
              <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No items found. Be the first to list one.</p>
              <Button variant="hero" onClick={() => navigate("/upload")}>
                <UploadIcon className="w-4 h-4 mr-2" /> Upload Now
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(item => {
                const owned = purchasedIds.has(item.id);
                const free = !item.price || Number(item.price) <= 0;
                const isOwn = user?.id === item.user_id;
                return (
                  <Card key={item.id} className="bg-card border-border/60 hover:border-primary/40 transition-all group overflow-hidden">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {item.cover_image_url ? (
                        <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          {item.type === "plugin" ? <Plug className="w-12 h-12 text-primary/40" /> :
                            item.type === "music_pack" ? <Package className="w-12 h-12 text-primary/40" /> :
                            <Music2 className="w-12 h-12 text-primary/40" />}
                        </div>
                      )}
                      {item.file_url && item.type === "beat" && (
                        <button
                          onClick={() => handlePreview(item)}
                          className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary-foreground ml-1" />
                          </div>
                        </button>
                      )}
                      <Badge variant="secondary" className="absolute top-2 left-2 capitalize text-xs">
                        {item.type.replace("_", " ")}
                      </Badge>
                      {owned && (
                        <Badge className="absolute top-2 right-2 bg-green-500/90 text-white gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Owned
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                        {item.composer || "Producer"}{item.genre ? ` • ${item.genre}` : ""}{item.bpm ? ` • ${item.bpm} BPM` : ""}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-2xl text-primary">
                          {free ? "FREE" : `R${Number(item.price).toFixed(0)}`}
                        </span>
                        <Button
                          variant={free || owned ? "outline" : "default"}
                          size="sm"
                          disabled={purchasing === item.id || isOwn}
                          onClick={() => handleBuy(item)}
                        >
                          {purchasing === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isOwn ? (
                            "Your listing"
                          ) : free || owned ? (
                            <><Download className="w-4 h-4 mr-1" /> Download</>
                          ) : (
                            <><ShoppingCart className="w-4 h-4 mr-1" /> Buy</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AudioPlayer
        track={currentTrack}
        playlist={currentTrack ? [currentTrack] : []}
        onTrackChange={(t) => setCurrentTrack(t)}
        onClose={() => setCurrentTrack(null)}
      />
    </div>
  );
};

export default Beats;
