import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Plus, Trash2, Shield, Eye, Edit2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/app/team-management")({
  component: TeamManagement,
});

function TeamManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ email: "", role: "member" });

  const handleAddMember = () => {
    if (!newMember.email) {
      toast.error("Preencha o email");
      return;
    }

    const member = {
      id: `member_${Date.now()}`,
      email: newMember.email,
      role: newMember.role,
      joinedAt: new Date(),
      status: "pending",
    };

    setMembers([...members, member]);
    setNewMember({ email: "", role: "member" });
    toast.success("Convite enviado!");
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    toast.success("Membro removido!");
  };

  const handleChangeRole = (id: string, newRole: string) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    toast.success("Permissões atualizadas!");
  };

  const roles = [
    {
      value: "owner",
      label: "Proprietário",
      description: "Acesso total ao workspace",
      icon: Shield,
      color: "text-red-500",
    },
    {
      value: "admin",
      label: "Administrador",
      description: "Gerenciar usuários e configurações",
      icon: Shield,
      color: "text-orange-500",
    },
    {
      value: "member",
      label: "Membro",
      description: "Acessar e editar dados",
      icon: Users,
      color: "text-blue-500",
    },
    {
      value: "viewer",
      label: "Visualizador",
      description: "Apenas visualizar dados",
      icon: Eye,
      color: "text-gray-500",
    },
  ];

  return (
    <Layout
      title="Gestão de Times"
      subtitle="Gerencie membros e permissões do workspace"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Add Member */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Adicionar Novo Membro</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddMember} className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar
              </Button>
            </div>
          </div>
        </Card>

        {/* Members List */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Membros do Workspace</h2>

          {members.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum membro adicionado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const role = roles.find((r) => r.value === member.role);
                const RoleIcon = role?.icon || Users;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <RoleIcon className={`h-5 w-5 ${role?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Adicionado em {new Date(member.joinedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Select value={member.role} onValueChange={(value) => handleChangeRole(member.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Roles Reference */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Referência de Funções</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.value} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className={`h-5 w-5 ${role.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="font-semibold text-sm">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>

                  <ul className="text-xs text-muted-foreground space-y-1 ml-8">
                    {role.value === "owner" && (
                      <>
                        <li>✓ Gerenciar membros</li>
                        <li>✓ Configurar workspace</li>
                        <li>✓ Acessar billing</li>
                        <li>✓ Deletar workspace</li>
                      </>
                    )}
                    {role.value === "admin" && (
                      <>
                        <li>✓ Gerenciar membros</li>
                        <li>✓ Configurar workspace</li>
                        <li>✓ Criar e editar funis</li>
                        <li>✗ Acessar billing</li>
                      </>
                    )}
                    {role.value === "member" && (
                      <>
                        <li>✓ Criar e editar funis</li>
                        <li>✓ Gerenciar leads</li>
                        <li>✓ Ver relatórios</li>
                        <li>✗ Gerenciar membros</li>
                      </>
                    )}
                    {role.value === "viewer" && (
                      <>
                        <li>✓ Visualizar funis</li>
                        <li>✓ Visualizar leads</li>
                        <li>✓ Ver relatórios</li>
                        <li>✗ Editar dados</li>
                      </>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Audit Log */}
        <Card className="p-8 border-border/50">
          <h2 className="text-xl font-semibold mb-6">Log de Auditoria</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Você criou o workspace</p>
            <p>• Você adicionou João Silva como Admin</p>
            <p>• Você alterou permissões de Maria Santos</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
