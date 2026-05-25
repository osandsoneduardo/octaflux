import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) { toast.error("E-mail ou senha incorretos."); return; }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/app/dashboard" });
  };

  return <AuthShell title="Acessar OCTAFLUX" subtitle="Retorne ao seu workspace.">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
      <div className="space-y-2"><Label>Senha</Label><Input type="password" value={pass} onChange={e=>setPass(e.target.value)} required/></div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading?"Entrando...":"Entrar"}</Button>
      <div className="text-center">
        <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">Esqueci minha senha</Link>
      </div>
      <p className="text-sm text-center text-muted-foreground">Novo aqui? <Link to="/signup" className="text-primary font-medium">Criar conta</Link></p>
    </form>
  </AuthShell>;
}
