import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Events from "@/components/Events";
import EventBillboards from "@/components/EventBillboards";
import Lifestyle from "@/components/Lifestyle";
import BeatExchange from "@/components/BeatExchange";
import Merch from "@/components/Merch";
import YouTubeBillboard from "@/components/YouTubeBillboard";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import Podcast from "@/components/Podcast";
import SponsorsMarquee from "@/components/SponsorsMarquee";
import AudioPlayer, { type Track } from "@/components/AudioPlayer";
import Footer from "@/components/Footer";
import { useCartSync } from "@/hooks/useCartSync";

const Index = () => {
  useCartSync();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayTrack = useCallback((track: Track, tracks: Track[]) => {
    setCurrentTrack(track);
    setPlaylist(tracks);
    setIsPlaying(true);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${currentTrack ? "pb-24" : ""}`}>
      <Navbar />
      <Hero />
      <EventBillboards />
      <Events />
      <SponsorsMarquee />
      <Lifestyle />
      <BeatExchange
        onPlayTrack={handlePlayTrack}
        currentTrackId={currentTrack?.id}
        isPlaying={isPlaying}
      />
      <SpotifyEmbed />
      <Merch />
      <YouTubeBillboard />
      <Podcast />
      <Footer />
      <AudioPlayer
        track={currentTrack}
        playlist={playlist}
        onTrackChange={(track) => setCurrentTrack(track)}
        onClose={() => { setCurrentTrack(null); setIsPlaying(false); }}
      />
    </div>
  );
};

export default Index;
