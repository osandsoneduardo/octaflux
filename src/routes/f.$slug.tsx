import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { evaluateQualification, type FormField } from "@/lib/qualification";
import { safeExternalUrl } from "@/lib/url";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Sparkles, CalendarCheck, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/f/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({
    embed: s.embed === "1" || s.embed === "true" ? true : false,
  }),
  loader: async ({ params }) => {
    const { data: profileRows } = await supabase.rpc("get_public_profile_by_slug", { _slug: params.slug });
    const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;
    if (!profile) throw notFound();
    const { data: fields } = await supabase
      .from("form_fields").select("*").eq("user_id", profile.user_id).order("position");
    return { profile, fields: (fields as any) as FormField[] };
  },
  component: PublicForm,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center"><h1 className="text-4xl font-bold">Formulário não encontrado</h1><p className="text-muted-foreground mt-2">Verifique o link.</p></div>
    </div>
  ),
});

function PublicForm() {
  const { profile, fields } = Route.useLoaderData();
  const { embed } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isQualifiedFinal, setIsQualifiedFinal] = useState<boolean>(true);
  // Tela de boas-vindas: se ativada, começa no welcome
  const [showWelcome, setShowWelcome] = useState<boolean>(!!profile.welcome_enabled);

  const radius = typeof profile.form_border_radius === "number" ? profile.form_border_radius : 12;
  const submitLabel = profile.form_submit_label || "Enviar";

  const styleVars = {
    "--brand-primary": profile.primary_color,
    "--brand-bg": profile.background_color,
    "--brand-accent": profile.accent_color,
    "--form-radius": `${radius}px`,
  } as React.CSSProperties;

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", profile.primary_color);
  }, [profile]);

  // Filtra campos visíveis com base em `show_if`
  const visibleFields = useMemo(() => {
    return fields.filter((f: any) => {
      const cond = f.show_if;
      if (!cond || !cond.field) return true;
      return (answers[cond.field] || "") === (cond.equals || "");
    });
  }, [fields, answers]);

  const totalQuestions = visibleFields.length;
  const current = visibleFields[step];

  // Garante step válido se a visibilidade mudar (resposta anterior alterada)
  useEffect(() => {
    if (step > Math.max(0, totalQuestions - 1)) setStep(Math.max(0, totalQuestions - 1));
  }, [totalQuestions, step]);

  const validateField = (field: any, value: string): string | null => {
    if (field.required && !value.trim()) return "Responda para avançar.";
    if (!value) return null;
    if (field.field_type === "email") {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
      if (!ok) return "Digite um e-mail válido (ex: nome@dominio.com).";
    }
    if (field.field_type === "tel" || field.field_key === "whatsapp") {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) return "Digite um WhatsApp válido com DDD.";
    }
    return null;
  };

  const submit = async () => {
    if (submitting || done) return; // previne duplo envio
    setSubmitting(true);
    const { qualified, faixa } = evaluateQualification(fields, answers);
    const status = qualified ? "Qualificado" : "Não qualificado";
    const pipeline = qualified ? "Agendamento" : "Comunidade";

    const { error } = await supabase.from("leads").insert({
      user_id: profile.user_id,
      nome: (answers.nome || "").trim() || null,
      whatsapp: (answers.whatsapp || "").trim() || null,
      email: (answers.email || "").trim().toLowerCase() || null,
      faixa_investimento: faixa || null,
      status,
      pipeline,
      custom_data: answers,
    });

    if (error) {
      console.error("Lead insert error:", error);
      setSubmitting(false);
      toast.error("Não conseguimos enviar agora. Tente novamente em instantes.");
      return;
    }
    setIsQualifiedFinal(qualified);
    setDone(true);
    setSubmitting(false);
  };

  const next = () => {
    if (current) {
      const value = answers[current.field_key] || "";
      const err = validateField(current, value);
      if (err) { toast.error(err); return; }
    }
    if (step < totalQuestions - 1) setStep(step + 1);
    else submit();
  };

  // Tela de boas-vindas
  if (showWelcome && !done) {
    return <Shell embed={embed} profile={profile} styleVars={styleVars}>
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">{profile.welcome_title || "Bem-vindo(a)!"}</h2>
        <p className="text-muted-foreground mb-6 whitespace-pre-line">{profile.welcome_text || ""}</p>
        <Button
          onClick={() => setShowWelcome(false)}
          className="w-full"
          style={{ backgroundColor: profile.primary_color, borderRadius: radius }}
        >
          {profile.welcome_cta_label || "Começar"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Shell>;
  }

  if (totalQuestions === 0) {
    return <Shell embed={embed} profile={profile} styleVars={styleVars}>
      <div className="text-center"><p className="text-muted-foreground">Este formulário ainda não tem perguntas.</p></div>
    </Shell>;
  }


  if (done) {
    const qualifiedUrl = safeExternalUrl(profile.calendly_url);
    const unqualifiedUrl = safeExternalUrl(profile.whatsapp_group_url || profile.community_url);
    const ctaUrl = isQualifiedFinal ? qualifiedUrl : unqualifiedUrl;
    const ctaLabel = isQualifiedFinal
      ? (profile.cta_qualified_label || "Agendar minha reunião")
      : (profile.cta_unqualified_label || "Entrar na comunidade");
    const ctaTarget = embed ? "_top" : "_blank";
    const Icon = isQualifiedFinal ? CalendarCheck : MessageCircle;

    return <Shell embed={embed} profile={profile} styleVars={styleVars}>
      <div className="text-center py-6">
        <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${profile.primary_color}22` }}>
          {isQualifiedFinal ? <CalendarCheck className="h-8 w-8" style={{ color: profile.primary_color }} /> : <Sparkles className="h-8 w-8" style={{ color: profile.primary_color }} />}
        </div>
        <h2 className="text-2xl font-bold">
          {isQualifiedFinal ? (profile.thanks_qualified_title || "Parabéns!") : (profile.thanks_unqualified_title || "Bem-vindo à comunidade!")}
        </h2>
        <p className="text-muted-foreground mt-2">
          {isQualifiedFinal ? (profile.thanks_qualified_text || "Agende sua reunião com nosso time.") : (profile.thanks_unqualified_text || "Em breve entraremos em contato pelo WhatsApp.")}
        </p>

        {ctaUrl ? (
          <a
            href={ctaUrl}
            target={ctaTarget}
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center w-full rounded-md px-4 py-2.5 text-white font-medium text-sm transition hover:opacity-90"
            style={{ backgroundColor: profile.primary_color }}
          >
            <Icon className="h-4 w-4 mr-2" />
            {ctaLabel}
          </a>
        ) : (
          <p className="mt-6 text-sm text-amber-500">
            ⚠ O administrador ainda não configurou o link de {isQualifiedFinal ? "agendamento (Calendly)" : "grupo do WhatsApp"}.
          </p>
        )}
      </div>
    </Shell>;
  }

  return (
    <Shell embed={embed} profile={profile} styleVars={styleVars}>
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Pergunta {step + 1} de {totalQuestions}</span>
          <span>{Math.round(((step + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${((step + 1) / totalQuestions) * 100}%`, backgroundColor: profile.primary_color }} />
        </div>
      </div>

      {current && (
        <div className="space-y-3">
          <Label className="text-base">{current.label}{current.required && " *"}</Label>
          {current.field_type === "textarea" ? (
            <Textarea
              value={answers[current.field_key] || ""}
              placeholder={current.placeholder || ""}
              onChange={(e) => setAnswers({ ...answers, [current.field_key]: e.target.value })}
              style={{ borderRadius: radius }}
            />
          ) : current.field_type === "select" || current.field_type === "qualification" ? (
            <div className="space-y-2">
              {(current.options || []).map((opt: { label: string; qualified?: boolean }) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [current.field_key]: opt.label })}
                  className={`w-full text-left p-4 border-2 transition ${answers[current.field_key] === opt.label ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  style={{
                    borderRadius: radius,
                    ...(answers[current.field_key] === opt.label ? { borderColor: profile.primary_color, backgroundColor: `${profile.primary_color}15` } : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <Input
              type={current.field_type}
              value={answers[current.field_key] || ""}
              placeholder={current.placeholder || ""}
              onChange={(e) => setAnswers({ ...answers, [current.field_key]: e.target.value })}
              style={{ borderRadius: radius }}
            />
          )}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ borderRadius: radius }}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button onClick={next} disabled={submitting} style={{ backgroundColor: profile.primary_color, borderRadius: radius }}>
          {step === totalQuestions - 1 ? (submitting ? "Enviando..." : submitLabel) : "Avançar"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ profile, styleVars, embed, children }: { profile: any; styleVars: React.CSSProperties; embed: boolean; children: React.ReactNode }) {
  if (embed) {
    return (
      <div className="p-6 bg-transparent" style={styleVars}>
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold mb-1" style={{ color: profile.primary_color }}>{profile.form_title || "Vamos conversar"}</h1>
          <p className="text-sm text-muted-foreground mb-5">{profile.form_subtitle || ""}</p>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ ...styleVars, backgroundColor: profile.background_color, color: "#fafafa" }}>
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border p-6 md:p-8 shadow-2xl">
        {profile.logo_url && <img src={profile.logo_url} alt={profile.brand_name} className="h-12 mx-auto mb-4 object-contain" />}
        <h1 className="text-2xl font-bold text-center" style={{ color: profile.primary_color }}>{profile.form_title || "Vamos conversar"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-6">{profile.form_subtitle || ""}</p>
        {children}
      </div>
    </div>
  );
}
