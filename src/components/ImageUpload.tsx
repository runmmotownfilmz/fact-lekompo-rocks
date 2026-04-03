import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  folder?: string;
  accept?: string;
  className?: string;
}

const ImageUpload = ({
  value,
  onChange,
  label,
  folder = "admin",
  accept = "image/*",
  className = "",
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && !value.startsWith("blob:") ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const handleRemove = () => {
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setMode(m => (m === "upload" ? "url" : "upload"))}
          className="text-xs text-primary hover:underline"
        >
          {mode === "upload" ? "Use URL instead" : "Upload file instead"}
        </button>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : value ? (
              <div className="relative inline-block">
                <img
                  src={value}
                  alt="Preview"
                  className="max-h-32 rounded-lg object-cover mx-auto"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
                <Upload className="w-8 h-8" />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs">Max 5MB • JPG, PNG, WebP</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      )}

      {mode === "url" && value && (
        <img src={value} alt="Preview" className="mt-2 max-h-24 rounded-lg object-cover" />
      )}
    </div>
  );
};

export default ImageUpload;
