import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

type ItemType = "feature" | "gallery" | "testimonial" | "faq" | "pricing" | "social";

const SCHEMAS: Record<ItemType, { key: string; label: string; type: "text" | "textarea" | "image" | "list" }[]> = {
  feature: [
    { key: "icon", label: "Ícone (Lucide)", type: "text" },
    { key: "title", label: "Título", type: "text" },
    { key: "text", label: "Descrição", type: "textarea" },
  ],
  gallery: [{ key: "url", label: "Imagem", type: "image" }],
  testimonial: [
    { key: "name", label: "Nome", type: "text" },
    { key: "role", label: "Cargo", type: "text" },
    { key: "text", label: "Depoimento", type: "textarea" },
  ],
  faq: [
    { key: "q", label: "Pergunta", type: "text" },
    { key: "a", label: "Resposta", type: "textarea" },
  ],
  pricing: [
    { key: "name", label: "Nome do plano", type: "text" },
    { key: "price", label: "Preço (ex: R$ 99/mês)", type: "text" },
    { key: "cta", label: "Texto do botão", type: "text" },
    { key: "features", label: "Recursos (1 por linha)", type: "list" },
  ],
  social: [
    { key: "network", label: "Rede (Instagram, WhatsApp, etc.)", type: "text" },
    { key: "url", label: "URL", type: "text" },
  ],
};

const DEFAULT_NEW: Record<ItemType, any> = {
  feature: { icon: "Sparkles", title: "Novo recurso", text: "Descrição" },
  gallery: { url: "" },
  testimonial: { name: "Cliente", role: "Cargo", text: "Excelente serviço!" },
  faq: { q: "Pergunta?", a: "Resposta." },
  pricing: { name: "Plano", price: "R$ 0", cta: "Começar", features: ["Recurso 1"] },
  social: { network: "Instagram", url: "https://instagram.com/" },
};

export function ItemsEditor({
  items, onChange, kind, isStringList,
}: {
  items: any[];
  onChange: (next: any[]) => void;
  kind: ItemType;
  isStringList?: boolean; // gallery uses string[] not object[]
}) {
  const schema = SCHEMAS[kind];

  const update = (i: number, patch: any) => {
    const next = [...items];
    next[i] = isStringList ? patch.url : { ...next[i], ...patch };
    onChange(next);
  };
  const add = () => {
    const def = DEFAULT_NEW[kind];
    onChange([...items, isStringList ? "" : def]);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const obj = isStringList ? { url: item } : item;
        return (
          <div key={i} className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            {schema.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "image" ? (
                  <ImageUpload value={obj[f.key] || ""} onChange={(url) => update(i, { [f.key]: url })} label="" />
                ) : f.type === "textarea" ? (
                  <Textarea value={obj[f.key] || ""} onChange={(e) => update(i, { [f.key]: e.target.value })} rows={2} className="text-sm" />
                ) : f.type === "list" ? (
                  <Textarea
                    value={(obj[f.key] || []).join("\n")}
                    onChange={(e) => update(i, { [f.key]: e.target.value.split("\n").filter(Boolean) })}
                    rows={3} className="text-sm" />
                ) : (
                  <Input value={obj[f.key] || ""} onChange={(e) => update(i, { [f.key]: e.target.value })} className="text-sm" />
                )}
              </div>
            ))}
          </div>
        );
      })}
      <Button size="sm" variant="outline" onClick={add} className="w-full"><Plus className="h-3 w-3 mr-1" />Adicionar item</Button>
    </div>
  );
}
