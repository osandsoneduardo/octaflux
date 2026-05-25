import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlockRenderer } from "@/components/site-builder/BlockRenderer";
import { SiteHeader } from "@/components/site-builder/SiteHeader";
import { AnimatedBlock } from "@/components/site-builder/AnimatedBlock";
import { PixelInjector } from "@/components/PixelInjector";
import type { Block } from "@/lib/blocks";

export const Route = createFileRoute("/s/$siteSlug")({ component: PublicSite });

function PublicSite() {
  const { siteSlug } = Route.useParams();
  return <SiteRenderer siteSlug={siteSlug} pageSlug={undefined} />;
}

export function SiteRenderer({ siteSlug, pageSlug }: { siteSlug: string; pageSlug?: string }) {
  const [site, setSite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [activePage, setActivePage] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [ownerSlug, setOwnerSlug] = useState<string | undefined>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const host = typeof window !== "undefined" ? window.location.hostname : null;
      let s: any = null;
      if (host) {
        const { data } = await supabase.from("sites").select("*").eq("custom_domain", host).maybeSingle();
        s = data;
      }
      if (!s) {
        const { data } = await supabase.from("sites").select("*").eq("slug", siteSlug).maybeSingle();
        s = data;
      }
      if (!s || !s.published) { setNotFound(true); return; }
      setSite(s);

      const [{ data: prof }, { data: pgs }] = await Promise.all([
        supabase.from("profiles").select("slug").eq("user_id", s.user_id).maybeSingle(),
        supabase.from("pages").select("*").eq("site_id", s.id).order("position"),
      ]);
      setOwnerSlug(prof?.slug);
      setPages(pgs || []);

      const target = pageSlug
        ? (pgs || []).find((p) => p.slug === pageSlug)
        : (pgs || []).find((p) => p.is_home) || (pgs || [])[0];
      if (!target) { setNotFound(true); return; }
      setActivePage(target);

      const { data: bs } = await supabase.from("blocks").select("*").eq("page_id", target.id).order("position");
      setBlocks((bs as any) || []);

      if (typeof document !== "undefined") {
        if (s.seo_title) document.title = s.seo_title;
        if (s.favicon_url) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
          link.href = s.favicon_url;
        }
      }
    })();
  }, [siteSlug, pageSlug]);

  if (notFound) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Página não encontrada.</div>;
  if (!site) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;

  const theme = {
    primary_color: site.primary_color, secondary_color: site.secondary_color,
    background_color: site.background_color, text_color: site.text_color,
    font_family: site.font_family, logo_url: site.logo_url,
  };

  const isFree = !!activePage?.freeform;

  return (
    <div style={{ background: site.background_color, color: site.text_color, fontFamily: site.font_family }} className="min-h-screen">
      <PixelInjector
        facebookPixelId={site.facebook_pixel_id}
        googleAnalyticsId={site.google_analytics_id}
        gtmId={site.gtm_id}
        customHead={site.custom_head}
      />
      {site.custom_css && <style>{site.custom_css}</style>}
      {site.show_header && (
        <SiteHeader site={site} pages={pages.map((p) => ({ slug: p.slug, title: p.title, is_home: p.is_home }))} currentPageSlug={pageSlug} theme={theme} />
      )}

      {isFree ? (
        <FreeformPage blocks={blocks} theme={theme} ownerSlug={ownerSlug} canvasHeight={activePage?.canvas_height || 1200} />
      ) : (
        blocks.map((b) => (
          <AnimatedBlock key={b.id}>
            <BlockRenderer block={b} theme={theme} ownerSlug={ownerSlug} />
          </AnimatedBlock>
        ))
      )}
    </div>
  );
}

function FreeformPage({ blocks, theme, ownerSlug, canvasHeight }: { blocks: any[]; theme: any; ownerSlug?: string; canvasHeight: number }) {
  // Responsive: scale canvas to fit viewport width (designed at 1200px)
  const designWidth = 1200;
  const sorted = [...blocks].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));
  return (
    <div className="w-full overflow-hidden">
      <div className="relative mx-auto" style={{ width: "100%", maxWidth: designWidth, aspectRatio: `${designWidth} / ${canvasHeight}` }}>
        <div
          className="absolute inset-0 origin-top-left"
          style={{ width: designWidth, height: canvasHeight, transform: "scale(var(--free-scale, 1))" }}
          ref={(el) => {
            if (!el) return;
            const update = () => {
              const w = el.parentElement?.clientWidth || designWidth;
              el.style.setProperty("--free-scale", String(Math.min(1, w / designWidth)));
            };
            update();
            window.addEventListener("resize", update);
          }}
        >
          {sorted.map((b) => (
            <div
              key={b.id}
              className="absolute"
              style={{
                left: b.x ?? 40, top: b.y ?? 40,
                width: b.w ?? 320, height: b.h ?? 200,
                transform: b.rotation ? `rotate(${b.rotation}deg)` : undefined,
                zIndex: b.z_index ?? 0,
                overflow: "hidden",
              }}
            >
              <BlockRenderer block={b} theme={theme} ownerSlug={ownerSlug} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
