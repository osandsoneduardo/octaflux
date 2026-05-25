import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Verifique seu e-mail!");
  };

  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Se existir uma conta com <strong>{email}</strong>, você receberá um e-mail em instantes.</p>
          <Link to="/login" className="text-primary text-sm font-medium">Voltar ao login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading?"Enviando...":"Enviar link"}</Button>
          <p className="text-sm text-center text-muted-foreground"><Link to="/login" className="text-primary font-medium">Voltar ao login</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
