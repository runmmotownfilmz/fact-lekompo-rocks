import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Upload as UploadIcon, Image, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Upload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"mixtape" | "beat" | "music_pack">("beat");
  const [bpm, setBpm] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("0");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: "Missing audio file",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl = "";
      let coverImageUrl = "";

      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}_${audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from("uploads")
        .upload(audioPath, audioFile);

      if (audioError) throw audioError;

      const { data: audioUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(audioPath);
      fileUrl = audioUrlData.publicUrl;

      // Upload cover image if provided
      if (coverImage) {
        const coverPath = `${user.id}/${Date.now()}_${coverImage.name}`;
        const { error: coverError } = await supabase.storage
          .from("uploads")
          .upload(coverPath, coverImage);

        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(coverPath);
        coverImageUrl = coverUrlData.publicUrl;
      }

      // Create upload record
      const { error: dbError } = await supabase
        .from("uploads")
        .insert({
          user_id: user.id,
          title,
          description,
          type,
          file_url: fileUrl,
          cover_image_url: coverImageUrl || null,
          bpm: bpm ? parseInt(bpm) : null,
          genre: genre || null,
          price: parseFloat(price) || 0,
          is_published: true,
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful!",
        description: `Your ${type} has been published.`,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl">UPLOAD YOUR MUSIC</h1>
          </div>
          <p className="text-muted-foreground">
            Share your beats, mixtapes, and music packs with the Lekompo community
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Upload Type</Label>
            <div className="flex gap-4">
              {[
                { value: "beat", label: "Beat" },
                { value: "mixtape", label: "Mixtape" },
                { value: "music_pack", label: "Music Pack" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value as any)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    type === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter track title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your track..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background border-border"
            />
          </div>

          {/* BPM and Genre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="Lekompo"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (ZAR) - Set to 0 for free</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          {/* Audio File Upload */}
          <div className="space-y-2">
            <Label>Audio File *</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                {audioFile ? (
                  <p className="text-primary font-medium">{audioFile.name}</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium">Drop your audio file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="hidden"
                id="cover-upload"
              />
              <label htmlFor="cover-upload" className="cursor-pointer">
                <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                {coverImage ? (
                  <p className="text-primary font-medium">{coverImage.name}</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium">Upload cover artwork</p>
                    <p className="text-sm text-muted-foreground">Recommended: 500x500px</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5 mr-2" />
                Publish {type.replace("_", " ")}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
