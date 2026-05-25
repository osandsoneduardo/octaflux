import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, GripVertical, Save, Check, X, Undo2, Redo2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { FormField } from "@/lib/qualification";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/app/formulario")({ component: FormEditor });

type ShowIf = { field: string; equals: string } | null;
type Field = Omit<FormField, "user_id"> & { user_id?: string; _new?: boolean; show_if?: ShowIf };

type StyleSettings = {
  welcome_enabled: boolean;
  welcome_title: string;
  welcome_text: string;
  welcome_cta_label: string;
  form_border_radius: number;
  form_submit_label: string;
};

const DEFAULT_STYLE: StyleSettings = {
  welcome_enabled: false,
  welcome_title: "Bem-vindo(a)!",
  welcome_text: "Leva menos de 1 minuto.",
  welcome_cta_label: "Começar",
  form_border_radius: 12,
  form_submit_label: "Enviar",
};

const TYPES = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "email", label: "E-mail" },
  { value: "tel", label: "Telefone / WhatsApp" },
  { value: "number", label: "Número" },
  { value: "select", label: "Seleção (lista)" },
  { value: "qualification", label: "Qualificação (faixa)" },
];

function FormEditor() {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [style, setStyle] = useState<StyleSettings>(DEFAULT_STYLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Histórico undo/redo (apenas para fields)
  const history = useRef<{ past: Field[][]; future: Field[][] }>({ past: [], future: [] });
  const skipHistory = useRef(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("form_fields").select("*").eq("user_id", user.id).order("position"),
      supabase.from("profiles").select("welcome_enabled,welcome_title,welcome_text,welcome_cta_label,form_border_radius,form_submit_label").eq("user_id", user.id).maybeSingle(),
    ]).then(([{ data: ff }, { data: pr }]) => {
      setFields((ff as any) || []);
      if (pr) {
        setStyle({
          welcome_enabled: (pr as any).welcome_enabled ?? false,
          welcome_title: (pr as any).welcome_title ?? DEFAULT_STYLE.welcome_title,
          welcome_text: (pr as any).welcome_text ?? DEFAULT_STYLE.welcome_text,
          welcome_cta_label: (pr as any).welcome_cta_label ?? DEFAULT_STYLE.welcome_cta_label,
          form_border_radius: (pr as any).form_border_radius ?? DEFAULT_STYLE.form_border_radius,
          form_submit_label: (pr as any).form_submit_label ?? DEFAULT_STYLE.form_submit_label,
        });
      }
      setLoading(false);
    });
  }, [user]);

  // Snapshot helper para histórico
  const setFieldsTracked = (updater: (arr: Field[]) => Field[]) => {
    setFields((prev) => {
      const next = updater(prev);
      if (!skipHistory.current) {
        history.current.past.push(prev);
        if (history.current.past.length > 50) history.current.past.shift();
        history.current.future = [];
      }
      skipHistory.current = false;
      return next;
    });
  };

  const undo = () => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.unshift(fields);
    skipHistory.current = true;
    setFields(prev);
  };
  const redo = () => {
    const next = history.current.future.shift();
    if (!next) return;
    history.current.past.push(fields);
    skipHistory.current = true;
    setFields(next);
  };

  // Atalhos teclado: ⌘Z / ⌘⇧Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fields]);

  const addField = () => {
    setFieldsTracked((f) => [...f, {
      id: crypto.randomUUID(), label: "Nova pergunta", field_key: `campo_${f.length+1}`,
      field_type: "text", placeholder: "", required: true, options: [], position: f.length, is_qualifier: false, _new: true,
    }]);
  };

  const updateField = (id: string, patch: Partial<Field>) => {
    if (patch.is_qualifier) {
      setFieldsTracked((arr) => arr.map((f) => f.id === id ? { ...f, ...patch } : { ...f, is_qualifier: false }));
      return;
    }
    setFieldsTracked((arr) => arr.map((f) => f.id === id ? { ...f, ...patch } : f));
  };

  const removeField = (id: string) => setFieldsTracked((arr) => arr.filter((f) => f.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setFieldsTracked((arr) => {
      const oldIdx = arr.findIndex((f) => f.id === active.id);
      const newIdx = arr.findIndex((f) => f.id === over.id);
      return arrayMove(arr, oldIdx, newIdx).map((f, i) => ({ ...f, position: i }));
    });
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    // 1) Salva estilo + welcome no profile
    const { error: pErr } = await supabase.from("profiles").update({
      welcome_enabled: style.welcome_enabled,
      welcome_title: style.welcome_title,
      welcome_text: style.welcome_text,
      welcome_cta_label: style.welcome_cta_label,
      form_border_radius: style.form_border_radius,
      form_submit_label: style.form_submit_label,
    } as any).eq("user_id", user.id);
    if (pErr) { setSaving(false); toast.error("Erro ao salvar estilo: " + pErr.message); return; }

    // 2) Substitui fields
    await supabase.from("form_fields").delete().eq("user_id", user.id);
    const payload = fields.map((f, i) => ({
      user_id: user.id, label: f.label, field_key: f.field_key, field_type: f.field_type,
      placeholder: f.placeholder, required: f.required, options: f.options as any, position: i,
      is_qualifier: f.is_qualifier,
      show_if: f.show_if ?? null,
    }));
    const { error } = await supabase.from("form_fields").insert(payload);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Formulário salvo!");
  };

  // Lista de campos disponíveis para a regra de exibição (todos exceto o próprio)
  const fieldKeyOptions = useMemo(
    () => fields.map((f) => ({ key: f.field_key, label: f.label })),
    [fields]
  );

  return (
    <Layout title="Editor de Formulário" subtitle="Arraste para reordenar. Marque uma pergunta como qualificadora." actions={
      <>
        <Button variant="ghost" size="sm" onClick={undo} title="Desfazer (⌘Z)" disabled={history.current.past.length === 0}>
          <Undo2 className="h-4 w-4"/>
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} title="Refazer (⌘⇧Z)" disabled={history.current.future.length === 0}>
          <Redo2 className="h-4 w-4"/>
        </Button>
        <Button variant="outline" onClick={addField}><Plus className="h-4 w-4 mr-2"/>Adicionar</Button>
        <Button onClick={saveAll} disabled={saving}><Save className="h-4 w-4 mr-2"/>{saving?"Salvando...":"Salvar"}</Button>
      </>
    }>
      <div className="max-w-3xl space-y-3">
        {/* Painel de boas-vindas + estilo */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary"/>
            <h3 className="font-semibold">Tela de boas-vindas & estilo</h3>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={style.welcome_enabled} onCheckedChange={(v)=>setStyle((s)=>({...s, welcome_enabled: v}))}/>
            Mostrar tela de boas-vindas antes da 1ª pergunta
          </label>
          {style.welcome_enabled && (
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Título</Label><Input value={style.welcome_title} onChange={(e)=>setStyle((s)=>({...s, welcome_title: e.target.value}))}/></div>
              <div><Label className="text-xs">Botão</Label><Input value={style.welcome_cta_label} onChange={(e)=>setStyle((s)=>({...s, welcome_cta_label: e.target.value}))}/></div>
              <div className="md:col-span-2"><Label className="text-xs">Texto</Label><Textarea rows={2} value={style.welcome_text} onChange={(e)=>setStyle((s)=>({...s, welcome_text: e.target.value}))}/></div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <Label className="text-xs flex items-center justify-between">
                <span>Bordas dos campos/botões</span>
                <span className="text-muted-foreground">{style.form_border_radius}px</span>
              </Label>
              <Slider value={[style.form_border_radius]} min={0} max={24} step={1}
                onValueChange={(v)=>setStyle((s)=>({...s, form_border_radius: v[0] ?? 12}))}/>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-8 w-16 bg-primary/15 border border-primary/30" style={{ borderRadius: style.form_border_radius }}/>
                <span className="text-xs text-muted-foreground">prévia</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Rótulo do botão final</Label>
              <Input value={style.form_submit_label} onChange={(e)=>setStyle((s)=>({...s, form_submit_label: e.target.value}))}/>
            </div>
          </div>
        </div>

        {loading && <p className="text-muted-foreground">Carregando...</p>}
        {!loading && fields.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">Nenhuma pergunta. Clique em "Adicionar" para começar.</p>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((f, idx) => (
              <SortableField key={f.id} field={f} index={idx} fieldKeyOptions={fieldKeyOptions}
                onChange={(p) => updateField(f.id, p)} onRemove={() => removeField(f.id)} />
            ))}
          </SortableContext>
        </DndContext>
        {fields.length > 0 && (
          <Button variant="outline" onClick={addField} className="w-full"><Plus className="h-4 w-4 mr-2"/>Adicionar pergunta</Button>
        )}
      </div>
    </Layout>
  );
}

