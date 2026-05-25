import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Workflow, BarChart3, Brain, Rocket, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/app/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">OCTAFLUX</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login"><Button variant="ghost" className="text-sm">Acessar</Button></Link>
            <Link to="/signup"><Button className="text-sm">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-card/50 mb-8">
              <span className="text-xs font-semibold text-primary">✨ AI-First Operating System</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              Infraestrutura de Vendas<br/>
              <span className="text-primary">Potenciada por IA</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Funis, CRM, Automações, Tracking e Análises em um único ecossistema. Gerencie leads, converta clientes e escale seu negócio com inteligência artificial.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/signup">
                <Button size="lg" className="text-base gap-2">
                  Criar Workspace Grátis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base">
                  Já tenho acesso
                </Button>
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                "Funis Ilimitados",
                "CRM Completo",
                "Automações IA",
                "Tracking Avançado",
              ].map((feature) => (
                <div key={feature} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-card/50 border border-border/40">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20 border-t border-border/40">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Tudo que você precisa para dominar vendas
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma enterprise-grade, desenhada para agências, consultores e empresas que querem crescer rápido.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Workflow,
                title: "Funis Inteligentes",
                desc: "Crie funis de vendas, webinars, quizzes e aplicações com IA. Qualifique leads automaticamente.",
              },
              {
                icon: Brain,
                title: "IA Nativa",
                desc: "Gere landing pages, formulários, automações e sequências de vendas com uma simples descrição.",
              },
              {
                icon: BarChart3,
                title: "Analytics Profundo",
                desc: "Rastreie cada passo do cliente. Atribua conversões. Otimize funis com dados reais.",
              },
              {
                icon: Zap,
                title: "Automações Sem Limites",
                desc: "Conecte WhatsApp, Email, Webhooks, APIs. Roteie leads para qualquer lugar automaticamente.",
              },
              {
                icon: Rocket,
                title: "Multi-Tenant & White Label",
                desc: "Crie subcontas para clientes. Customize domínios, cores e branding completamente.",
              },
              {
                icon: Check,
                title: "CRM Poderoso",
                desc: "Pipelines visuais, lead scoring, notas, atividades e histórico completo de cada cliente.",
              },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-border/40">
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/50 to-card/30 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para revolucionar suas vendas?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a agências e empresas que já estão usando OCTAFLUX para crescer exponencialmente.
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-base gap-2">
                Criar Workspace Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© 2026 OCTAFLUX. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
