import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  user_id: string;
  brand_name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  background_color: string;
  accent_color: string;
  form_title: string;
  form_subtitle: string;
  thanks_qualified_title: string;
  thanks_qualified_text: string;
  thanks_unqualified_title: string;
  thanks_unqualified_text: string;
  cta_calendly_label: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, profile: null, loading: true, refreshProfile: async () => {} });

// Convert hex to oklch-friendly value (browsers accept hex via CSS color() functions; we use raw hex on CSS vars + style props)
function applyBranding(p: Profile) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", p.primary_color);
  root.style.setProperty("--brand-bg", p.background_color);
  root.style.setProperty("--brand-accent", p.accent_color);
  // Override design tokens so the whole app reflects the brand
  root.style.setProperty("--primary", p.primary_color);
  root.style.setProperty("--ring", p.primary_color);
  root.style.setProperty("--sidebar", p.background_color);
  root.style.setProperty("--sidebar-accent", p.primary_color);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    setProfile((data as Profile) || null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) applyBranding(profile);
  }, [profile]);

  return (
    <Ctx.Provider value={{ user, session, profile, loading, refreshProfile: () => user ? loadProfile(user.id) : Promise.resolve() }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
