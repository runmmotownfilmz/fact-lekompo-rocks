import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Download, Heart, Music2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/components/AudioPlayer";

interface Upload {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  cover_image_url: string | null;
  genre: string | null;
  bpm: number | null;
  price: number | null;
  plays_count: number | null;
  downloads_count: number | null;
  user_id: string;
  profiles?: { display_name: string | null; username: string | null } | null;
}

// Placeholder beats shown when no uploads exist
const placeholderBeats = [
  { id: "p1", title: "Limpopo Nights", producer: "DJ Maphorisa", bpm: 120, price: 150, plays: "2.3K", downloads: 156 },
  { id: "p2", title: "Township Groove", producer: "Master KG", bpm: 118, price: 200, plays: "5.1K", downloads: 342 },
  { id: "p3", title: "African Soul", producer: "Kabza De Small", bpm: 115, price: 180, plays: "3.8K", downloads: 267 },
  { id: "p4", title: "Midnight Drums", producer: "DJ Stokie", bpm: 122, price: 120, plays: "1.9K", downloads: 98 },
];

interface BeatExchangeProps {
  onPlayTrack?: (track: Track, playlist: Track[]) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}

const BeatExchange = ({ onPlayTrack, currentTrackId, isPlaying }: BeatExchangeProps) => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [usePlaceholders, setUsePlaceholders] = useState(false);

  useEffect(() => {
    const fetchUploads = async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("id, title, type, file_url, cover_image_url, genre, bpm, price, plays_count, downloads_count, user_id")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error || !data || data.length === 0) {
        setUsePlaceholders(true);
      } else {
        setUploads(data);
      }
      setLoading(false);
    };

    fetchUploads();
  }, []);

  const handlePlay = (upload: Upload) => {
    if (!upload.file_url || !onPlayTrack) return;
    
    const track: Track = {
      id: upload.id,
      title: upload.title,
      artist: "Producer",
      audioUrl: upload.file_url,
      coverUrl: upload.cover_image_url || undefined,
    };

    const playlist: Track[] = uploads
      .filter((u) => u.file_url)
      .map((u) => ({
        id: u.id,
        title: u.title,
        artist: "Producer",
        audioUrl: u.file_url!,
        coverUrl: u.cover_image_url || undefined,
      }));

    onPlayTrack(track, playlist);
  };

  const formatPlays = (count: number | null) => {
    if (!count) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <section id="beats" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Producer Marketplace
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            BEAT <span className="text-gradient">EXCHANGE</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Discover and download exclusive Lekompo beats from top producers. 
            Upload your own beats and join the community.
          </p>
        </div>

        {/* Beat Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {usePlaceholders
              ? placeholderBeats.map((beat) => (
                  <Card key={beat.id} className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="p-5">
                      <div className="relative h-24 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                        <div className="flex items-end gap-[2px] h-16">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="w-1 bg-primary/50 rounded-full" style={{ height: `${Math.random() * 100}%`, opacity: 0.3 + Math.random() * 0.7 }} />
                          ))}
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary-foreground ml-1" />
                          </div>
                        </button>
                      </div>
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg mb-1">{beat.title}</h3>
                        <p className="text-sm text-muted-foreground">{beat.producer}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>{beat.bpm} BPM</span>
                        <span>{beat.plays} plays</span>
                        <span>{beat.downloads} downloads</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl text-primary">R{beat.price}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9"><Heart className="w-4 h-4" /></Button>
                          <Button variant="default" size="sm"><Download className="w-4 h-4" />Buy</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : uploads.map((upload) => {
                  const isCurrent = currentTrackId === upload.id;
                  return (
                    <Card key={upload.id} className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                      <CardContent className="p-5">
                        <div className="relative h-24 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                          {upload.cover_image_url ? (
                            <img src={upload.cover_image_url} alt={upload.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          ) : (
                            <div className="flex items-end gap-[2px] h-16">
                              {Array.from({ length: 40 }).map((_, i) => (
                                <div key={i} className="w-1 bg-primary/50 rounded-full" style={{ height: `${Math.random() * 100}%`, opacity: 0.3 + Math.random() * 0.7 }} />
                              ))}
                            </div>
                          )}
                          {upload.file_url && (
                            <button
                              onClick={() => handlePlay(upload)}
                              className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                {isCurrent && isPlaying ? (
                                  <Pause className="w-5 h-5 text-primary-foreground" />
                                ) : (
                                  <Play className="w-5 h-5 text-primary-foreground ml-1" />
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                        <div className="mb-4">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{upload.title}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{upload.type}{upload.genre ? ` • ${upload.genre}` : ""}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          {upload.bpm && <span>{upload.bpm} BPM</span>}
                          <span>{formatPlays(upload.plays_count)} plays</span>
                          <span>{upload.downloads_count || 0} downloads</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xl text-primary">
                            {upload.price ? `R${upload.price}` : "Free"}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9"><Heart className="w-4 h-4" /></Button>
                            <Button variant="default" size="sm"><Download className="w-4 h-4" />Buy</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        )}

        {/* Upload CTA */}
        <div className="text-center bg-gradient-to-r from-card via-card/50 to-card p-8 rounded-2xl border border-border/50">
          <Music2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-2xl mb-2">Are You a Producer?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your Lekompo beats and music packs to reach thousands of artists and fans.
          </p>
          <Button variant="hero" size="lg">
            Start Selling Beats
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BeatExchange;
