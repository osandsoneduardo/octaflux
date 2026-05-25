import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Plus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { LeadRouter, LeadRouterConfig, LeadDestination } from "@/lib/schema-builder";

export const Route = createFileRoute("/app/lead-router")({
  component: LeadRouterPage,
});

function LeadRouterPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [defaultDestination, setDefaultDestination] = useState<LeadDestination>({
    type: "crm",
    config: {},
  });
  const [newRule, setNewRule] = useState({
    field: "status",
    operator: "equals",
    value: "",
    destinationType: "whatsapp",
  });

  const handleAddRule = () => {
    if (!newRule.field || !newRule.value) {
      toast.error("Preencha todos os campos da regra");
      return;
    }

    const rule = {
      id: `rule_${Date.now()}`,
      condition: {
        field: newRule.field,
        operator: newRule.operator as any,
        value: newRule.value,
      },
      destination: {
        type: newRule.destinationType,
        config: {},
      },
      priority: rules.length,
    };

    setRules([...rules, rule]);
    setNewRule({ field: "status", operator: "equals", value: "", destinationType: "whatsapp" });
    toast.success("Regra adicionada!");
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    toast.success("Regra removida!");
  };

  const handleSaveRouter = () => {
    if (rules.length === 0) {
      toast.error("Adicione pelo menos uma regra");
      return;
    }

    const config: LeadRouterConfig = {
      id: `router_${Date.now()}`,
      name: "Router Principal",
      rules,
      defaultDestination,
    };

    toast.success("Roteador de leads configurado com sucesso!");
    console.log("Router Config:", config);
  };

  const destinationTypes = [
    { value: "crm", label: "CRM Interno" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "E-mail" },
    { value: "webhook", label: "Webhook" },
    { value: "slack", label: "Slack" },
    { value: "telegram", label: "Telegram" },
    { value: "discord", label: "Discord" },
    { value: "notion", label: "Notion" },
    { value: "sheets", label: "Google Sheets" },
    { value: "api", label: "API Customizada" },
  ];

  const operators = [
    { value: "equals", label: "Igual a" },
    { value: "contains", label: "Contém" },
    { value: "greater_than", label: "Maior que" },
    { value: "less_than", label: "Menor que" },
    { value: "in", label: "Está em" },
  ];

  return (
    <Layout
      title="Universal Lead Router"
      subtitle="Roteie leads automaticamente para qualquer destino"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Default Destination */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Destino Padrão</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Tipo de Destino</Label>
              <Select
                value={defaultDestination.type}
                onValueChange={(value: any) =>
                  setDefaultDestination({ ...defaultDestination, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {destinationTypes.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Configuração</Label>
              <Input placeholder="URL, ID, ou configuração específica" />
            </div>
          </div>
        </Card>

        {/* Rules */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Regras de Roteamento</h2>

          {rules.length > 0 && (
            <div className="space-y-3 mb-6">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Se</span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
                        {rule.condition.field}
                      </span>
                      <span className="text-sm font-medium">{rule.condition.operator}</span>
                      <span className="px-2 py-1 rounded bg-muted text-sm font-medium">
                        {rule.condition.value}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      <span className="px-2 py-1 rounded bg-success/10 text-success text-sm font-medium">
                        {rule.destination.type}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRule(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Rule */}
          <div className="space-y-4 p-4 rounded-lg bg-card/50 border border-border/30">
            <h3 className="font-medium text-sm">Adicionar Nova Regra</h3>
            <div className="grid md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Campo</Label>
                <Input
                  placeholder="Ex: status"
                  value={newRule.field}
                  onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operador</Label>
                <Select value={newRule.operator} onValueChange={(value) => setNewRule({ ...newRule, operator: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input
                  placeholder="Ex: qualificado"
                  value={newRule.value}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Destino</Label>
                <Select
                  value={newRule.destinationType}
                  onValueChange={(value) => setNewRule({ ...newRule, destinationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationTypes.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddRule} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        {rules.length > 0 && (
          <Card className="p-8 border-border/50 bg-success/5 border-success/20">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-success mb-2">Roteador Configurado</h3>
                <p className="text-sm text-muted-foreground">
                  {rules.length} regra{rules.length !== 1 ? "s" : ""} ativa{rules.length !== 1 ? "s" : ""} + 1 destino padrão
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSaveRouter} size="lg" className="gap-2">
            <Zap className="h-4 w-4" />
            Salvar Roteador
          </Button>
        </div>
      </div>
    </Layout>
  );
}
