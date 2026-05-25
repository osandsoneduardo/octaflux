import { ReactNode } from "react";

export function DashboardHeader({ 
  title, 
  subtitle, 
  actions,
  icon: Icon 
}: { 
  title: string; 
  subtitle?: string; 
  actions?: ReactNode;
  icon?: React.ComponentType<{ className: string }>;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          </div>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
