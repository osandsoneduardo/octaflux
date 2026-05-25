import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Download, MessageCircle, Calendar, Users, CheckCircle2, XCircle, Percent, Plus, Trash2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsappUrl, fillTemplate } from "@/lib/qualification";

export const Route = createFileRoute("/app/crm")({ component: CrmPage });

type Lead = {
  id: string; nome: string | null; whatsapp: string | null; email: string | null;
  faixa_investimento: string | null; status: string; pipeline: string;
  created_at: string; custom_data: any; scheduled_at: string | null;
};

function CrmPage() {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [settings, setSettings] = useState<any>(null);
  const [openNew, setOpenNew] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setLeads((data as any) || []);
      setLoading(false);
    };
    load();
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setSettings(data));
    // Polling leve a cada 20s (substitui realtime após hardening de segurança)
    const t = setInterval(load, 20000);
    return () => { clearInterval(t); };
  }, [user]);

  const filtered = useMemo(() => leads.filter((l) => {
    const m = search.toLowerCase();
    const matches = !m || (l.nome || "").toLowerCase().includes(m) || (l.email || "").toLowerCase().includes(m);
    return matches && (statusFilter === "all" || l.status === statusFilter);
  }), [leads, search, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const q = leads.filter((l) => l.status === "Qualificado").length;
    return { total, q, nq: total - q, rate: total ? Math.round((q / total) * 100) : 0 };
  }, [leads]);

  // Anti CSV/XLS formula injection: prefixa células que começam com =, +, -, @ ou tab/CR
  const safeCell = (v: any) => {
    const s = String(v ?? "");
    return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  };
  const escHtml = (v: any) =>
    safeCell(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[c]);

  const exportCSV = () => {
    const headers = ["Nome", "WhatsApp", "E-mail", "Faixa", "Status", "Pipeline", "Data"];
    const rows = filtered.map((l) => [l.nome || "", l.whatsapp || "", l.email || "", l.faixa_investimento || "", l.status, l.pipeline, new Date(l.created_at).toLocaleString("pt-BR")]);
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map((c) => `"${safeCell(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    download(csv, "leads.csv", "text/csv;charset=utf-8");
    toast.success("CSV exportado!");
  };
  const exportXLS = () => {
    const headers = ["Nome", "WhatsApp", "E-mail", "Faixa", "Status", "Pipeline", "Data"];
    const html = `<html><head><meta charset="utf-8"/></head><body><table border="1"><tr>${headers.map(h=>`<th>${escHtml(h)}</th>`).join("")}</tr>${filtered.map(l=>`<tr><td>${escHtml(l.nome||"")}</td><td>${escHtml(l.whatsapp||"")}</td><td>${escHtml(l.email||"")}</td><td>${escHtml(l.faixa_investimento||"")}</td><td>${escHtml(l.status)}</td><td>${escHtml(l.pipeline)}</td><td>${escHtml(new Date(l.created_at).toLocaleString("pt-BR"))}</td></tr>`).join("")}</table></body></html>`;
    download(html, "leads.xls", "application/vnd.ms-excel");
    toast.success("XLS exportado!");
  };

  const openWhatsapp = (lead: Lead) => {
    if (!settings || !lead.whatsapp) return;
    const tpl = lead.status === "Qualificado" ? settings.wa_msg_qualificado : settings.wa_msg_nao_qualificado;
    const msg = fillTemplate(tpl || "", { nome: lead.nome || "", calendly: settings.calendly_url || "" });
    window.open(buildWhatsappUrl(lead.whatsapp, msg), "_blank");
  };

  const removeLead = async (id: string) => {
    if (!confirm("Excluir este lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    toast.success("Lead removido.");
  };

  return (
    <Layout title="CRM / Leads" subtitle="Todos os leads capturados." actions={
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Novo lead</Button></DialogTrigger>
        <NewLeadDialog onClose={() => setOpenNew(false)} userId={user?.id || ""} />
      </Dialog>
    }>
      {profile?.slug && leads.length === 0 && !loading && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5"/></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Compartilhe seu formulário para receber leads</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{typeof window !== "undefined" ? window.location.origin : ""}/f/{profile.slug}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/f/${profile.slug}`);toast.success("Link copiado!");}}><Copy className="h-3 w-3 mr-1"/>Copiar</Button>
            <Button size="sm" asChild><a href={`/f/${profile.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1"/>Abrir</a></Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} color="text-foreground" />
        <StatCard icon={CheckCircle2} label="Qualificados" value={stats.q} color="text-success" />
        <StatCard icon={XCircle} label="Não qualificados" value={stats.nq} color="text-destructive" />
        <StatCard icon={Percent} label="Taxa qualificação" value={`${stats.rate}%`} color="text-primary" />
      </div>

      <div className="bg-card rounded-xl border border-border p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Qualificado">Qualificado</SelectItem>
              <SelectItem value="Não qualificado">Não qualificado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>CSV</Button>
          <Button variant="outline" onClick={exportXLS}><Download className="h-4 w-4 mr-2"/>XLS</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 px-2 font-medium">Nome</th>
                <th className="py-3 px-2 font-medium">WhatsApp</th>
                <th className="py-3 px-2 font-medium">E-mail</th>
                <th className="py-3 px-2 font-medium">Faixa</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium">Agendado</th>
                <th className="py-3 px-2 font-medium">Data</th>
                <th className="py-3 px-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Nenhum lead ainda. Compartilhe o link do seu formulário!</td></tr>}
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-2 font-medium">{l.nome || "—"}</td>
                  <td className="py-3 px-2">{l.whatsapp || "—"}</td>
                  <td className="py-3 px-2 text-muted-foreground">{l.email || "—"}</td>
                  <td className="py-3 px-2 text-xs">{l.faixa_investimento || "—"}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${l.status === "Qualificado" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{l.status}</span>
                  </td>
                  <td className="py-3 px-2 text-xs">{l.scheduled_at ? new Date(l.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openWhatsapp(l)} className="p-2 rounded hover:bg-success/15 text-success" title="WhatsApp"><MessageCircle className="h-4 w-4"/></button>
                      {l.status === "Qualificado" && settings?.calendly_url && (
                        <button onClick={() => window.open(settings.calendly_url, "_blank")} className="p-2 rounded hover:bg-primary/15 text-primary" title="Calendly"><Calendar className="h-4 w-4"/></button>
                      )}
                      <button onClick={() => removeLead(l.id)} className="p-2 rounded hover:bg-destructive/15 text-destructive" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${color}`}/></div>
      <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}

