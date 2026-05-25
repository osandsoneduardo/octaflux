import { ReactNode } from "react";
import { AppSidebar, MobileNav } from "./AppSidebar";

export function Layout({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </header>
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background via-background to-card/20">{children}</main>
      </div>
    </div>
  );
}
