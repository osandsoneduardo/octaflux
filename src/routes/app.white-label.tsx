import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Palette, Globe, Copy, Check, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/app/white-label")({
  component: WhiteLabel,
});

function WhiteLabel() {
  const [config, setConfig] = useState({
    brandName: "OCTAFLUX",
    customDomain: "",
    primaryColor: "#5A8DEE",
    secondaryColor: "#1A1A1A",
    logoUrl: "",
    faviconUrl: "",
    removeOctafluxBranding: false,
  });

  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    toast.success("Configurações de White Label salvas!");
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(config.customDomain || "seu-dominio.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout
      title="White Label & Multi-Tenant"
      subtitle="Customize a plataforma com sua marca"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Branding */}
        <Card className="p-8 border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Branding</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome da Marca</Label>
              <Input
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                placeholder="Ex: Minha Agência"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer border border-border"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  placeholder="#5A8DEE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer border border-border"
                />
                <Input
                  value={config.secondaryColor}
                  onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                  placeholder="#1A1A1A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={config.faviconUrl}
                onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Remover Branding OCTAFLUX</Label>
              <div className="flex items-center gap-3 h-10">
                <input
                  type="checkbox"
                  checked={config.removeOctafluxBranding}
                  onChange={(e) => setConfig({ ...config, removeOctafluxBranding: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  {config.removeOctafluxBranding ? "Branding removido" : "Mostrar branding OCTAFLUX"}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="mt-6 gap-2">
            <Check className="h-4 w-4" />
            Salvar Branding
          </Button>
        </Card>

        {/* Custom Domain */}
        <Card className="p-8 border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Domínio Customizado</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seu Domínio</Label>
              <Input
                value={config.customDomain}
                onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                placeholder="seu-dominio.com"
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-sm font-medium mb-3">Registros DNS Necessários:</p>
              <div className="space-y-2 text-xs font-mono text-muted-foreground">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>CNAME: seu-dominio.com → octaflux.app</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDomain}
                    className="gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              Conectar Domínio
            </Button>
          </div>
        </Card>

        {/* Multi-Tenant Setup */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Subcontas (Multi-Tenant)</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Criar Subcontas para Clientes</p>
                  <p className="text-sm text-muted-foreground">
                    Permita que seus clientes tenham seus próprios workspaces com branding customizado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Email do Cliente</Label>
                <Input placeholder="cliente@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Nome da Subconta</Label>
                <Input placeholder="Agência do Cliente" />
              </div>
            </div>

            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Subconta
            </Button>
          </div>

          {/* Subaccounts List */}
          <div className="mt-6 space-y-2">
            <h3 className="font-medium text-sm">Subcontas Ativas</h3>
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma subconta criada ainda
            </div>
          </div>
        </Card>

        {/* API Integration */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Integração de API</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input type="password" value="sk_live_1234567890" readOnly />
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input placeholder="https://seu-servidor.com/webhook" />
            </div>

            <div className="space-y-2">
              <Label>Eventos para Monitorar</Label>
              <div className="space-y-2">
                {["lead.created", "lead.qualified", "form.submitted", "automation.executed"].map(
                  (event) => (
                    <div key={event} className="flex items-center gap-2">
                      <input type="checkbox" id={event} className="w-4 h-4" defaultChecked />
                      <label htmlFor={event} className="text-sm cursor-pointer">
                        {event}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            <Button onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              Salvar Integração
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function Plus({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}
