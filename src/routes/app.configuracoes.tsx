import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Upload, Copy, ExternalLink, Loader2, Trash2, Code2 } from "lucide-react";
import { toast } from "sonner";
import { safeExternalUrl } from "@/lib/url";

export const Route = createFileRoute("/app/configuracoes")({ component: SettingsPage });

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [calendly, setCalendly] = useState("");
  const [waGroup, setWaGroup] = useState("");
  const [ctaQ, setCtaQ] = useState("");
  const [ctaNQ, setCtaNQ] = useState("");
  const [brand, setBrand] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primary, setPrimary] = useState("#3B6D11");
  const [bg, setBg] = useState("#0a0a0a");
  const [accent, setAccent] = useState("#86efac");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [tqT, setTqT] = useState("");
  const [tqText, setTqText] = useState("");
  const [tnqT, setTnqT] = useState("");
  const [tnqText, setTnqText] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBrand(profile.brand_name); setLogoUrl(profile.logo_url);
    setPrimary(profile.primary_color); setBg(profile.background_color); setAccent(profile.accent_color);
    setFormTitle(profile.form_title); setFormSubtitle(profile.form_subtitle);
    setTqT(profile.thanks_qualified_title); setTqText(profile.thanks_qualified_text);
    setTnqT(profile.thanks_unqualified_title); setTnqText(profile.thanks_unqualified_text);
    setCalendly((profile as any).calendly_url || "");
    setWaGroup((profile as any).whatsapp_group_url || (profile as any).community_url || "");
    setCtaQ((profile as any).cta_qualified_label || "Agendar minha reunião");
    setCtaNQ((profile as any).cta_unqualified_label || "Entrar na comunidade");
  }, [profile]);

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter até 2MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Envie um arquivo de imagem."); return; }

    // Garante sessão válida — sem isso o RLS do storage rejeita ("new row violates RLS")
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) { toast.error("Sessão expirada. Faça login novamente."); return; }

    setUploading(true);
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uid}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (error) {
      setUploading(false);
      toast.error("Erro no upload: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
    setLogoUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Logo enviada!");
    // limpa input para permitir re-upload do mesmo arquivo
    e.target.value = "";
  };

  const save = async () => {
    if (!user) return;

    // Normaliza/valida URLs antes de salvar
    const calendlyClean = calendly.trim() ? safeExternalUrl(calendly) : "";
    const waGroupClean = waGroup.trim() ? safeExternalUrl(waGroup) : "";
    if (calendly.trim() && !calendlyClean) {
      toast.error("Link do Calendly inválido. Use uma URL https:// completa.");
      return;
    }
    if (waGroup.trim() && !waGroupClean) {
      toast.error("Link do grupo do WhatsApp inválido. Use uma URL https:// completa.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      brand_name: brand, logo_url: logoUrl, primary_color: primary,
      background_color: bg, accent_color: accent, form_title: formTitle, form_subtitle: formSubtitle,
      thanks_qualified_title: tqT, thanks_qualified_text: tqText,
      thanks_unqualified_title: tnqT, thanks_unqualified_text: tnqText,
      calendly_url: calendlyClean,
      whatsapp_group_url: waGroupClean,
      community_url: waGroupClean,
      cta_qualified_label: ctaQ,
      cta_unqualified_label: ctaNQ,
    } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    await refreshProfile();
    toast.success("Tudo salvo!");
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = profile?.slug ? `${origin}/f/${profile.slug}` : "";
  const embedUrl = profile?.slug ? `${origin}/f/${profile.slug}?embed=1` : "";
  const embedCode = embedUrl ? `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border:0;border-radius:16px;"></iframe>` : "";

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado!"); };

  return (
    <Layout title="Configurações" subtitle="Personalize sua marca, formulário e fluxo do lead." actions={
      <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Salvando</> : <><Save className="h-4 w-4 mr-2"/>Salvar tudo</>}</Button>
    }>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Tabs defaultValue="brand" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="brand">Marca</TabsTrigger>
              <TabsTrigger value="form">Formulário</TabsTrigger>
              <TabsTrigger value="thanks">Telas finais</TabsTrigger>
              <TabsTrigger value="flow">Fluxo do Lead</TabsTrigger>
              <TabsTrigger value="embed">Compartilhar</TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="space-y-4 mt-4">
              <Section title="Identidade visual">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nome da marca</Label><Input value={brand} onChange={e=>setBrand(e.target.value)}/></div>
                  <div className="space-y-2">
                    <Label>Logo (PNG/JPG, até 2MB)</Label>
                    <div className="flex items-center gap-3">
                      {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-border"/>}
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm hover:bg-accent ${uploading?"opacity-50":""}`}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                        {uploading ? "Enviando..." : "Enviar imagem"}
                        <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} disabled={uploading}/>
                      </label>
                      {logoUrl && <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}><Trash2 className="h-3 w-3 mr-1"/>Remover</Button>}
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <ColorPicker label="Cor primária" value={primary} onChange={setPrimary}/>
                  <ColorPicker label="Cor de fundo" value={bg} onChange={setBg}/>
                  <ColorPicker label="Cor de acento" value={accent} onChange={setAccent}/>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="form" className="space-y-4 mt-4">
              <Section title="Cabeçalho do formulário público">
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Título</Label><Input value={formTitle} onChange={e=>setFormTitle(e.target.value)}/></div>
                  <div className="space-y-2"><Label>Subtítulo</Label><Input value={formSubtitle} onChange={e=>setFormSubtitle(e.target.value)}/></div>
                  <p className="text-xs text-muted-foreground">Edite as perguntas em <Link to="/app/formulario" className="text-primary underline">Editor de Form</Link>.</p>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="thanks" className="space-y-4 mt-4">
              <Section title="Tela final — Lead qualificado">
                <div className="space-y-3">
                  <div className="space-y-2"><Label>Título</Label><Input value={tqT} onChange={e=>setTqT(e.target.value)}/></div>
                  <div className="space-y-2"><Label>Texto</Label><Textarea rows={2} value={tqText} onChange={e=>setTqText(e.target.value)}/></div>
                  <div className="space-y-2"><Label>Texto do botão (vai para Calendly)</Label><Input value={ctaQ} onChange={e=>setCtaQ(e.target.value)}/></div>
                </div>
              </Section>
              <Section title="Tela final — Lead NÃO qualificado">
                <div className="space-y-3">
                  <div className="space-y-2"><Label>Título</Label><Input value={tnqT} onChange={e=>setTnqT(e.target.value)}/></div>
                  <div className="space-y-2"><Label>Texto</Label><Textarea rows={2} value={tnqText} onChange={e=>setTnqText(e.target.value)}/></div>
                  <div className="space-y-2"><Label>Texto do botão (vai para grupo do WhatsApp)</Label><Input value={ctaNQ} onChange={e=>setCtaNQ(e.target.value)}/></div>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4 mt-4">
              <Section title="🎯 Lead qualificado → Calendly">
                <div className="space-y-2">
                  <Label>Link do Calendly (agendamento)</Label>
                  <Input value={calendly} onChange={e=>setCalendly(e.target.value)} placeholder="https://calendly.com/seu-usuario/30min"/>
                  {calendly.trim() && !safeExternalUrl(calendly) && (
                    <p className="text-xs text-destructive">⚠ URL inválida. Cole o link completo começando com https://</p>
                  )}
                  <p className="text-xs text-muted-foreground">Ao terminar o formulário, leads qualificados clicam no botão e são redirecionados para este link.</p>
                </div>
              </Section>
              <Section title="💬 Lead NÃO qualificado → Grupo WhatsApp">
                <div className="space-y-2">
                  <Label>Link do grupo do WhatsApp</Label>
                  <Input value={waGroup} onChange={e=>setWaGroup(e.target.value)} placeholder="https://chat.whatsapp.com/AbCdEf123..."/>
                  {waGroup.trim() && !safeExternalUrl(waGroup) && (
                    <p className="text-xs text-destructive">⚠ URL inválida. Cole o link completo começando com https://</p>
                  )}
                  <p className="text-xs text-muted-foreground">Leads não qualificados serão direcionados para este grupo. Use o link de convite oficial do WhatsApp (https://chat.whatsapp.com/...).</p>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4 mt-4">
              <Section title="URL pública">
                {publicUrl && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input readOnly value={publicUrl}/>
                      <Button type="button" variant="outline" size="icon" onClick={()=>copy(publicUrl)}><Copy className="h-4 w-4"/></Button>
                      <Button type="button" variant="outline" size="icon" asChild><a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4"/></a></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Compartilhe este link com seus leads.</p>
                  </div>
                )}
              </Section>
              <Section title="Embed em qualquer site">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Code2 className="h-4 w-4"/>Cole este código no HTML do seu site</Label>
                  <Textarea rows={4} readOnly value={embedCode} className="font-mono text-xs"/>
                  <Button variant="outline" size="sm" onClick={()=>copy(embedCode)}><Copy className="h-3 w-3 mr-2"/>Copiar código</Button>
                  <p className="text-xs text-muted-foreground">O formulário aparecerá embutido com fundo transparente, ajustando-se ao seu site.</p>
                </div>
              </Section>
            </TabsContent>
          </Tabs>
        </div>

        {/* LIVE PREVIEW */}
        <div className="space-y-3 lg:sticky lg:top-6 self-start">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preview ao vivo</Label>
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ backgroundColor: bg }}>
            <div className="p-6 text-white text-center">
              {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover mx-auto mb-3"/>}
              <div className="font-bold text-lg">{formTitle || "Título do formulário"}</div>
              <div className="text-xs opacity-70 mt-1">{formSubtitle || "Subtítulo"}</div>
            </div>
            <div className="bg-card p-5 space-y-3">
              <div className="text-sm font-semibold">Pergunta exemplo</div>
              <Input placeholder="Resposta..." readOnly/>
              <button className="w-full py-2.5 rounded-md text-white font-medium text-sm" style={{ backgroundColor: primary }}>
                Próximo →
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
            Marca: <strong className="text-foreground">{brand || "—"}</strong> · Slug: <code>{profile?.slug}</code>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-14 rounded border border-input cursor-pointer"/>
        <Input value={value} onChange={e=>onChange(e.target.value)}/>
      </div>
    </div>
  );
}
