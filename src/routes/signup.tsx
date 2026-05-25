import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { brand_name: brand || "Minha Empresa" }, emailRedirectTo: `${window.location.origin}/app/dashboard` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo à OCTAFLUX!");
    navigate({ to: "/app/dashboard" });
  };

  return <AuthShell title="Criar Workspace" subtitle="Inicie sua infraestrutura de vendas com IA.">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Nome do Workspace</Label><Input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Ex: Minha Agência" required/></div>
      <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
      <div className="space-y-2"><Label>Senha</Label><Input type="password" value={pass} onChange={e=>setPass(e.target.value)} minLength={6} required/></div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading?"Criando...":"Criar conta"}</Button>
      <p className="text-sm text-center text-muted-foreground">Já tem conta? <Link to="/login" className="text-primary font-medium">Entrar</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">OCTAFLUX</span>
        </Link>
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
