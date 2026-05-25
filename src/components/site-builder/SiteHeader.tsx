import type { SiteTheme } from "@/lib/blocks";

export function SiteHeader({
  site, pages, currentPageSlug, theme,
}: {
  site: any;
  pages: { slug: string; title: string; is_home: boolean }[];
  currentPageSlug?: string;
  theme: SiteTheme;
}) {
  if (!site.show_header) return null;
  const isTransparent = site.header_style === "transparent";
  const homePath = `/s/${site.slug}`;

  return (
    <header
      className={`sticky top-0 z-30 px-6 py-4 backdrop-blur-md border-b transition-colors`}
      style={{
        background: isTransparent ? `${theme.background_color}cc` : theme.background_color,
        color: theme.text_color,
        borderColor: `${theme.text_color}15`,
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        <a href={homePath} className="flex items-center gap-3 font-bold">
          {site.logo_url && <img src={site.logo_url} alt="" className="h-8 w-8 rounded object-cover" />}
          <span>{site.name}</span>
        </a>
        <nav className="flex items-center gap-1 flex-wrap">
          {pages.map((p) => {
            const path = p.is_home ? homePath : `${homePath}/${p.slug}`;
            const active = (p.is_home && !currentPageSlug) || currentPageSlug === p.slug;
            return (
              <a key={p.slug} href={path}
                className="px-3 py-1.5 text-sm rounded-md transition"
                style={active
                  ? { background: theme.primary_color, color: theme.text_color }
                  : { opacity: 0.8 }}>
                {p.title}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
