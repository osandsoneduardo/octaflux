import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SectionStyles = {
  bg_color?: string;
  bg_image?: string;
  padding_y?: number;
  padding_x?: number;
  max_width?: string;
  border_radius?: number;
};

type Props = {
  value: SectionStyles;
  onChange: (next: SectionStyles) => void;
};

export function SectionStyleEditor({ value, onChange }: Props) {
  const set = (patch: Partial<SectionStyles>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Estilo da seção</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Fundo</Label>
          <Input
            type="color"
            value={value.bg_color || "#000000"}
            onChange={(e) => set({ bg_color: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Borda (px)</Label>
          <Input
            type="number"
            min={0}
            max={64}
            value={value.border_radius ?? 0}
            onChange={(e) => set({ border_radius: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="text-xs">Padding Y (px)</Label>
          <Input
            type="number"
            min={0}
            max={400}
            value={value.padding_y ?? 64}
            onChange={(e) => set({ padding_y: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="text-xs">Padding X (px)</Label>
          <Input
            type="number"
            min={0}
            max={400}
            value={value.padding_x ?? 24}
            onChange={(e) => set({ padding_x: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Largura máxima</Label>
          <select
            value={value.max_width || "default"}
            onChange={(e) => set({ max_width: e.target.value })}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
          >
            <option value="default">Padrão</option>
            <option value="640px">Estreita (640px)</option>
            <option value="960px">Média (960px)</option>
            <option value="1200px">Larga (1200px)</option>
            <option value="100%">Tela cheia</option>
          </select>
        </div>
      </div>
    </div>
  );
}
