import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AIService } from "@/lib/ai-service";
import { AIFunnelRequest } from "@/lib/ai-schemas";

export const Route = createFileRoute("/app/ai-funnel-generator")({
  component: AIFunnelGenerator,
});

function AIFunnelGenerator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "generating" | "preview">("form");
  const [formData, setFormData] = useState<AIFunnelRequest>({
    businessType: "",
    targetAudience: "",
    mainGoal: "",
    productOrService: "",
    tone: "professional",
  });
  const [generatedFunnel, setGeneratedFunnel] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessType || !formData.targetAudience || !formData.mainGoal || !formData.productOrService) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setStep("generating");
    setLoading(true);

    try {
      const funnel = await AIService.generateFunnel(formData);
      setGeneratedFunnel(funnel);
      setStep("preview");
      toast.success("Funil gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar funil. Tente novamente.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFunnel = async () => {
    if (!generatedFunnel) return;
    toast.success("Funil salvo! Redirecionando...");
    setTimeout(() => navigate({ to: "/app/sites" }), 1500);
  };

  return (
    <Layout
      title="Gerador de Funis com IA"
      subtitle="Crie funis de vendas completos em segundos"
    >
      <div className="max-w-4xl mx-auto">
        {step === "form" && (
          <Card className="p-8 border-border/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Tipo de Negócio *</Label>
                  <Input
                    id="businessType"
                    placeholder="Ex: Consultoria de Marketing Digital"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-Alvo *</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Ex: Pequenos empresários de 25-45 anos"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainGoal">Objetivo Principal *</Label>
                <Input
                  id="mainGoal"
                  placeholder="Ex: Gerar leads qualificados para consultoria"
                  value={formData.mainGoal}
                  onChange={(e) => setFormData({ ...formData, mainGoal: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productOrService">Produto/Serviço *</Label>
                <Textarea
                  id="productOrService"
                  placeholder="Descreva seu produto ou serviço em detalhes"
                  value={formData.productOrService}
                  onChange={(e) => setFormData({ ...formData, productOrService: e.target.value })}
                  required
                  className="min-h-24"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tom da Comunicação</Label>
                  <Select value={formData.tone} onValueChange={(value: any) => setFormData({ ...formData, tone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento (Opcional)</Label>
                  <Input
                    id="budget"
                    placeholder="Ex: R$ 5.000 - R$ 10.000"
                    value={formData.budget || ""}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                <Zap className="h-4 w-4" />
                {loading ? "Gerando funil..." : "Gerar Funil com IA"}
              </Button>
            </form>
          </Card>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Gerando seu funil...</h2>
            <p className="text-muted-foreground mb-8">Isso pode levar alguns segundos</p>
            <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        )}

        {step === "preview" && generatedFunnel && (
          <div className="space-y-6">
            <Card className="p-8 border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{generatedFunnel.name}</h2>
                  <p className="text-muted-foreground mt-1">{generatedFunnel.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold">Landing Page</h3>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Headline</p>
                      <p className="font-medium">{generatedFunnel.landingPage.headline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Subheadline</p>
                      <p className="text-sm">{generatedFunnel.landingPage.subheadline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">CTA</p>
                      <p className="text-sm font-medium text-primary">{generatedFunnel.landingPage.cta}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Formulário</h3>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Título</p>
                      <p className="font-medium">{generatedFunnel.form.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Campos</p>
                      <p className="text-sm">{generatedFunnel.form.fields.length} campos estratégicos</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Mensagem de Sucesso</p>
                      <p className="text-sm">{generatedFunnel.form.successMessage}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Pipeline CRM</h3>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Nome</p>
                      <p className="font-medium">{generatedFunnel.crm.pipelineName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Estágios</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {generatedFunnel.crm.stages.map((stage: string) => (
                          <span key={stage} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {stage}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Automações</h3>
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Triggers</p>
                      <p className="text-sm">{generatedFunnel.automation.triggers.length} triggers configurados</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Ações</p>
                      <p className="text-sm">{generatedFunnel.automation.actions.length} ações automáticas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveFunnel} size="lg" className="flex-1">
                  Salvar e Continuar
                </Button>
                <Button onClick={() => setStep("form")} variant="outline" size="lg">
                  Gerar Novo
                </Button>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-warning/5 border-warning/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Próximos passos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seu funil foi gerado! Agora você pode customizá-lo no editor visual, configurar integrações e ativar automações.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
