import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOCK_CATALOG, type Block } from "@/lib/blocks";
import { BlockRenderer } from "@/components/site-builder/BlockRenderer";
import { SiteHeader } from "@/components/site-builder/SiteHeader";
import { ImageUpload } from "@/components/site-builder/ImageUpload";
import { ItemsEditor } from "@/components/site-builder/ItemsEditor";
import * as Icons from "lucide-react";
import { Plus, Trash2, GripVertical, ArrowLeft, ExternalLink, Upload, Monitor, Tablet, Smartphone, Layers, MoveDiagonal, ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FreeCanvas, type FreeBlock } from "@/components/site-builder/FreeCanvas";

export const Route = createFileRoute("/app/sites/$siteId")({ component: SiteEditor });

type Viewport = "desktop" | "tablet" | "mobile";
const VIEWPORT_W: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

function SiteEditor() {
  const { siteId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [site, setSite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const pushHistory = (snapshot: Block[]) => {
    setHistory((h) => [...h.slice(-49), snapshot]);
    setFuture([]);
  };

  const load = async () => {
    const { data: s } = await supabase.from("sites").select("*").eq("id", siteId).maybeSingle();
    if (!s) { navigate({ to: "/app/sites" }); return; }
    setSite(s);
    const { data: pg } = await supabase.from("pages").select("*").eq("site_id", siteId).order("position");
    setPages(pg || []);
    const home = (pg || []).find((p) => p.is_home) || (pg || [])[0];
    if (home) { setActivePageId(home.id); loadBlocks(home.id); }
  };

  const loadBlocks = async (pageId: string) => {
    const { data } = await supabase.from("blocks").select("*").eq("page_id", pageId).order("position");
    setBlocks((data as any) || []);
  };

  useEffect(() => { if (siteId) load(); }, [siteId]);

  const updateSite = async (patch: any) => {
    setSite({ ...site, ...patch });
    await supabase.from("sites").update(patch).eq("id", siteId);
  };

  const addBlock = async (type: string) => {
    if (!activePageId || !user) return;
    const def = BLOCK_CATALOG.find((b) => b.type === type)!;
    const activePg = pages.find((p) => p.id === activePageId);
    const free = !!activePg?.freeform;
    const insert: any = {
      page_id: activePageId, user_id: user.id, block_type: type,
      props: def.defaults, position: blocks.length,
    };
    if (free) {
      insert.x = 60 + (blocks.length % 6) * 20;
      insert.y = 60 + (blocks.length % 6) * 20;
      insert.w = 480; insert.h = 240;
      insert.z_index = blocks.length;
    }
    const { data } = await supabase.from("blocks").insert(insert).select().single();
    if (data) { setBlocks([...blocks, data as any]); setSelectedId(data.id); }
  };

  const updateBlock = async (id: string, patch: Partial<Block>) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBlocks(next);
    const b = next.find((x) => x.id === id)!;
    await supabase.from("blocks").update({ props: b.props }).eq("id", id);
  };

  // Local-only update (no DB) for smooth dragging
  const updateBlockLocal = (id: string, patch: Partial<FreeBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  // Persist geometry changes (called on pointer up)
  const commitBlockGeometry = async (id: string, patch: Partial<FreeBlock>) => {
    pushHistory(blocks);
    const dbPatch: any = {};
    if (patch.x !== undefined) dbPatch.x = patch.x;
    if (patch.y !== undefined) dbPatch.y = patch.y;
    if (patch.w !== undefined) dbPatch.w = patch.w;
    if (patch.h !== undefined) dbPatch.h = patch.h;
    if (patch.rotation !== undefined) dbPatch.rotation = patch.rotation;
    if (patch.z_index !== undefined) dbPatch.z_index = patch.z_index;
    if (Object.keys(dbPatch).length === 0) return;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    await supabase.from("blocks").update(dbPatch).eq("id", id);
  };

  const duplicateBlock = async (id: string) => {
    const src = blocks.find((b) => b.id === id);
    if (!src || !user || !activePageId) return;
    pushHistory(blocks);
    const { data } = await supabase.from("blocks").insert({
      page_id: activePageId, user_id: user.id, block_type: src.block_type,
      props: src.props, position: blocks.length,
      x: (src as any).x != null ? (src as any).x + 24 : null,
      y: (src as any).y != null ? (src as any).y + 24 : null,
      w: (src as any).w, h: (src as any).h,
      rotation: (src as any).rotation || 0,
      z_index: ((src as any).z_index || 0) + 1,
    }).select().single();
    if (data) { setBlocks([...blocks, data as any]); setSelectedId(data.id); }
  };

  const changeZ = async (id: string, dir: "front" | "back" | "fwd" | "bwd") => {
    const zs = blocks.map((b) => (b as any).z_index || 0);
    const max = Math.max(0, ...zs), min = Math.min(0, ...zs);
    const cur = (blocks.find((b) => b.id === id) as any)?.z_index || 0;
    const z = dir === "front" ? max + 1 : dir === "back" ? min - 1 : dir === "fwd" ? cur + 1 : cur - 1;
    await commitBlockGeometry(id, { z_index: z });
  };

  const undo = async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [...f, blocks]);
    setHistory((h) => h.slice(0, -1));
    setBlocks(prev);
    // Persist all geometry from snapshot
    await Promise.all(prev.map((b: any) =>
      supabase.from("blocks").update({ x: b.x, y: b.y, w: b.w, h: b.h, rotation: b.rotation, z_index: b.z_index, props: b.props, position: b.position }).eq("id", b.id)
    ));
  };
  const redo = async () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setHistory((h) => [...h, blocks]);
    setFuture((f) => f.slice(0, -1));
    setBlocks(next);
    await Promise.all(next.map((b: any) =>
      supabase.from("blocks").update({ x: b.x, y: b.y, w: b.w, h: b.h, rotation: b.rotation, z_index: b.z_index, props: b.props, position: b.position }).eq("id", b.id)
    ));
  };

  // Keyboard: ⌘Z / ⌘⇧Z for undo/redo (when not typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, future, blocks]);

  const removeBlock = async (id: string) => {
    pushHistory(blocks);
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    await supabase.from("blocks").delete().eq("id", id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIdx, newIdx).map((b, i) => ({ ...b, position: i }));
    setBlocks(next);
    await Promise.all(next.map((b, i) => supabase.from("blocks").update({ position: i }).eq("id", b.id)));
  };

  const addPage = async () => {
    if (!user) return;
    const title = prompt("Nome da página:"); if (!title) return;
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase.from("pages").insert({ site_id: siteId, user_id: user.id, title, slug, position: pages.length }).select().single();
    if (error) { toast.error(error.message); return; }
    setPages([...pages, data]); setActivePageId(data.id); loadBlocks(data.id);
  };

  const removePage = async (id: string) => {
    if (pages.length === 1) { toast.error("Mantenha pelo menos 1 página"); return; }
    if (!confirm("Apagar esta página?")) return;
    await supabase.from("pages").delete().eq("id", id);
    const next = pages.filter((p) => p.id !== id); setPages(next);
    if (activePageId === id && next[0]) { setActivePageId(next[0].id); loadBlocks(next[0].id); }
  };

  const setHome = async (id: string) => {
    await supabase.from("pages").update({ is_home: false }).eq("site_id", siteId);
    await supabase.from("pages").update({ is_home: true }).eq("id", id);
    load();
  };

  const uploadLogo = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/site-${siteId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    updateSite({ logo_url: data.publicUrl });
  };

  const selected = blocks.find((b) => b.id === selectedId);
  if (!site) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  const theme = {
    primary_color: site.primary_color, secondary_color: site.secondary_color,
    background_color: site.background_color, text_color: site.text_color,
    font_family: site.font_family, logo_url: site.logo_url,
  };

  const activePage = pages.find((p) => p.id === activePageId);
  const isFree = !!activePage?.freeform;

  const togglePageMode = async () => {
    if (!activePage) return;
    const next = !activePage.freeform;
    await supabase.from("pages").update({ freeform: next }).eq("id", activePage.id);
    setPages((ps) => ps.map((p) => (p.id === activePage.id ? { ...p, freeform: next } : p)));
    if (next) {
      // Initialize geometry for blocks that don't have it yet
      const updates = blocks.filter((b: any) => b.x == null).map((b: any, i) => ({
        id: b.id, x: 40, y: 40 + i * 220, w: 720, h: 200,
      }));
      await Promise.all(updates.map((u) => supabase.from("blocks").update({ x: u.x, y: u.y, w: u.w, h: u.h }).eq("id", u.id)));
      if (activePageId) loadBlocks(activePageId);
    }
  };

  const canvasW = viewport === "desktop" ? 1200 : viewport === "tablet" ? 768 : 390;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Link to="/app/sites"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <Input value={site.name} onChange={(e) => updateSite({ name: e.target.value })} className="max-w-xs font-semibold" />
        <div className="flex-1 flex justify-center items-center gap-1">
          <Button size="icon" variant={viewport === "desktop" ? "default" : "ghost"} onClick={() => setViewport("desktop")}><Monitor className="h-4 w-4" /></Button>
          <Button size="icon" variant={viewport === "tablet" ? "default" : "ghost"} onClick={() => setViewport("tablet")}><Tablet className="h-4 w-4" /></Button>
          <Button size="icon" variant={viewport === "mobile" ? "default" : "ghost"} onClick={() => setViewport("mobile")}><Smartphone className="h-4 w-4" /></Button>
          <span className="mx-2 h-5 w-px bg-border" />
          <Button size="icon" variant="ghost" onClick={undo} disabled={history.length === 0} title="Desfazer (⌘Z)"><Undo2 className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={redo} disabled={future.length === 0} title="Refazer (⌘⇧Z)"><Redo2 className="h-4 w-4" /></Button>
          {isFree && (
            <>
              <span className="mx-2 h-5 w-px bg-border" />
              <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))} title="Zoom -"><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} title="Zoom +"><ZoomIn className="h-4 w-4" /></Button>
            </>
          )}
          <span className="mx-2 h-5 w-px bg-border" />
          <Button size="sm" variant={isFree ? "default" : "outline"} onClick={togglePageMode} title="Alterna entre modo Pilha (vertical) e Canvas Livre (estilo Figma)">
            {isFree ? <><MoveDiagonal className="h-3 w-3 mr-1" />Canvas Livre</> : <><Layers className="h-3 w-3 mr-1" />Modo Pilha</>}
          </Button>
        </div>
        <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-2" />Ver site</Button></a>
        <Button size="sm" onClick={() => updateSite({ published: !site.published })}>
          {site.published ? "Despublicar" : "Publicar"}
        </Button>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
        <aside className="col-span-3 lg:col-span-2 border-r border-border bg-card overflow-y-auto p-3">
          <Tabs defaultValue="blocks">
            <TabsList className="w-full"><TabsTrigger value="blocks" className="flex-1">Blocos</TabsTrigger><TabsTrigger value="pages" className="flex-1">Páginas</TabsTrigger></TabsList>
            <TabsContent value="blocks" className="space-y-1 mt-3">
              {BLOCK_CATALOG.map((b) => {
                const Icon = (Icons as any)[b.icon] || Icons.Square;
                return (
                  <button key={b.type} onClick={() => addBlock(b.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted text-left transition">
                    <Icon className="h-4 w-4 text-muted-foreground" />{b.label}
                  </button>
                );
              })}
            </TabsContent>
            <TabsContent value="pages" className="space-y-1 mt-3">
              {pages.map((p) => (
                <div key={p.id} className={`flex items-center gap-1 rounded-md ${activePageId === p.id ? "bg-muted" : ""}`}>
                  <button onClick={() => { setActivePageId(p.id); loadBlocks(p.id); setSelectedId(null); }}
                    className="flex-1 px-3 py-2 text-sm text-left truncate">{p.title}{p.is_home && " ★"}</button>
                  {!p.is_home && <Button variant="ghost" size="icon" onClick={() => setHome(p.id)} title="Definir como home" className="h-7 w-7">★</Button>}
                  <Button variant="ghost" size="icon" onClick={() => removePage(p.id)} className="text-destructive h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={addPage}><Plus className="h-3 w-3 mr-1" />Nova página</Button>
            </TabsContent>
          </Tabs>
        </aside>

        <main className="col-span-6 lg:col-span-7 overflow-auto bg-muted/30 p-4">
          {isFree ? (
            <div className="mx-auto" style={{ width: canvasW * zoom, height: (activePage?.canvas_height || 1200) * zoom }}>
              <FreeCanvas
                blocks={blocks as FreeBlock[]}
                theme={theme}
                ownerSlug={profile?.slug}
                canvasWidth={canvasW}
                canvasHeight={activePage?.canvas_height || 1200}
                zoom={zoom}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={updateBlockLocal}
                onCommit={commitBlockGeometry}
                onDelete={removeBlock}
                onDuplicate={duplicateBlock}
                onZ={changeZ}
              />
            </div>
          ) : (
            <div
              className="mx-auto transition-all duration-300 shadow-2xl rounded-lg overflow-hidden"
              style={{ background: site.background_color, width: VIEWPORT_W[viewport], maxWidth: "100%", fontFamily: site.font_family }}
            >
              {site.show_header && (
                <SiteHeader site={site} pages={pages.map((p) => ({ slug: p.slug, title: p.title, is_home: p.is_home }))} currentPageSlug={activePage?.is_home ? undefined : activePage?.slug} theme={theme} />
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((b) => (
                    <SortableBlock key={b.id} block={b} theme={theme} ownerSlug={profile?.slug}
                      selected={selectedId === b.id} onSelect={() => setSelectedId(b.id)} onRemove={() => removeBlock(b.id)} />
                  ))}
                </SortableContext>
              </DndContext>
              {blocks.length === 0 && <div className="p-20 text-center text-muted-foreground">Adicione blocos pela barra lateral.</div>}
            </div>
          )}
        </main>

        <aside className="col-span-3 border-l border-border bg-card overflow-y-auto p-4">
          <Tabs defaultValue="block">
            <TabsList className="w-full"><TabsTrigger value="block" className="flex-1">Bloco</TabsTrigger><TabsTrigger value="theme" className="flex-1">Tema</TabsTrigger></TabsList>

            <TabsContent value="block" className="space-y-3 mt-4">
              {!selected ? <p className="text-sm text-muted-foreground">Selecione um bloco no canvas para editar.</p> : (
                <PropsEditor block={selected} onChange={(p) => updateBlock(selected.id, { props: { ...selected.props, ...p } })} />
              )}
            </TabsContent>

            <TabsContent value="theme" className="space-y-3 mt-4">
              <div><Label className="text-xs">Cor primária</Label><Input type="color" value={site.primary_color} onChange={(e) => updateSite({ primary_color: e.target.value })} /></div>
              <div><Label className="text-xs">Cor secundária</Label><Input type="color" value={site.secondary_color} onChange={(e) => updateSite({ secondary_color: e.target.value })} /></div>
              <div><Label className="text-xs">Fundo</Label><Input type="color" value={site.background_color} onChange={(e) => updateSite({ background_color: e.target.value })} /></div>
              <div><Label className="text-xs">Texto</Label><Input type="color" value={site.text_color} onChange={(e) => updateSite({ text_color: e.target.value })} /></div>
              <div><Label className="text-xs">Fonte</Label>
                <select value={site.font_family} onChange={(e) => updateSite({ font_family: e.target.value })} className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm">
                  {["Inter", "Poppins", "Montserrat", "Playfair Display", "Roboto", "Lora", "Space Grotesk"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2"><input id="hdr" type="checkbox" checked={site.show_header} onChange={(e) => updateSite({ show_header: e.target.checked })} /><Label htmlFor="hdr" className="text-xs">Mostrar header com menu</Label></div>
              {site.show_header && (
                <div><Label className="text-xs">Estilo do header</Label>
                  <select value={site.header_style} onChange={(e) => updateSite({ header_style: e.target.value })} className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm">
                    <option value="solid">Sólido</option>
                    <option value="transparent">Transparente</option>
                  </select>
                </div>
              )}
              <div>
                <Label className="text-xs">Logo</Label>
                {site.logo_url && <img src={site.logo_url} className="h-12 mt-1 mb-2 rounded" alt="" />}
                <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                  <div className="px-3 py-2 border border-dashed border-border rounded-md text-sm text-center hover:bg-muted"><Upload className="h-3 w-3 inline mr-1" />Enviar logo</div></label>
              </div>
              <div><Label className="text-xs">Slug do site</Label><Input value={site.slug} onChange={(e) => updateSite({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
              <div><Label className="text-xs">SEO Título</Label><Input value={site.seo_title || ""} onChange={(e) => updateSite({ seo_title: e.target.value })} /></div>
              <div><Label className="text-xs">SEO Descrição</Label><Textarea value={site.seo_description || ""} onChange={(e) => updateSite({ seo_description: e.target.value })} rows={2} /></div>
              <div className="pt-3 border-t border-border"><Label className="text-xs font-semibold uppercase tracking-wider opacity-60">Domínio próprio</Label></div>
              <div><Label className="text-xs">Domínio customizado</Label><Input value={site.custom_domain || ""} onChange={(e) => updateSite({ custom_domain: e.target.value.trim().toLowerCase() || null })} placeholder="meusite.com.br" /><p className="text-xs text-muted-foreground mt-1">Aponte o DNS A para 185.158.133.1.</p></div>
              <div className="pt-3 border-t border-border"><Label className="text-xs font-semibold uppercase tracking-wider opacity-60">Pixels & Tracking</Label></div>
              <div><Label className="text-xs">Facebook Pixel ID</Label><Input value={site.facebook_pixel_id || ""} onChange={(e) => updateSite({ facebook_pixel_id: e.target.value || null })} placeholder="123456789012345" /></div>
              <div><Label className="text-xs">Google Analytics (GA4)</Label><Input value={site.google_analytics_id || ""} onChange={(e) => updateSite({ google_analytics_id: e.target.value || null })} placeholder="G-XXXXXXXXXX" /></div>
              <div><Label className="text-xs">Google Tag Manager</Label><Input value={site.gtm_id || ""} onChange={(e) => updateSite({ gtm_id: e.target.value || null })} placeholder="GTM-XXXXXXX" /></div>
              <div><Label className="text-xs">HTML personalizado (head)</Label><Textarea value={site.custom_head || ""} onChange={(e) => updateSite({ custom_head: e.target.value })} rows={3} className="font-mono text-xs" placeholder="<script>...</script>" /></div>
              <div><Label className="text-xs">CSS personalizado</Label><Textarea value={site.custom_css || ""} onChange={(e) => updateSite({ custom_css: e.target.value })} rows={4} className="font-mono text-xs" /></div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function SortableBlock({ block, theme, ownerSlug, selected, onSelect, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} onClick={onSelect}
      className={`relative group cursor-pointer ${selected ? "ring-2 ring-primary ring-inset" : "hover:ring-1 hover:ring-primary/40 hover:ring-inset"}`}>
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1 transition">
        <button {...attributes} {...listeners} className="p-1.5 bg-background/90 rounded shadow"><GripVertical className="h-3 w-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 bg-background/90 rounded shadow text-destructive"><Trash2 className="h-3 w-3" /></button>
      </div>
      <BlockRenderer block={block} theme={theme} ownerSlug={ownerSlug} />
    </div>
  );
}

function PropsEditor({ block, onChange }: { block: Block; onChange: (p: any) => void }) {
  const p = block.props || {};
  const set = (k: string, v: any) => onChange({ [k]: v });

  // Per-block visual editor
  if (block.block_type === "image") {
    return (
      <div className="space-y-3">
        <ImageUpload value={p.url} onChange={(url) => set("url", url)} label="Imagem" />
        <div><Label className="text-xs">Texto alternativo</Label><Input value={p.alt || ""} onChange={(e) => set("alt", e.target.value)} /></div>
      </div>
    );
  }
  if (block.block_type === "features") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título da seção</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <ItemsEditor kind="feature" items={p.items || []} onChange={(items) => set("items", items)} />
      </div>
    );
  }
  if (block.block_type === "gallery") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <ItemsEditor kind="gallery" isStringList items={p.images || []} onChange={(images) => set("images", images)} />
      </div>
    );
  }
  if (block.block_type === "testimonials") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <ItemsEditor kind="testimonial" items={p.items || []} onChange={(items) => set("items", items)} />
      </div>
    );
  }
  if (block.block_type === "faq") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <ItemsEditor kind="faq" items={p.items || []} onChange={(items) => set("items", items)} />
      </div>
    );
  }
  if (block.block_type === "pricing") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <ItemsEditor kind="pricing" items={p.plans || []} onChange={(plans) => set("plans", plans)} />
      </div>
    );
  }
  if (block.block_type === "social") {
    return <ItemsEditor kind="social" items={p.items || []} onChange={(items) => set("items", items)} />;
  }
  if (block.block_type === "hero") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label className="text-xs">Subtítulo</Label><Textarea value={p.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} rows={3} /></div>
        <div><Label className="text-xs">Texto do botão</Label><Input value={p.cta_label || ""} onChange={(e) => set("cta_label", e.target.value)} /></div>
        <div><Label className="text-xs">Link do botão</Label><Input value={p.cta_link || ""} onChange={(e) => set("cta_link", e.target.value)} placeholder="#form ou https://..." /></div>
        <div><Label className="text-xs">Background (gradiente CSS)</Label><Input value={p.bg_gradient || ""} onChange={(e) => set("bg_gradient", e.target.value)} /></div>
        <ImageUpload value={p.bg_image} onChange={(url) => set("bg_image", url)} label="Imagem de fundo (opcional)" />
        <div><Label className="text-xs">Alinhamento</Label>
          <select value={p.align || "center"} onChange={(e) => set("align", e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm">
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
          </select>
        </div>
      </div>
    );
  }
  if (block.block_type === "text") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Conteúdo</Label><Textarea value={p.content || ""} onChange={(e) => set("content", e.target.value)} rows={6} /></div>
        <div><Label className="text-xs">Alinhamento</Label>
          <select value={p.align || "left"} onChange={(e) => set("align", e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm">
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
          </select>
        </div>
      </div>
    );
  }
  if (block.block_type === "button") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Texto</Label><Input value={p.label || ""} onChange={(e) => set("label", e.target.value)} /></div>
        <div><Label className="text-xs">Link</Label><Input value={p.link || ""} onChange={(e) => set("link", e.target.value)} /></div>
        <div><Label className="text-xs">Estilo</Label>
          <select value={p.style || "solid"} onChange={(e) => set("style", e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm">
            <option value="solid">Sólido</option><option value="outline">Contorno</option>
          </select>
        </div>
      </div>
    );
  }
  if (block.block_type === "video" || block.block_type === "map") {
    return <div><Label className="text-xs">URL embed</Label><Input value={p.url || p.embed_url || ""} onChange={(e) => set(block.block_type === "video" ? "url" : "embed_url", e.target.value)} /></div>;
  }
  if (block.block_type === "countdown") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label className="text-xs">Data alvo</Label><Input type="datetime-local" value={p.target ? p.target.slice(0, 16) : ""} onChange={(e) => set("target", new Date(e.target.value).toISOString())} /></div>
      </div>
    );
  }
  if (block.block_type === "form_embed") {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Título</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label className="text-xs">Subtítulo</Label><Input value={p.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} /></div>
        <p className="text-xs text-muted-foreground">Este bloco usa o formulário com agendamento configurado em <strong>Editor de Form</strong>.</p>
      </div>
    );
  }
  if (block.block_type === "footer") {
    return <div><Label className="text-xs">Texto</Label><Input value={p.text || ""} onChange={(e) => set("text", e.target.value)} /></div>;
  }
  return null;
}