function NewLeadDialog({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [d, setD] = useState({ nome: "", whatsapp: "", email: "", faixa: "", status: "Qualificado", pipeline: "Novo" });
  const save = async () => {
    if (!d.nome) { toast.error("Nome é obrigatório."); return; }
    const { error } = await supabase.from("leads").insert({
      user_id: userId, nome: d.nome, whatsapp: d.whatsapp, email: d.email,
      faixa_investimento: d.faixa, status: d.status, pipeline: d.pipeline,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Lead criado!"); onClose();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo lead manual</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome *</Label><Input value={d.nome} onChange={e=>setD({...d,nome:e.target.value})}/></div>
        <div><Label>WhatsApp</Label><Input value={d.whatsapp} onChange={e=>setD({...d,whatsapp:e.target.value})}/></div>
        <div><Label>E-mail</Label><Input type="email" value={d.email} onChange={e=>setD({...d,email:e.target.value})}/></div>
        <div><Label>Faixa</Label><Input value={d.faixa} onChange={e=>setD({...d,faixa:e.target.value})}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Status</Label>
            <Select value={d.status} onValueChange={v=>setD({...d,status:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="Qualificado">Qualificado</SelectItem><SelectItem value="Não qualificado">Não qualificado</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Pipeline</Label>
            <Select value={d.pipeline} onValueChange={v=>setD({...d,pipeline:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="Novo">Novo</SelectItem><SelectItem value="Comunidade">Comunidade</SelectItem><SelectItem value="Agendamento">Agendamento</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Criar lead</Button></DialogFooter>
    </DialogContent>
  );
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
