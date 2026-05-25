import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Users, KanbanSquare, Settings, Zap, LogOut, FileEdit, ExternalLink, Globe, LayoutDashboard, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/crm", label: "CRM / Leads", icon: Users },
  { to: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/app/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/app/sites", label: "Construtor de Sites", icon: Globe },
  { to: "/app/formulario", label: "Editor de Form", icon: FileEdit },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
        {profile?.logo_url ? (
          <img src={profile.logo_url} alt={profile.brand_name} className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <Zap className="h-5 w-5 text-sidebar-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold tracking-tight truncate text-sm">{profile?.brand_name || "OCTAFLUX"}</div>
          <div className="text-xs text-sidebar-foreground/50">Workspace</div>
        </div>
      </div>

      {profile?.slug && (
        <a
          href={`/f/${profile.slug}`}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent/20 hover:bg-sidebar-accent/30 text-xs text-sidebar-foreground/80 transition"
        >
          <span className="truncate">/f/{profile.slug}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button onClick={logout} className="m-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition">
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden flex overflow-x-auto bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to}
            className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap ${active ? "text-sidebar-foreground border-b-2 border-sidebar-accent" : "text-sidebar-foreground/60"}`}>
            <item.icon className="h-4 w-4" />{item.label}
          </Link>
        );
      })}
    </nav>
  );
}
