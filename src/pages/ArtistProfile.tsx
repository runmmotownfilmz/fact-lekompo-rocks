import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, Users, Music, Disc, Heart, Share2, ArrowLeft, Loader2, Instagram, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import type { Track } from "@/components/AudioPlayer";

interface ArtistData {
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
  followers_count: number;
  website_url: string | null;
  is_producer: boolean | null;
}

interface ArtistUpload {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  cover_image_url: string | null;
  genre: string | null;
  plays_count: number | null;
  is_single: boolean | null;
  album_id: string | null;
  created_at: string;
}

interface ArtistAlbum {
  id: string;
  title: string;
  cover_image_url: string | null;
  genre: string | null;
  release_date: string | null;
}

const ArtistProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [uploads, setUploads] = useState<ArtistUpload[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "singles" | "albums">("all");

  useEffect(() => {
    if (!userId) return;

    const fetchArtist = async () => {
      const [profileRes, uploadsRes, albumsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("uploads").select("id, title, type, file_url, cover_image_url, genre, plays_count, is_single, album_id, created_at").eq("user_id", userId).eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("albums").select("id, title, cover_image_url, genre, release_date").eq("user_id", userId).eq("is_published", true),
      ]);

      if (profileRes.data) {
        setArtist({
          ...profileRes.data,
          social_links: (profileRes.data.social_links as Record<string, string>) || {},
          followers_count: profileRes.data.followers_count || 0,
        });
      }
      if (uploadsRes.data) setUploads(uploadsRes.data);
      if (albumsRes.data) setAlbums(albumsRes.data);

      // Check follow status
      if (user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };

    fetchArtist();
  }, [userId, user]);

  const toggleFollow = async () => {
    if (!user || !userId) {
      toast({ title: "Sign in required", description: "Please sign in to follow artists.", variant: "destructive" });
      return;
    }

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setIsFollowing(false);
      if (artist) setArtist({ ...artist, followers_count: Math.max(0, artist.followers_count - 1) });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      if (artist) setArtist({ ...artist, followers_count: artist.followers_count + 1 });
    }
  };

  const totalPlays = uploads.reduce((acc, u) => acc + (u.plays_count || 0), 0);
  const singles = uploads.filter((u) => u.is_single || !u.album_id);
  const filteredUploads = activeTab === "singles" ? singles : activeTab === "albums" ? [] : uploads;

  const formatPlays = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 gap-4">
          <p className="text-muted-foreground text-lg">Artist not found</p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/30 via-background to-accent/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
            <div className="flex items-end gap-6">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-background shadow-xl" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-primary/20 border-4 border-background flex items-center justify-center">
                  <Music className="w-16 h-16 text-primary" />
                </div>
              )}
              <div className="pb-2">
                {artist.is_producer && (
                  <span className="text-xs font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                    Verified Artist
                  </span>
                )}
                <h1 className="font-display text-4xl md:text-6xl mt-2">
                  {artist.display_name || artist.username || "Unknown Artist"}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formatPlays(artist.followers_count)} followers</span>
                  <span className="flex items-center gap-1"><Music className="w-4 h-4" /> {uploads.length} tracks</span>
                  <span className="flex items-center gap-1"><Play className="w-4 h-4" /> {formatPlays(totalPlays)} plays</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={toggleFollow} variant={isFollowing ? "outline" : "hero"} size="lg">
              <Users className="w-4 h-4 mr-2" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            {artist.website_url && (
              <a href={artist.website_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="lg"><Globe className="w-4 h-4 mr-2" /> Website</Button>
              </a>
            )}
            {Object.entries(artist.social_links || {}).map(([platform, url]) => (
              <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            ))}
          </div>

          {/* Bio */}
          {artist.bio && (
            <p className="text-muted-foreground mt-6 max-w-2xl">{artist.bio}</p>
          )}

          {/* Tabs */}
          <div className="flex gap-6 mt-8 border-b border-border">
            {(["all", "singles", "albums"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? "All Tracks" : tab}
              </button>
            ))}
          </div>

          {/* Albums Grid */}
          {activeTab === "albums" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {albums.map((album) => (
                <div key={album.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                    {album.cover_image_url ? (
                      <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold truncate">{album.title}</h3>
                  <p className="text-sm text-muted-foreground">{album.genre || "Album"} • {album.release_date ? new Date(album.release_date).getFullYear() : ""}</p>
                </div>
              ))}
              {albums.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">No albums yet</p>
              )}
            </div>
          )}

          {/* Tracks List */}
          {activeTab !== "albums" && (
            <div className="mt-8 space-y-2">
              {filteredUploads.map((upload, i) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                >
                  <span className="w-8 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {upload.cover_image_url ? (
                      <img src={upload.cover_image_url} alt={upload.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{upload.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{upload.type}{upload.genre ? ` • ${upload.genre}` : ""}</p>
                  </div>
                  <span className="text-sm text-muted-foreground hidden md:block">{formatPlays(upload.plays_count || 0)} plays</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredUploads.length === 0 && (
                <p className="text-muted-foreground text-center py-12">No tracks yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
