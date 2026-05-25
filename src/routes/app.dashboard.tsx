import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, CalendarCheck, Globe, TrendingUp, ExternalLink, KanbanSquare, FileEdit, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ leads: 0, qualified: 0, scheduled: 0, sites: 0, leadsMonth: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const [l, q, s, sites, lm, rec] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "Qualificado"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("scheduled_at", "is", null),
        supabase.from("sites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()),
        supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        leads: l.count || 0, qualified: q.count || 0, scheduled: s.count || 0,
        sites: sites.count || 0, leadsMonth: lm.count || 0,
      });
      setRecent(rec.data || []);
    })();
  }, [user]);

  const cards = [
    { label: "Leads totais", value: stats.leads, icon: Users, color: "text-primary", trend: "+12%" },
    { label: "Leads este mês", value: stats.leadsMonth, icon: TrendingUp, color: "text-success", trend: "+8%" },
    { label: "Qualificados", value: stats.qualified, icon: TrendingUp, color: "text-success", trend: "+5%" },
    { label: "Agendamentos", value: stats.scheduled, icon: CalendarCheck, color: "text-primary", trend: "+3%" },
    { label: "Sites criados", value: stats.sites, icon: Globe, color: "text-primary", trend: "+2%" },
  ];

  return (
    <Layout title={`Bem-vindo, ${profile?.brand_name || "usuário"}!`} subtitle="Visão geral do seu workspace">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="group bg-card border border-border/50 rounded-xl p-6 hover:border-border/80 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{c.label}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span>{c.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">Leads Recentes</h2>
              <p className="text-xs text-muted-foreground mt-1">Últimos leads capturados</p>
            </div>
            <Link to="/app/crm"><Button variant="outline" size="sm">Ver todos</Button></Link>
          </div>
          
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum lead capturado ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Seus leads aparecerão aqui quando começarem a chegar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{l.nome || "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{l.whatsapp || l.email || "—"}</div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ml-4 ${
                    l.status === "Qualificado" 
                      ? "bg-success/15 text-success" 
                      : l.status === "Novo"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-6">Ações Rápidas</h2>
          <div className="space-y-3">
            {profile?.slug && (
              <a 
                href={`/f/${profile.slug}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border/80 transition-all group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ExternalLink className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Ver Formulário</div>
                  <div className="text-xs text-muted-foreground truncate">/f/{profile.slug}</div>
                </div>
              </a>
            )}
            <Link 
              to="/app/sites" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border/80 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Novo Site</div>
                <div className="text-xs text-muted-foreground">Templates prontos</div>
              </div>
            </Link>
            <Link 
              to="/app/formulario" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border/80 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileEdit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Editar Form</div>
                <div className="text-xs text-muted-foreground">Perguntas + IA</div>
              </div>
            </Link>
            <Link 
              to="/app/pipeline" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border/80 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <KanbanSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Pipeline</div>
                <div className="text-xs text-muted-foreground">Kanban visual</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
