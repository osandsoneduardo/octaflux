import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, Plus, Trash2, Pencil, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core";

export const Route = createFileRoute("/app/pipeline")({ component: PipelinePage });

type Lead = { id: string; nome: string | null; whatsapp: string | null; faixa_investimento: string | null; pipeline: string; created_at: string };
type Column = { id: string; name: string; position: number; color: string };
type Comment = { id: string; lead_id: string; body: string; author_name: string | null; created_at: string };

const DEFAULT_COLUMNS: Column[] = [
  { id: "default-novo", name: "Novo", position: 0, color: "#6b7280" },
  { id: "default-comunidade", name: "Comunidade", position: 1, color: "#f59e0b" },
  { id: "default-agendamento", name: "Agendamento", position: 2, color: "#10b981" },
];

function PipelinePage() {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState("#6b7280");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Column | null>(null);
  const [commentLead, setCommentLead] = useState<Lead | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const loadColumns = async () => {
    if (!user) return;
    const { data } = await supabase.from("pipeline_columns").select("*").eq("user_id", user.id).order("position");
    if (!data || data.length === 0) {
      const seeded = DEFAULT_COLUMNS.map((c) => ({ user_id: user.id, name: c.name, position: c.position, color: c.color }));
      const { data: ins } = await supabase.from("pipeline_columns").insert(seeded).select();
      setColumns((ins as any) || DEFAULT_COLUMNS);
    } else {
      setColumns(data as any);
    }
  };

  const loadLeads = async () => {
    if (!user) return;
    const { data } = await supabase.from("leads").select("id, nome, whatsapp, faixa_investimento, pipeline, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setLeads((data as any) || []);
    // contagem de comentários por lead (RLS-safe; só vê os próprios)
    const { data: cm } = await supabase.from("lead_comments").select("lead_id").eq("user_id", user.id);
    const c: Record<string, number> = {};
    (cm || []).forEach((r: any) => { c[r.lead_id] = (c[r.lead_id] || 0) + 1; });
    setCounts(c);
  };

  useEffect(() => {
    if (!user) return;
    loadLeads();
    loadColumns();
    // Polling leve (substitui o canal Realtime aberto que vazava PII)
    const t = setInterval(loadLeads, 20000);
    return () => { clearInterval(t); };
  }, [user]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const leadId = String(e.active.id);
    const newCol = String(e.over.id);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.pipeline === newCol) return;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pipeline: newCol } : l)));
    const { error } = await supabase.from("leads").update({ pipeline: newCol }).eq("id", leadId);
    if (error) { toast.error("Erro ao mover."); } else { toast.success(`Movido para ${newCol}`); }
  };

  const addColumn = async () => {
    if (!user || !newColName.trim()) return;
    const { error } = await supabase.from("pipeline_columns").insert({
      user_id: user.id, name: newColName.trim(), position: columns.length, color: newColColor,
    });
    if (error) { toast.error(error.message); return; }
    setNewColName(""); setNewColColor("#6b7280"); setOpenNew(false);
    await loadColumns();
    toast.success("Coluna criada!");
  };

  const updateColumn = async () => {
    if (!editing) return;
    const { error } = await supabase.from("pipeline_columns").update({ name: editing.name, color: editing.color }).eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    setEditing(null); await loadColumns(); toast.success("Atualizada!");
  };

  const removeColumn = async (col: Column) => {
    const count = leads.filter((l) => l.pipeline === col.name).length;
    if (count > 0) { toast.error(`Mova os ${count} leads desta coluna antes de excluir.`); return; }
    if (!confirm(`Excluir a coluna "${col.name}"?`)) return;
    await supabase.from("pipeline_columns").delete().eq("id", col.id);
    await loadColumns(); toast.success("Excluída.");
  };

  const activeLead = leads.find((l) => l.id === activeId);

  return (
    <Layout title="Pipeline" subtitle="Arraste leads. Clique no balão para comentar." actions={
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Nova coluna</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova coluna do pipeline</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={newColName} onChange={(e)=>setNewColName(e.target.value)} placeholder="Ex: Negociação"/></div>
            <div className="space-y-1.5"><Label>Cor</Label><input type="color" value={newColColor} onChange={(e)=>setNewColColor(e.target.value)} className="h-10 w-20 rounded border border-input"/></div>
          </div>
          <DialogFooter><Button onClick={addColumn}>Criar coluna</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    }>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(260px, 1fr))` }}>
          {columns.map((col) => {
            const items = leads.filter((l) => l.pipeline === col.name);
            return <ColumnView key={col.id} col={col} items={items} counts={counts}
              onEdit={() => setEditing(col)} onDelete={() => removeColumn(col)}
              onComment={(l) => setCommentLead(l)} />;
          })}
        </div>
        <DragOverlay>{activeLead && <Card lead={activeLead} commentCount={counts[activeLead.id] || 0} dragging />}</DragOverlay>
      </DndContext>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar coluna</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nome</Label><Input value={editing.name} onChange={(e)=>setEditing({ ...editing, name: e.target.value })}/></div>
              <div className="space-y-1.5"><Label>Cor</Label><input type="color" value={editing.color} onChange={(e)=>setEditing({ ...editing, color: e.target.value })} className="h-10 w-20 rounded border border-input"/></div>
            </div>
          )}
          <DialogFooter><Button onClick={updateColumn}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <CommentsDialog
        lead={commentLead}
        authorName={profile?.brand_name || null}
        onClose={() => { setCommentLead(null); loadLeads(); }}
      />
    </Layout>
  );
}

function ColumnView({ col, items, counts, onEdit, onDelete, onComment }:
  { col: Column; items: Lead[]; counts: Record<string, number>; onEdit: () => void; onDelete: () => void; onComment: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.name });
  return (
    <div ref={setNodeRef}
      className={`bg-card rounded-xl border border-border border-t-4 p-4 transition-colors ${isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      style={{ borderTopColor: col.color }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }}/>{col.name}
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full">{items.length}</span>
          <button onClick={onEdit} className="p-1 hover:bg-muted rounded" title="Editar"><Pencil className="h-3 w-3 text-muted-foreground"/></button>
          <button onClick={onDelete} className="p-1 hover:bg-muted rounded" title="Excluir"><Trash2 className="h-3 w-3 text-destructive"/></button>
        </div>
      </div>
      <div className="space-y-2 min-h-[200px] max-h-[70vh] overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-muted-foreground py-8 text-center border-2 border-dashed border-border rounded-lg">Solte leads aqui</p>}
        {items.map((l) => <DraggableCard key={l.id} lead={l} commentCount={counts[l.id] || 0} onComment={() => onComment(l)} />)}
      </div>
    </div>
  );
}

