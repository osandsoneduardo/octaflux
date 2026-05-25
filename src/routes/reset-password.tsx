import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash → session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres."); return; }
    if (pass !== confirm) { toast.error("Senhas não conferem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/app/crm" });
  };

  return (
    <AuthShell title="Nova senha" subtitle="Defina uma senha forte para continuar.">
      {!ready ? (
        <p className="text-center text-sm text-muted-foreground">Validando link...</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Nova senha</Label><Input type="password" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6}/></div>
          <div className="space-y-2"><Label>Confirmar senha</Label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading?"Salvando...":"Atualizar senha"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
