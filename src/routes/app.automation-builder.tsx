import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Zap, Play, Save, Workflow, GitBranch, Clock, Mail, MessageCircle } from "lucide-react";
import { WORKFLOW_PRESETS } from "@/lib/automation-engine";

export const Route = createFileRoute("/app/automation-builder")({
  component: AutomationBuilder,
});

function AutomationBuilder() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [showPresets, setShowPresets] = useState(true);

  const handleCreateFromPreset = (preset: any) => {
    const workflow = preset();
    setWorkflows([...workflows, workflow]);
    setSelectedWorkflow(workflow);
    setShowPresets(false);
    toast.success("Workflow criado a partir do preset!");
  };

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return;
    toast.success("Workflow salvo com sucesso!");
  };

  const handleExecuteWorkflow = () => {
    if (!selectedWorkflow) return;
    toast.success("Workflow executado!");
  };

  const presets = [
    {
      name: "Qualificar e Rotear Lead",
      description: "Qualifica leads automaticamente e roteia para o destino correto",
      icon: GitBranch,
      preset: WORKFLOW_PRESETS.qualifyAndRoute,
    },
    {
      name: "Sequência de Email",
      description: "Envia uma sequência automática de emails com delays",
      icon: Mail,
      preset: WORKFLOW_PRESETS.emailSequence,
    },
  ];

  return (
    <Layout
      title="Construtor de Automações"
      subtitle="Crie workflows visuais como no n8n/Make"
      actions={
        selectedWorkflow && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExecuteWorkflow} className="gap-2">
              <Play className="h-4 w-4" />
              Testar
            </Button>
            <Button onClick={handleSaveWorkflow} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        )
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {showPresets && workflows.length === 0 ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Comece com um Preset</h2>
              <p className="text-muted-foreground">Escolha um template ou crie do zero</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <Card
                    key={preset.name}
                    className="p-6 border-border/50 hover:border-border/80 cursor-pointer transition-all group"
                    onClick={() => handleCreateFromPreset(preset.preset)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-2">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </Card>
                );
              })}

              <Card className="p-6 border-border/50 border-dashed hover:border-border/80 cursor-pointer transition-all group flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <p className="font-medium text-sm mb-1">Criar do Zero</p>
                  <p className="text-xs text-muted-foreground">Workflow customizado</p>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Workflow Canvas */}
            <Card className="p-8 border-border/50 min-h-96 bg-card/50">
              <div className="text-center text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-4">Construtor visual de workflows</p>
                <p className="text-sm">
                  Arraste nós, conecte-os e crie automações poderosas sem código
                </p>
              </div>

              {selectedWorkflow && (
                <div className="mt-8 space-y-4">
                  <h3 className="font-semibold text-lg">{selectedWorkflow.name}</h3>

                  {/* Nodes */}
                  <div className="space-y-2">
                    {selectedWorkflow.nodes.map((node: any, index: number) => (
                      <div key={node.id} className="flex items-center gap-3">
                        {index > 0 && (
                          <div className="w-0.5 h-6 bg-border/50 mx-4"></div>
                        )}
                        <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {node.type === "action" && <Zap className="h-4 w-4 text-primary" />}
                              {node.type === "condition" && <GitBranch className="h-4 w-4 text-primary" />}
                              {node.type === "delay" && <Clock className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{node.label}</p>
                              <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Node Editor */}
            {selectedWorkflow && (
              <Card className="p-6 border-border/50">
                <h3 className="font-semibold mb-4">Configurar Nó</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Nó</Label>
                    <Input placeholder="Ex: Enviar Email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Ação</Label>
                    <div className="grid md:grid-cols-3 gap-2">
                      {[
                        { icon: Zap, label: "Ação" },
                        { icon: GitBranch, label: "Condição" },
                        { icon: Clock, label: "Delay" },
                        { icon: Mail, label: "Email" },
                        { icon: MessageCircle, label: "WhatsApp" },
                        { icon: Workflow, label: "Webhook" },
                      ].map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="outline"
                            className="gap-2 justify-start"
                          >
                            <Icon className="h-4 w-4" />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Workflows List */}
            {workflows.length > 0 && (
              <Card className="p-6 border-border/50">
                <h3 className="font-semibold mb-4">Meus Workflows</h3>
                <div className="space-y-2">
                  {workflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedWorkflow(wf)}
                    >
                      <div className="flex items-center gap-3">
                        <Workflow className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{wf.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {wf.nodes.length} nós • {wf.edges.length} conexões
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
