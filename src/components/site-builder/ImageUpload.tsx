import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ImageUpload({
  value, onChange, label = "Imagem",
}: { value?: string; onChange: (url: string) => void; label?: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx. 5MB."); return; }
    setBusy(true);
    const path = `${user.id}/blocks/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file);
    if (error) { setBusy(false); toast.error(error.message); return; }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className="w-full h-24 object-cover rounded-md border border-border" />
          <button onClick={() => onChange("")} className="absolute top-1 right-1 bg-background/90 px-2 py-0.5 text-xs rounded opacity-0 group-hover:opacity-100">Remover</button>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={busy} />
          <div className="border border-dashed border-border rounded-md p-4 text-center text-xs hover:bg-muted/50 transition flex flex-col items-center gap-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Enviando..." : "Enviar imagem"}
          </div>
        </label>
      )}
      <Input placeholder="ou cole uma URL" value={value || ""} onChange={(e) => onChange(e.target.value)} className="text-xs" />
    </div>
  );
}
