import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Flame, Snowflake, Sun, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { AIService } from "@/lib/ai-service";

export const Route = createFileRoute("/app/lead-scoring")({
  component: LeadScoring,
});

function LeadScoring() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [scoredLeads, setScoredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoringModel, setScoringModel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadLeads();
    loadScoringModel();
  }, [user]);

  const loadLeads = async () => {
    try {
      // Integração direta com o banco interno do Lovable (Supabase)
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Erro ao carregar leads do banco interno:", error);
      toast.error("Erro ao conectar com o banco de dados");
    }
  };

  const loadScoringModel = async () => {
    try {
      // Gerar modelo padrão se não existir
      const model = await AIService.generateLeadScoringModel("Negócio geral");
      setScoringModel(model);
    } catch (error) {
      toast.error("Erro ao carregar modelo de scoring");
    }
  };

  const handleScoreLeads = async () => {
    if (!scoringModel) {
      toast.error("Modelo de scoring não disponível");
      return;
    }

    setLoading(true);
    try {
      const scored = leads.map((lead) => ({
        ...lead,
        score: AIService.calculateLeadScore(lead, scoringModel),
      }));
      setScoredLeads(scored);
      toast.success(`${scored.length} leads avaliados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao calcular scores");
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case "hot":
        return <Flame className="h-5 w-5 text-red-500" />;
      case "warm":
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case "cold":
        return <Snowflake className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTemperatureLabel = (temp: string) => {
    switch (temp) {
      case "hot":
        return "Quente";
      case "warm":
        return "Morno";
      case "cold":
        return "Frio";
      default:
        return "Desconhecido";
    }
  };

  const stats = {
    hot: scoredLeads.filter((l) => l.score?.temperature === "hot").length,
    warm: scoredLeads.filter((l) => l.score?.temperature === "warm").length,
    cold: scoredLeads.filter((l) => l.score?.temperature === "cold").length,
  };

  return (
    <Layout
      title="Lead Scoring com IA"
      subtitle="Qualifique automaticamente seus leads"
      actions={
        <Button onClick={handleScoreLeads} disabled={loading || leads.length === 0} className="gap-2">
          <Zap className="h-4 w-4" />
          {loading ? "Calculando..." : "Calcular Scores"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        {scoredLeads.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Total Avaliado</p>
                  <p className="text-3xl font-bold mt-2">{scoredLeads.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary opacity-20" />
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Quentes 🔥</p>
                  <p className="text-3xl font-bold mt-2 text-red-500">{stats.hot}</p>
                </div>
                <Flame className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Mornos 🌞</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-500">{stats.warm}</p>
                </div>
                <Sun className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Frios ❄️</p>
                  <p className="text-3xl font-bold mt-2 text-blue-500">{stats.cold}</p>
                </div>
                <Snowflake className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </Card>
          </div>
        )}

        {/* Leads Table */}
        <Card className="p-6 border-border/50">
          <h2 className="font-semibold text-lg mb-4">Leads Avaliados</h2>

          {scoredLeads.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {leads.length === 0
                  ? "Você ainda não tem leads. Crie alguns para começar a avaliar."
                  : "Clique em 'Calcular Scores' para avaliar seus leads com IA."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 font-medium">Lead</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Score</th>
                    <th className="text-left py-3 px-4 font-medium">Temperatura</th>
                    <th className="text-left py-3 px-4 font-medium">Recomendação</th>
                  </tr>
                </thead>
                <tbody>
                  {scoredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{lead.nome || "Sem nome"}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{lead.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                lead.score?.totalScore >= 70
                                  ? "bg-red-500"
                                  : lead.score?.totalScore >= 40
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${Math.min(lead.score?.totalScore || 0, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-sm">{lead.score?.totalScore || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTemperatureIcon(lead.score?.temperature)}
                          <span className="font-medium text-sm">{getTemperatureLabel(lead.score?.temperature)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{lead.score?.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Model Info */}
        {scoringModel && (
          <Card className="p-6 border-border/50 bg-card/50">
            <h3 className="font-semibold mb-3">Modelo de Scoring Ativo</h3>
            <p className="text-sm text-muted-foreground mb-4">{scoringModel.name}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {scoringModel.criteria.slice(0, 4).map((criterion: any) => (
                <div key={criterion.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <span className="text-sm font-medium">{criterion.field}</span>
                  <span className="text-xs font-bold text-primary">{criterion.points} pts</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
