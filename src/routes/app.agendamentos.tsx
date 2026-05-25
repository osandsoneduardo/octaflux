import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Search, MessageCircle, ExternalLink, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsappUrl, fillTemplate } from "@/lib/qualification";

export const Route = createFileRoute("/app/agendamentos")({ component: AgendamentosPage });

type Lead = {
  id: string; nome: string | null; whatsapp: string | null; email: string | null;
  status: string; pipeline: string; scheduled_at: string | null; created_at: string;
};

function AgendamentosPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id,nome,whatsapp,email,status,pipeline,scheduled_at,created_at")
        .eq("user_id", user.id)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });
      setLeads((data as any) || []);
      setLoading(false);
    };
    load();
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setSettings(data));
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  const now = new Date();
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (!l.scheduled_at) return false;
      const d = new Date(l.scheduled_at);
      const matchesFilter =
        filter === "all" ? true : filter === "upcoming" ? d >= now : d < now;
      const m = search.toLowerCase();
      const matchesSearch = !m || (l.nome || "").toLowerCase().includes(m) || (l.email || "").toLowerCase().includes(m);
      return matchesFilter && matchesSearch;
    });
  }, [leads, filter, search]);

  const stats = useMemo(() => {
    const upcoming = leads.filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= now).length;
    const past = leads.filter((l) => l.scheduled_at && new Date(l.scheduled_at) < now).length;
    return { total: leads.length, upcoming, past };
  }, [leads]);

  const openWhatsapp = (lead: Lead) => {
    if (!settings || !lead.whatsapp) return;
    const tpl = settings.whatsapp_confirmation_message || settings.wa_msg_qualificado || "";
    const date = lead.scheduled_at ? new Date(lead.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    const msg = fillTemplate(tpl, { nome: lead.nome || "", calendly: settings.calendly_url || "", data: date, meet: settings.calendly_url || "", meet_line: "" });
    window.open(buildWhatsappUrl(lead.whatsapp, msg), "_blank");
  };

  const startEdit = (l: Lead) => {
    setEditing(l.id);
    if (l.scheduled_at) {
      const d = new Date(l.scheduled_at);
      const pad = (n: number) => String(n).padStart(2, "0");
      setEditValue(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setEditValue("");
    }
  };
  const saveEdit = async (id: string) => {
    const iso = editValue ? new Date(editValue).toISOString() : null;
    const { error } = await supabase.from("leads").update({ scheduled_at: iso }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, scheduled_at: iso } : l)));
    setEditing(null);
    toast.success("Agendamento atualizado!");
  };
  const cancelSchedule = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    const { error } = await supabase.from("leads").update({ scheduled_at: null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Agendamento cancelado.");
  };

  return (
    <Layout
      title="Agendamentos"
      subtitle="Reuniões marcadas pelos seus leads (preenchidas via Calendly ou manualmente)."
      actions={
        settings?.calendly_url ? (
          <Button asChild variant="outline">
            <a href={settings.calendly_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Abrir Calendly
            </a>
          </Button>
        ) : null
      }
    >
      {user?.id && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-semibold text-sm">Webhook do Calendly</div>
              <div className="text-xs text-muted-foreground mt-1">
                Cole esta URL em <span className="font-mono">Calendly → Integrations → Webhooks</span> (eventos: <em>invitee.created</em> e <em>invitee.canceled</em>) para receber agendamentos automaticamente aqui.
              </div>
              <code className="block mt-2 text-[11px] bg-background/60 border border-border rounded px-2 py-1.5 break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/public/calendly-webhook?u={user.id}
              </code>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/public/calendly-webhook?u=${user.id}`);
                toast.success("URL do webhook copiada!");
              }}
            >
              Copiar URL
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Calendar} label="Total" value={stats.total} color="text-foreground" />
        <StatCard icon={Clock} label="Próximos" value={stats.upcoming} color="text-primary" />
        <StatCard icon={CheckCircle2} label="Realizados" value={stats.past} color="text-success" />
      </div>


      <div className="bg-card rounded-xl border border-border p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-1">
            {(["upcoming", "past", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition ${filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f === "upcoming" ? "Próximos" : f === "past" ? "Realizados" : "Todos"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <div className="text-muted-foreground">Nenhum agendamento {filter === "upcoming" ? "futuro" : filter === "past" ? "passado" : ""}.</div>
            {settings?.calendly_url && (
              <div className="text-xs text-muted-foreground mt-2">Compartilhe seu link do Calendly com os leads para receber agendamentos.</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((l) => {
              const d = l.scheduled_at ? new Date(l.scheduled_at) : null;
              const past = d ? d < now : false;
              return (
                <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition">
                  <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${past ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"} shrink-0`}>
                    <div className="text-[10px] uppercase font-semibold">{d?.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</div>
                    <div className="text-xl font-bold leading-none">{d?.getDate()}</div>
                    <div className="text-[10px] mt-0.5">{d?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{l.nome || "—"}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {l.whatsapp && <span>📱 {l.whatsapp}</span>}
                      {l.email && <span className="truncate">✉️ {l.email}</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${l.status === "Qualificado" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{l.status}</span>
                    </div>
                    {editing === l.id && (
                      <div className="flex gap-2 mt-2">
                        <Input type="datetime-local" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-xs max-w-[220px]" />
                        <Button size="sm" className="h-8" onClick={() => saveEdit(l.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                  {editing !== l.id && (
                    <div className="flex gap-1">
                      {l.whatsapp && (
                        <button onClick={() => openWhatsapp(l)} className="p-2 rounded hover:bg-success/15 text-success" title="Confirmar via WhatsApp">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      <Button size="sm" variant="outline" className="h-8" onClick={() => startEdit(l)}>Reagendar</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => cancelSchedule(l.id)}>Cancelar</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${color}`} /></div>
      <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}
