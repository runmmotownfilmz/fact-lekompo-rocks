import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Upload as UploadIcon, Image, Loader2, ArrowLeft, Calendar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface UploadFile {
  id: string;
  audioFile: File;
  coverImage: File | null;
  title: string;
  description: string;
  type: "beat" | "mixtape" | "music_pack" | "single";
  bpm: string;
  genre: string;
  price: string;
  composer: string;
  isrcCode: string;
  releaseDate: string;
  albumId: string;
}

interface Album {
  id: string;
  title: string;
}

const createEmptyUpload = (): UploadFile => ({
  id: crypto.randomUUID(),
  audioFile: null as any,
  coverImage: null,
  title: "",
  description: "",
  type: "beat",
  bpm: "",
  genre: "",
  price: "0",
  composer: "",
  isrcCode: "",
  releaseDate: "",
  albumId: "",
});

const UploadPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [uploads, setUploads] = useState<UploadFile[]>([createEmptyUpload()]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (user) {
      supabase
        .from("albums")
        .select("id, title")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setAlbums(data);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const currentUpload = uploads[activeIndex];

  const updateUpload = (field: keyof UploadFile, value: any) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === activeIndex ? { ...u, [field]: value } : u))
    );
  };

  const addTrack = () => {
    setUploads((prev) => [...prev, createEmptyUpload()]);
    setActiveIndex(uploads.length);
  };

  const removeTrack = (index: number) => {
    if (uploads.length <= 1) return;
    setUploads((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex(Math.max(0, activeIndex - 1));
  };

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    const { data, error } = await supabase
      .from("albums")
      .insert({ user_id: user.id, title: newAlbumTitle.trim(), is_published: true })
      .select("id, title")
      .single();

    if (data) {
      setAlbums((prev) => [...prev, data]);
      updateUpload("albumId", data.id);
      setNewAlbumTitle("");
      setShowNewAlbum(false);
      toast({ title: "Album created", description: `"${data.title}" has been created.` });
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalidUploads = uploads.filter((u) => !u.audioFile);
    if (invalidUploads.length > 0) {
      toast({ title: "Missing audio files", description: "All tracks need an audio file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      for (const upload of uploads) {
        let fileUrl = "";
        let coverImageUrl = "";

        // Upload audio
        const audioPath = `${user.id}/${Date.now()}_${upload.audioFile.name}`;
        const { error: audioError } = await supabase.storage.from("uploads").upload(audioPath, upload.audioFile);
        if (audioError) throw audioError;
        const { data: audioUrlData } = supabase.storage.from("uploads").getPublicUrl(audioPath);
        fileUrl = audioUrlData.publicUrl;

        // Upload cover
        if (upload.coverImage) {
          const coverPath = `${user.id}/${Date.now()}_${upload.coverImage.name}`;
          const { error: coverError } = await supabase.storage.from("uploads").upload(coverPath, upload.coverImage);
          if (coverError) throw coverError;
          const { data: coverUrlData } = supabase.storage.from("uploads").getPublicUrl(coverPath);
          coverImageUrl = coverUrlData.publicUrl;
        }

        const { error: dbError } = await supabase.from("uploads").insert({
          user_id: user.id,
          title: upload.title,
          description: upload.description,
          type: upload.type,
          file_url: fileUrl,
          cover_image_url: coverImageUrl || null,
          bpm: upload.bpm ? parseInt(upload.bpm) : null,
          genre: upload.genre || null,
          price: parseFloat(upload.price) || 0,
          composer: upload.composer || null,
          isrc_code: upload.isrcCode || null,
          release_date: upload.releaseDate || null,
          album_id: upload.albumId || null,
          is_single: upload.type === "single",
          is_published: scheduledPublish ? false : true,
          scheduled_publish_at: scheduledPublish && scheduleDate ? scheduleDate : null,
        });
        if (dbError) throw dbError;
      }

      toast({
        title: "Upload successful!",
        description: `${uploads.length} track(s) have been ${scheduledPublish ? "scheduled" : "published"}.`,
      });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const typeOptions = [
    { value: "beat", label: "Beat" },
    { value: "single", label: "Single" },
    { value: "mixtape", label: "Mixtape" },
    { value: "music_pack", label: "Music Pack" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-4xl">UPLOAD YOUR MUSIC</h1>
            </div>
            <p className="text-muted-foreground">
              Share your beats, singles, mixtapes, and music packs with the Lekompo community
            </p>
          </div>

          {/* Bulk upload track tabs */}
          {uploads.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {uploads.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => setActiveIndex(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    i === activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {u.title || `Track ${i + 1}`}
                  {uploads.length > 1 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); removeTrack(i); }}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
              <button onClick={addTrack} className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Track
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Upload Type</Label>
              <div className="flex flex-wrap gap-3">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateUpload("type", option.value)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      currentUpload.type === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Composer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="Enter track title" value={currentUpload.title} onChange={(e) => updateUpload("title", e.target.value)} required className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="composer">Composer / Producer</Label>
                <Input id="composer" placeholder="Producer name" value={currentUpload.composer} onChange={(e) => updateUpload("composer", e.target.value)} className="bg-background border-border" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your track..." value={currentUpload.description} onChange={(e) => updateUpload("description", e.target.value)} rows={3} className="bg-background border-border" />
            </div>

            {/* BPM, Genre, ISRC, Release Date */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bpm">BPM</Label>
                <Input id="bpm" type="number" placeholder="120" value={currentUpload.bpm} onChange={(e) => updateUpload("bpm", e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input id="genre" placeholder="Lekompo" value={currentUpload.genre} onChange={(e) => updateUpload("genre", e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isrc">ISRC Code</Label>
                <Input id="isrc" placeholder="ZA-XXX-XX-XXXXX" value={currentUpload.isrcCode} onChange={(e) => updateUpload("isrcCode", e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input id="releaseDate" type="date" value={currentUpload.releaseDate} onChange={(e) => updateUpload("releaseDate", e.target.value)} className="bg-background border-border" />
              </div>
            </div>

            {/* Album & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Album</Label>
                <div className="flex gap-2">
                  <select
                    value={currentUpload.albumId}
                    onChange={(e) => updateUpload("albumId", e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No album (standalone)</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewAlbum(!showNewAlbum)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {showNewAlbum && (
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="New album name" value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} className="bg-background border-border" />
                    <Button type="button" onClick={createAlbum} variant="outline">Create</Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (ZAR) - 0 for free</Label>
                <Input id="price" type="number" step="0.01" placeholder="0" value={currentUpload.price} onChange={(e) => updateUpload("price", e.target.value)} className="bg-background border-border" />
              </div>
            </div>

            {/* Audio File */}
            <div className="space-y-2">
              <Label>Audio File (MP3/WAV) *</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <input type="file" accept="audio/mpeg,audio/wav,audio/mp3" onChange={(e) => updateUpload("audioFile", e.target.files?.[0] || null)} className="hidden" id={`audio-${activeIndex}`} />
                <label htmlFor={`audio-${activeIndex}`} className="cursor-pointer">
                  <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  {currentUpload.audioFile ? (
                    <p className="text-primary font-medium">{currentUpload.audioFile.name}</p>
                  ) : (
                    <>
                      <p className="text-foreground font-medium">Drop your audio file here</p>
                      <p className="text-sm text-muted-foreground">MP3 or WAV format</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Artwork</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <input type="file" accept="image/*" onChange={(e) => updateUpload("coverImage", e.target.files?.[0] || null)} className="hidden" id={`cover-${activeIndex}`} />
                <label htmlFor={`cover-${activeIndex}`} className="cursor-pointer">
                  <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  {currentUpload.coverImage ? (
                    <p className="text-primary font-medium">{currentUpload.coverImage.name}</p>
                  ) : (
                    <>
                      <p className="text-foreground font-medium">Upload cover artwork</p>
                      <p className="text-sm text-muted-foreground">Recommended: 500x500px</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Schedule Release */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={scheduledPublish} onChange={(e) => setScheduledPublish(e.target.checked)} className="accent-primary" />
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Schedule release</span>
              </label>
              {scheduledPublish && (
                <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="bg-background border-border max-w-xs" />
              )}
            </div>

            {/* Bulk upload button */}
            {uploads.length === 1 && (
              <Button type="button" variant="outline" onClick={addTrack} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add More Tracks (Bulk Upload)
              </Button>
            )}

            {/* Submit */}
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isUploading}>
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading {uploads.length} track(s)...</>
              ) : (
                <><UploadIcon className="w-5 h-5 mr-2" /> Publish {uploads.length > 1 ? `${uploads.length} Tracks` : currentUpload.type.replace("_", " ")}</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
