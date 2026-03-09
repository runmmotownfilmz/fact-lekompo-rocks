import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Shuffle, Repeat, Repeat1, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
}

interface AudioPlayerProps {
  track: Track | null;
  playlist?: Track[];
  onTrackChange?: (track: Track) => void;
  onClose?: () => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const AudioPlayer = ({ track, playlist = [], onTrackChange, onClose }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [queue, setQueue] = useState<Track[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    setQueue(playlist);
  }, [playlist]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const getNextTrack = useCallback((direction: "next" | "prev") => {
    if (!track || queue.length === 0) return null;
    if (shuffle && direction === "next") {
      const available = queue.filter((t) => t.id !== track.id);
      return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : queue[0];
    }
    const idx = queue.findIndex((t) => t.id === track.id);
    const newIdx = direction === "next" ? (idx + 1) % queue.length : (idx - 1 + queue.length) % queue.length;
    return queue[newIdx];
  }, [track, queue, shuffle]);

  const skipTrack = useCallback((direction: "next" | "prev") => {
    const next = getNextTrack(direction);
    if (next) onTrackChange?.(next);
  }, [getNextTrack, onTrackChange]);

  const handleEnded = useCallback(() => {
    if (repeat === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (repeat === "off" && track) {
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx >= queue.length - 1) {
        setIsPlaying(false);
        return;
      }
    }
    skipTrack("next");
  }, [repeat, track, queue, skipTrack]);

  const cycleRepeat = () => {
    setRepeat((prev) => prev === "off" ? "all" : prev === "all" ? "one" : "off");
  };

  if (!track) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border p-3 md:p-4">
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={handleEnded}
        />
        <div className="container mx-auto flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-48">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${shuffle ? "text-primary" : ""}`}
                onClick={() => setShuffle(!shuffle)}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skipTrack("prev")}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skipTrack("next")}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${repeat !== "off" ? "text-primary" : ""}`}
                onClick={cycleRepeat}
              >
                {repeat === "one" ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={([val]) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = val;
                    setCurrentTime(val);
                  }
                }}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume, Queue & Close */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showQueue ? "text-primary" : ""}`}
              onClick={() => setShowQueue(!showQueue)}
            >
              <ListMusic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={([val]) => { setVolume(val); setIsMuted(false); }}
              className="w-24"
            />
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="fixed bottom-[88px] right-4 z-50 w-80 max-h-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg">Queue</h3>
            <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
          </div>
          <div className="overflow-y-auto max-h-80">
            {queue.map((t, i) => (
              <button
                key={t.id}
                onClick={() => onTrackChange?.(t)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${
                  t.id === track.id ? "bg-primary/10" : ""
                }`}
              >
                <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                {t.coverUrl ? (
                  <img src={t.coverUrl} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Play className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${t.id === track.id ? "text-primary font-medium" : ""}`}>{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AudioPlayer;