function SortableField({ field, index, fieldKeyOptions, onChange, onRemove }: {
  field: Field; index: number;
  fieldKeyOptions: { key: string; label: string }[];
  onChange: (p: Partial<Field>) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const showOptions = field.field_type === "select" || field.field_type === "qualification";

  // Opções para "depende de" — somente campos anteriores
  const dependencyOptions = fieldKeyOptions.slice(0, index);

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-1 text-muted-foreground hover:text-foreground" aria-label="Arrastar">
          <GripVertical className="h-5 w-5"/>
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">#{index + 1}</span>
            {field.is_qualifier && <span className="text-xs font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded">QUALIFICADORA</span>}
            {field.show_if && <span className="text-xs font-semibold bg-accent/30 text-accent-foreground px-2 py-0.5 rounded">CONDICIONAL</span>}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Pergunta</Label><Input value={field.label} onChange={e=>onChange({label:e.target.value})}/></div>
            <div><Label className="text-xs">Identificador (chave)</Label><Input value={field.field_key} onChange={e=>onChange({field_key:e.target.value.replace(/[^a-z0-9_]/gi,"_").toLowerCase()})}/></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Tipo</Label>
              <Select value={field.field_type} onValueChange={(v)=>onChange({field_type:v as any})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{TYPES.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Placeholder</Label><Input value={field.placeholder||""} onChange={e=>onChange({placeholder:e.target.value})}/></div>
          </div>

          {/* Lógica condicional (só faz sentido a partir da 2ª pergunta) */}
          {dependencyOptions.length > 0 && (
            <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Mostrar somente se…</Label>
                {field.show_if && (
                  <Button variant="ghost" size="sm" onClick={()=>onChange({ show_if: null })}>
                    <X className="h-3 w-3 mr-1"/>Sempre mostrar
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <Select
                  value={field.show_if?.field || ""}
                  onValueChange={(v)=>onChange({ show_if: { field: v, equals: field.show_if?.equals || "" } })}
                >
                  <SelectTrigger><SelectValue placeholder="Pergunta anterior"/></SelectTrigger>
                  <SelectContent>{dependencyOptions.map((o)=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input
                  placeholder="for igual a…"
                  value={field.show_if?.equals || ""}
                  onChange={(e)=>onChange({ show_if: { field: field.show_if?.field || "", equals: e.target.value } })}
                  disabled={!field.show_if?.field}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-sm"><Switch checked={field.required} onCheckedChange={v=>onChange({required:v})}/>Obrigatório</label>
            {field.field_type === "qualification" && (
              <label className="flex items-center gap-2 text-sm"><Switch checked={field.is_qualifier} onCheckedChange={v=>onChange({is_qualifier:v})}/>Pergunta de qualificação</label>
            )}
          </div>
          {showOptions && <OptionsEditor field={field} onChange={onChange}/>}
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
      </div>
    </div>
  );
}

function OptionsEditor({ field, onChange }: { field: Field; onChange: (p: Partial<Field>) => void }) {
  const opts = field.options || [];
  const isQual = field.field_type === "qualification";
  const update = (i: number, patch: any) => onChange({ options: opts.map((o, idx) => idx===i ? {...o, ...patch} : o) as any });
  const add = () => onChange({ options: [...opts, { label: "Nova opção", qualified: false }] as any });
  const remove = (i: number) => onChange({ options: opts.filter((_, idx) => idx !== i) as any });
  return (
    <div className="border-t border-border pt-3 space-y-2">
      <Label className="text-xs">Opções</Label>
      {opts.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={o.label} onChange={e=>update(i,{label:e.target.value})} className="flex-1"/>
          {isQual && (
            <button onClick={()=>update(i,{qualified:!o.qualified})}
              className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1 ${o.qualified?"bg-success/15 text-success":"bg-muted text-muted-foreground"}`}>
              {o.qualified?<><Check className="h-3 w-3"/>Qualifica</>:<><X className="h-3 w-3"/>Não qualifica</>}
            </button>
          )}
          <Button variant="ghost" size="icon" onClick={()=>remove(i)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="h-3 w-3 mr-1"/>Adicionar opção</Button>
    </div>
  );
}
