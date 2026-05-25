import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ExternalLink, Trash2, Edit3, Copy, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/sites")({ component: SitesList });

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "site";
}

function SitesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sites, setSites] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("site_templates").select("*").order("name"),
    ]);
    setSites(s || []); setTemplates(t || []);
  };
  useEffect(() => { load(); }, [user]);

  if (location.pathname.startsWith("/app/sites/")) return <Outlet />;

  const createBlank = async () => {
    if (!user || !name.trim()) return;
    let slug = slugify(name); let counter = 0;
    while ((await supabase.from("sites").select("id").eq("slug", slug).maybeSingle()).data) { counter++; slug = `${slugify(name)}-${counter}`; }
    const { data: site, error } = await supabase.from("sites").insert({ user_id: user.id, name, slug }).select().single();
    if (error) { toast.error(error.message); return; }
    const { data: page } = await supabase.from("pages").insert({ site_id: site.id, user_id: user.id, slug: "home", title: "Início", is_home: true }).select().single();
    await supabase.from("blocks").insert([
      { page_id: page!.id, user_id: user.id, block_type: "hero", position: 0, props: { title: name, subtitle: "Bem-vindo ao seu novo site", cta_label: "Saiba mais", cta_link: "#", bg_gradient: "linear-gradient(135deg,#3B6D11,#0a0a0a)", align: "center" } },
      { page_id: page!.id, user_id: user.id, block_type: "footer", position: 1, props: { text: `© 2026 ${name}` } },
    ]);
    setOpen(false); setName("");
    navigate({ to: "/app/sites/$siteId", params: { siteId: site.id } });
  };

  const cloneTemplate = async (tpl: any) => {
    if (!user) return;
    const baseName = tpl.name; let slug = slugify(baseName); let counter = 0;
    while ((await supabase.from("sites").select("id").eq("slug", slug).maybeSingle()).data) { counter++; slug = `${slugify(baseName)}-${counter}`; }
    const theme = tpl.theme || {};
    const { data: site, error } = await supabase.from("sites").insert({
      user_id: user.id, name: baseName, slug,
      primary_color: theme.primary_color || "#3B6D11",
      secondary_color: theme.secondary_color || "#86efac",
      background_color: theme.background_color || "#0a0a0a",
      text_color: theme.text_color || "#fafafa",
      font_family: theme.font_family || "Inter",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    for (const pg of tpl.pages || []) {
      const { data: page } = await supabase.from("pages").insert({
        site_id: site.id, user_id: user.id, slug: pg.slug, title: pg.title, is_home: !!pg.is_home,
      }).select().single();
      if (page && pg.blocks?.length) {
        await supabase.from("blocks").insert(pg.blocks.map((b: any, i: number) => ({
          page_id: page.id, user_id: user.id, block_type: b.type, props: b.props || {}, position: i,
        })));
      }
    }
    toast.success("Template clonado!");
    navigate({ to: "/app/sites/$siteId", params: { siteId: site.id } });
  };

  const removeSite = async (id: string) => {
    if (!confirm("Apagar este site?")) return;
    await supabase.from("sites").delete().eq("id", id); load();
  };

  const togglePublish = async (s: any) => {
    await supabase.from("sites").update({ published: !s.published }).eq("id", s.id); load();
  };

  const generateWithAI = async () => {
    if (!user || !aiBrief.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-site-generator", { body: { brief: aiBrief } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const siteName = data.title || aiBrief.slice(0, 40);
      let slug = slugify(siteName); let counter = 0;
      while ((await supabase.from("sites").select("id").eq("slug", slug).maybeSingle()).data) { counter++; slug = `${slugify(siteName)}-${counter}`; }
      const { data: site, error: e1 } = await supabase.from("sites").insert({ user_id: user.id, name: siteName, slug }).select().single();
      if (e1) throw e1;
      const { data: page, error: e2 } = await supabase.from("pages").insert({ site_id: site.id, user_id: user.id, slug: "home", title: "Início", is_home: true }).select().single();
      if (e2) throw e2;
      const blocks = (data.blocks || []).map((b: any, i: number) => ({
        page_id: page!.id, user_id: user.id, block_type: b.type, props: b.props || {}, position: i,
      }));
      if (blocks.length) await supabase.from("blocks").insert(blocks);
      toast.success("Site gerado com IA!");
      setAiOpen(false); setAiBrief("");
      navigate({ to: "/app/sites/$siteId", params: { siteId: site.id } });
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar site");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Layout title="Meus Sites" subtitle="Crie do zero, clone um template ou gere com IA" actions={
      <div className="flex gap-2">
        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
          <DialogTrigger asChild><Button variant="outline"><Sparkles className="h-4 w-4 mr-2" />Gerar com IA</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Gerar site com IA</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Descreva seu negócio e o objetivo do site</Label>
              <Textarea rows={5} value={aiBrief} onChange={(e) => setAiBrief(e.target.value)}
                placeholder="Ex: Sou personal trainer, quero atrair alunos para consultoria online de emagrecimento..." />
              <Button onClick={generateWithAI} disabled={aiLoading || !aiBrief.trim()} className="w-full">
                {aiLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" />Gerar agora</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo site</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar site em branco</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>Nome do site</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha empresa" />
              <Button onClick={createBlank} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    }>
      <div className="space-y-10">
        <div>
          <h2 className="text-lg font-semibold mb-4">Templates prontos</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-5">
                <div className="h-32 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${t.theme?.primary_color || "#3B6D11"}, ${t.theme?.background_color || "#0a0a0a"})` }} />
                <div className="font-semibold">{t.name}</div>
                <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                <Button size="sm" variant="outline" onClick={() => cloneTemplate(t)} className="w-full"><Copy className="h-3 w-3 mr-2" />Clonar e editar</Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Seus sites</h2>
          {sites.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
              Nenhum site ainda. Crie um novo ou clone um template acima.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="h-24 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${s.primary_color}, ${s.background_color})` }} />
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold truncate">{s.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${s.published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {s.published ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">/s/{s.slug}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Link to="/app/sites/$siteId" params={{ siteId: s.id }} className="flex-1 min-w-[100px]">
                      <Button size="sm" variant="outline" className="w-full"><Edit3 className="h-3 w-3 mr-1" />Editar</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(s)}>{s.published ? "Despublicar" : "Publicar"}</Button>
                    <a href={`/s/${s.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>
                    <Button size="sm" variant="ghost" onClick={() => removeSite(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
