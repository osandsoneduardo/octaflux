import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import type { Block, SiteTheme } from "@/lib/blocks";
import { supabase } from "@/integrations/supabase/client";
import type { FormField } from "@/lib/qualification";
import { safeExternalUrl } from "@/lib/url";

function Icon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (Icons as any)[name || "Sparkles"] || Icons.Sparkles;
  return <Cmp className={className} />;
}

export function BlockRenderer({ block, theme, ownerSlug }: { block: Block; theme: SiteTheme; ownerSlug?: string }) {
  const p = block.props || {};
  const accent = theme.primary_color;
  const text = theme.text_color;

  switch (block.block_type) {
    case "hero": {
      const bg = p.bg_image
        ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${p.bg_image}) center/cover`
        : (p.bg_gradient || accent);
      return (
        <section className="px-6 py-24 md:py-32 relative overflow-hidden" style={{ background: bg, color: text }}>
          <div className={`max-w-4xl mx-auto relative z-10 ${p.align === "left" ? "text-left" : p.align === "right" ? "text-right" : "text-center"}`}>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">{p.title}</h1>
            {p.subtitle && <p className="text-lg md:text-xl opacity-90 mb-8">{p.subtitle}</p>}
            {p.cta_label && (
              <a href={p.cta_link || "#"} className="inline-block px-8 py-3 rounded-full font-semibold transition hover:scale-105"
                style={{ background: text, color: theme.background_color }}>
                {p.cta_label}
              </a>
            )}
          </div>
        </section>
      );
    }

    case "text":
      return (
        <section className="px-6 py-12">
          <div className={`max-w-3xl mx-auto whitespace-pre-wrap leading-relaxed ${p.align === "center" ? "text-center" : p.align === "right" ? "text-right" : "text-left"}`} style={{ color: text }}>
            {p.content}
          </div>
        </section>
      );

    case "image":
      return (
        <section className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <img src={p.url} alt={p.alt || ""} className={`w-full ${p.rounded ? "rounded-2xl" : ""}`} />
          </div>
        </section>
      );

    case "button":
      return (
        <section className={`px-6 py-8 ${p.align === "left" ? "text-left" : p.align === "right" ? "text-right" : "text-center"}`}>
          <a href={p.link || "#"} className="inline-block px-8 py-3 rounded-full font-semibold transition hover:scale-105"
            style={p.style === "outline" ? { border: `2px solid ${accent}`, color: accent } : { background: accent, color: text }}>
            {p.label}
          </a>
        </section>
      );

    case "features":
      return (
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            {p.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: text }}>{p.title}</h2>}
            <div className="grid md:grid-cols-3 gap-6">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl" style={{ background: `${accent}15`, color: text }}>
                  <Icon name={it.icon} className="h-8 w-8 mb-3" />
                  <h3 className="font-bold text-lg mb-2">{it.title}</h3>
                  <p className="opacity-80 text-sm">{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            {p.title && <h2 className="text-3xl font-bold text-center mb-8" style={{ color: text }}>{p.title}</h2>}
            <div className="grid md:grid-cols-3 gap-4">
              {(p.images || []).map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            {p.title && <h2 className="text-3xl font-bold text-center mb-10" style={{ color: text }}>{p.title}</h2>}
            <div className="grid md:grid-cols-2 gap-6">
              {(p.items || []).map((it: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl" style={{ background: `${accent}15`, color: text }}>
                  <div className="flex items-center gap-3 mb-3">
                    {it.avatar_url && <img src={it.avatar_url} alt={it.name} className="h-12 w-12 rounded-full object-cover"/>}
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      {it.role && <div className="text-xs opacity-70">{it.role}</div>}
                    </div>
                  </div>
                  <p className="italic">"{it.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "vsl":
      return (
        <section className="px-6 py-16 text-center" style={{ color: text }}>
          <div className="max-w-3xl mx-auto">
            {p.headline && <h2 className="text-3xl md:text-4xl font-bold mb-3">{p.headline}</h2>}
            {p.subtext && <p className="opacity-80 mb-6">{p.subtext}</p>}
            <div className="aspect-video rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <iframe src={safeExternalUrl(p.url) || "about:blank"} className="w-full h-full" allowFullScreen loading="lazy" referrerPolicy="no-referrer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms" />
            </div>
            {p.cta_label && (
              <a href={p.cta_link || "#"} className="inline-block px-10 py-4 rounded-full font-bold text-lg transition hover:scale-105"
                style={{ background: accent, color: text }}>{p.cta_label}</a>
            )}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto">
            {p.title && <h2 className="text-3xl font-bold text-center mb-10" style={{ color: text }}>{p.title}</h2>}
            <div className="space-y-3">
              {(p.items || []).map((it: any, i: number) => (
                <details key={i} className="p-4 rounded-xl cursor-pointer" style={{ background: `${accent}12`, color: text }}>
                  <summary className="font-semibold">{it.q}</summary>
                  <p className="mt-2 opacity-80">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case "pricing":
      return (
        <section className="px-6 py-16" id="pricing">
          <div className="max-w-5xl mx-auto">
            {p.title && <h2 className="text-3xl font-bold text-center mb-10" style={{ color: text }}>{p.title}</h2>}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(p.plans || []).map((pl: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl flex flex-col"
                  style={pl.highlight ? { background: accent, color: text } : { background: `${accent}15`, color: text }}>
                  <h3 className="font-bold text-xl mb-2">{pl.name}</h3>
                  <div className="text-3xl font-bold mb-4">{pl.price}</div>
                  <ul className="space-y-2 mb-6 flex-1 text-sm opacity-90">
                    {(pl.features || []).map((f: string, j: number) => <li key={j}>✓ {f}</li>)}
                  </ul>
                  <button className="px-6 py-2 rounded-full font-semibold" style={{ background: text, color: theme.background_color }}>{pl.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "video":
      return (
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto aspect-video">
            <iframe src={safeExternalUrl(p.url) || "about:blank"} className="w-full h-full rounded-2xl" allowFullScreen loading="lazy" referrerPolicy="no-referrer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms" />
          </div>
        </section>
      );

    case "map":
      return (
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto aspect-video">
            <iframe src={safeExternalUrl(p.embed_url) || "about:blank"} className="w-full h-full rounded-2xl border-0" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
          </div>
        </section>
      );

    case "social":
      return (
        <section className="px-6 py-12 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {(p.items || []).map((it: any, i: number) => (
              <a key={i} href={it.url} target="_blank" rel="noreferrer"
                className="px-5 py-2 rounded-full font-medium transition hover:scale-105"
                style={{ background: accent, color: text }}>{it.network}</a>
            ))}
          </div>
        </section>
      );

    case "countdown":
      return <CountdownBlock title={p.title} target={p.target} accent={accent} text={text} />;

    case "form_embed":
      return <FormEmbedBlock title={p.title} subtitle={p.subtitle} ownerSlug={ownerSlug} accent={accent} text={text} bg={theme.background_color} />;

    case "ai_chat":
      return <AIChatBlock title={p.title} subtitle={p.subtitle} system={p.system} placeholder={p.placeholder} accent={accent} text={text} bg={theme.background_color} />;

    case "footer":
      return (
        <footer className="px-6 py-10 text-center text-sm opacity-70 border-t" style={{ color: text, borderColor: `${text}20` }}>
          {p.text}
        </footer>
      );

    default:
      return null;
  }
}

function CountdownBlock({ title, target, accent, text }: any) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <section className="px-6 py-16 text-center" style={{ color: text }}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="flex justify-center gap-3 flex-wrap">
        {[["Dias", d], ["Horas", h], ["Min", m], ["Seg", s]].map(([l, v]) => (
          <div key={l as string} className="px-5 py-4 rounded-xl min-w-[80px]" style={{ background: accent }}>
            <div className="text-3xl font-bold">{String(v).padStart(2, "0")}</div>
            <div className="text-xs opacity-90">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FormEmbedBlock({ title, subtitle, ownerSlug, accent, text, bg }: any) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!ownerSlug) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("user_id").eq("slug", ownerSlug).maybeSingle();
      if (!prof) return;
      const { data } = await supabase.from("form_fields").select("*").eq("user_id", prof.user_id).order("position");
      setFields((data as any) || []);
    })();
  }, [ownerSlug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerSlug) return;
    const { data: prof } = await supabase.from("profiles").select("user_id").eq("slug", ownerSlug).maybeSingle();
    if (!prof) return;
    await supabase.from("leads").insert({
      user_id: prof.user_id,
      nome: values.nome || null, email: values.email || null, whatsapp: values.whatsapp || null,
      custom_data: values, status: "Qualificado", pipeline: "Novo",
    });
    setSent(true);
  };

  if (!ownerSlug) return <section className="px-6 py-12 text-center" style={{ color: text }}>Formulário não disponível na pré-visualização.</section>;
  if (sent) return <section className="px-6 py-16 text-center" style={{ color: text }}><h3 className="text-2xl font-bold">Obrigado! Recebemos seus dados.</h3></section>;

  return (
    <section className="px-6 py-16" id="form">
      <div className="max-w-xl mx-auto p-8 rounded-2xl" style={{ background: `${accent}15`, color: text }}>
        {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
        {subtitle && <p className="opacity-80 mb-6">{subtitle}</p>}
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.id}>
              <label className="block text-sm mb-1 font-medium">{f.label}{f.required && " *"}</label>
              {f.field_type === "textarea" ? (
                <textarea required={f.required} value={values[f.field_key] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.field_key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg" style={{ background: bg, color: text, border: `1px solid ${text}30` }} rows={3} />
              ) : f.field_type === "select" || f.field_type === "qualification" ? (
                <select required={f.required} value={values[f.field_key] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.field_key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg" style={{ background: bg, color: text, border: `1px solid ${text}30` }}>
                  <option value="">Selecione</option>
                  {(f.options || []).map((o: any, i: number) => <option key={i} value={o.label}>{o.label}</option>)}
                </select>
              ) : (
                <input required={f.required} type={f.field_type === "email" ? "email" : f.field_type === "tel" ? "tel" : f.field_type === "number" ? "number" : "text"}
                  placeholder={f.placeholder || ""} value={values[f.field_key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.field_key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg" style={{ background: bg, color: text, border: `1px solid ${text}30` }} />
              )}
            </div>
          ))}
          <button type="submit" className="w-full py-3 rounded-lg font-semibold transition hover:scale-[1.02]" style={{ background: accent, color: text }}>Enviar</button>
        </form>
      </div>
    </section>
  );
}

function AIChatBlock({ title, subtitle, system, placeholder, accent, text, bg }: any) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: next, system },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.reply || "..." }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `⚠ ${e.message || "Erro ao responder"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-6 py-16">
      <div className="max-w-2xl mx-auto" style={{ color: text }}>
        {title && <h2 className="text-2xl md:text-3xl font-bold text-center mb-1">{title}</h2>}
        {subtitle && <p className="text-center opacity-70 mb-6">{subtitle}</p>}
        <div className="rounded-xl border p-4" style={{ background: bg, borderColor: `${text}25` }}>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-3">
            {messages.length === 0 && <p className="text-sm opacity-60 text-center py-8">Faça sua primeira pergunta abaixo 👇</p>}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap"
                  style={{ background: m.role === "user" ? accent : `${text}15`, color: m.role === "user" ? bg : text }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs opacity-60">Pensando...</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder || "Digite..."}
              className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: bg, color: text, border: `1px solid ${text}30` }} />
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{ background: accent, color: bg }}>Enviar</button>
          </form>
        </div>
      </div>
    </section>
  );
}
