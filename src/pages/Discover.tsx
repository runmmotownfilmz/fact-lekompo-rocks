import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Clock, Star, Music, Play, Heart, Filter, Loader2, Disc, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AudioPlayer, { Track } from "@/components/AudioPlayer";

interface DiscoverTrack {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  cover_image_url: string | null;
  genre: string | null;
  plays_count: number | null;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string | null; username: string | null; avatar_url: string | null } | null;
}

interface DiscoverArtist {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  is_producer: boolean | null;
}

const genres = ["All", "Lekompo", "Amapiano", "Hip Hop", "Afro House", "Afro Pop", "Kwaito", "Gospel"];

const Discover = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<DiscoverTrack[]>([]);
  const [artists, setArtists] = useState<DiscoverArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "new" | "top" | "artists">("trending");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [artistNames, setArtistNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [tracksRes, artistsRes] = await Promise.all([
        supabase
          .from("uploads")
          .select("id, title, type, file_url, cover_image_url, genre, plays_count, created_at, user_id")
          .eq("is_published", true)
          .order(activeTab === "new" ? "created_at" : "plays_count", { ascending: false })
          .limit(50),
        supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, followers_count, is_producer")
          .eq("is_producer", true)
          .order("followers_count", { ascending: false })
          .limit(20),
      ]);

      if (tracksRes.data) {
        setTracks(tracksRes.data);
        // Fetch artist display names for tracks
        const userIds = [...new Set(tracksRes.data.map((t) => t.user_id))];
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, display_name, username")
            .in("user_id", userIds);
          if (profs) {
            const map: Record<string, string> = {};
            profs.forEach((p) => {
              map[p.user_id] = p.display_name || p.username || "Unknown Artist";
            });
            setArtistNames(map);
          }
        }
      }
      if (artistsRes.data) setArtists(artistsRes.data);
      setLoading(false);
    };

    fetchData();
  }, [activeTab]);

  const filteredTracks = useMemo(() => {
    let result = tracks;
    if (selectedGenre !== "All") {
      result = result.filter((t) => t.genre?.toLowerCase() === selectedGenre.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.genre?.toLowerCase().includes(q));
    }
    return result;
  }, [tracks, selectedGenre, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists;
    const q = searchQuery.toLowerCase();
    return artists.filter((a) =>
      a.display_name?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q)
    );
  }, [artists, searchQuery]);

  const formatPlays = (count: number | null) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const tabs = [
    { key: "trending" as const, label: "Trending", icon: TrendingUp },
    { key: "new" as const, label: "New Releases", icon: Clock },
    { key: "top" as const, label: "Top Charts", icon: Star },
    { key: "artists" as const, label: "Artists", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl md:text-7xl">
              DISCOVER <span className="text-gradient">MUSIC</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Explore trending songs, new releases, top charts, and featured artists
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, albums, playlists..."
              className="pl-12 h-14 text-lg bg-card border-border rounded-xl"
            />
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {tabs.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? "default" : "outline"}
                onClick={() => setActiveTab(key)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" /> {label}
              </Button>
            ))}
          </div>

          {/* Genre Filter (not for artists tab) */}
          {activeTab !== "artists" && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeTab === "artists" ? (
            /* Artists Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.user_id}
                  onClick={() => navigate(`/artist/${artist.user_id}`)}
                  className="text-center cursor-pointer group"
                >
                  <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-muted mb-3 group-hover:ring-4 ring-primary/30 transition-all">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.display_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold truncate">{artist.display_name || artist.username || "Artist"}</h3>
                  <p className="text-sm text-muted-foreground">{formatPlays(artist.followers_count)} followers</p>
                </div>
              ))}
              {filteredArtists.length === 0 && (
                <p className="text-muted-foreground text-center col-span-full py-12">No artists found</p>
              )}
            </div>
          ) : (
            /* Tracks List */
            <div className="space-y-1">
              {filteredTracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => {
                    if (!track.file_url) return;
                    setCurrentTrack({
                      id: track.id,
                      title: track.title,
                      artist: artistNames[track.user_id] || "Unknown Artist",
                      audioUrl: track.file_url,
                      coverUrl: track.cover_image_url || undefined,
                    });
                    // increment plays count fire-and-forget
                    supabase
                      .from("uploads")
                      .update({ plays_count: (track.plays_count || 0) + 1 })
                      .eq("id", track.id)
                      .then(() => {});
                  }}
                  className={`flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group cursor-pointer ${
                    currentTrack?.id === track.id ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="w-8 text-center text-sm text-muted-foreground font-medium">{i + 1}</span>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    {track.cover_image_url ? (
                      <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    {track.file_url && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${currentTrack?.id === track.id ? "text-primary" : ""}`}>{track.title}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {artistNames[track.user_id] || "Unknown Artist"} • {track.genre || track.type}
                      {activeTab === "new" && ` • ${new Date(track.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground hidden md:block">
                    {formatPlays(track.plays_count)} plays
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredTracks.length === 0 && (
                <p className="text-muted-foreground text-center py-12">No tracks found</p>
              )}
            </div>
          )}
        </div>
      </div>
      <AudioPlayer
        track={currentTrack}
        playlist={filteredTracks
          .filter((t) => t.file_url)
          .map((t) => ({
            id: t.id,
            title: t.title,
            artist: artistNames[t.user_id] || "Unknown Artist",
            audioUrl: t.file_url as string,
            coverUrl: t.cover_image_url || undefined,
          }))}
        onTrackChange={(t) => setCurrentTrack(t)}
        onClose={() => setCurrentTrack(null)}
      />
    </div>
  );
};

export default Discover;
