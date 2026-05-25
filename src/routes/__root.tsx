import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import appCss from "../styles.css?url";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OCTAFLUX — AI Sales Operating System" },
      { name: "description", content: "Plataforma de aquisição, automação e conversão de clientes com IA. Funis, CRM, Automações e Tracking em um único ecossistema." },
      { property: "og:title", content: "OCTAFLUX — AI Sales Operating System" },
      { name: "twitter:title", content: "OCTAFLUX — AI Sales Operating System" },
      { property: "og:description", content: "Plataforma de aquisição, automação e conversão de clientes com IA. Funis, CRM, Automações e Tracking em um único ecossistema." },
      { name: "twitter:description", content: "Plataforma de aquisição, automação e conversão de clientes com IA. Funis, CRM, Automações e Tracking em um único ecossistema." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b72398fc-9457-47d1-aec9-13fb724a75f2/id-preview-ba088bb2--cb162ecc-13cc-40e0-95f6-cb6a3e488b7d.lovable.app-1777053516445.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b72398fc-9457-47d1-aec9-13fb724a75f2/id-preview-ba088bb2--cb162ecc-13cc-40e0-95f6-cb6a3e488b7d.lovable.app-1777053516445.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Página não encontrada</p>
        <a href="/" className="text-primary underline mt-4 inline-block">Voltar ao início</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
