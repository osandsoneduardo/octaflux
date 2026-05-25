import { createFileRoute } from "@tanstack/react-router";
import { SiteRenderer } from "./s.$siteSlug";

export const Route = createFileRoute("/s/$siteSlug/$pageSlug")({ component: PublicSitePage });

function PublicSitePage() {
  const { siteSlug, pageSlug } = Route.useParams();
  return <SiteRenderer siteSlug={siteSlug} pageSlug={pageSlug} />;
}