function DraggableCard({ lead, commentCount, onComment }: { lead: Lead; commentCount: number; onComment: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-30" : ""}>
      <Card lead={lead} commentCount={commentCount} dragHandle={{ ...attributes, ...listeners }} onComment={onComment} />
    </div>
  );
}

function Card({ lead, commentCount, dragging, dragHandle, onComment }:
  { lead: Lead; commentCount: number; dragging?: boolean; dragHandle?: any; onComment?: () => void }) {
  return (
    <div className={`bg-background rounded-lg border border-border p-3 transition-shadow ${dragging ? "shadow-xl rotate-2" : "hover:shadow-sm"}`}>
      <div {...(dragHandle || {})} className="cursor-grab active:cursor-grabbing">
        <div className="font-medium text-sm">{lead.nome || "Sem nome"}</div>
        {lead.faixa_investimento && <div className="text-xs text-muted-foreground mt-1">{lead.faixa_investimento}</div>}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{lead.whatsapp || "—"}</span>
        <div className="flex items-center gap-2">
          {onComment && (
            <button
              onClick={(e) => { e.stopPropagation(); onComment(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              title="Comentários"
            >
              <MessageSquare className="h-3.5 w-3.5"/>
              {commentCount > 0 && <span className="font-semibold">{commentCount}</span>}
            </button>
          )}
          <span>{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>
  );
}

function CommentsDialog({ lead, authorName, onClose }: { lead: Lead | null; authorName: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    if (!lead) { setComments([]); return; }
    (async () => {
      const { data } = await supabase.from("lead_comments").select("*").eq("lead_id", lead.id).order("created_at", { ascending: true });
      setComments((data as any) || []);
    })();
  }, [lead?.id]);

  const add = async () => {
    if (!lead || !user || !body.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("lead_comments").insert({
      lead_id: lead.id, user_id: user.id, body: body.trim(), author_name: authorName,
    }).select().single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setComments((c) => [...c, data as any]);
    setBody("");
  };

  const saveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    const { error } = await supabase.from("lead_comments").update({ body: editBody.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setComments((c) => c.map((x) => x.id === id ? { ...x, body: editBody.trim() } : x));
    setEditingId(null); setEditBody("");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir comentário?")) return;
    const { error } = await supabase.from("lead_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setComments((c) => c.filter((x) => x.id !== id));
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4"/> Comentários — {lead?.nome || "Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum comentário ainda. Adicione o primeiro abaixo.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{c.author_name || "Você"}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
              </div>
              {editingId === c.id ? (
                <div className="space-y-2">
                  <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditBody(""); }}>Cancelar</Button>
                    <Button size="sm" onClick={() => saveEdit(c.id)}>Salvar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setEditingId(c.id); setEditBody(c.body); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-destructive hover:underline">Excluir</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="!flex-col gap-2 sm:!flex-col">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={3}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); add(); }
            }}
          />
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter para enviar</span>
            <Button onClick={add} disabled={loading || !body.trim()}>
              <Send className="h-3.5 w-3.5 mr-1.5"/>Comentar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
