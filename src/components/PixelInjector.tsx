import { useEffect } from "react";

type Props = {
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
  gtmId?: string | null;
  customHead?: string | null;
};

// Injects tracking pixels into <head> on the client.
// SSR-safe: no-op during hydration.
export function PixelInjector({ facebookPixelId, googleAnalyticsId, gtmId, customHead }: Props) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cleanup: (() => void)[] = [];

    if (facebookPixelId) {
      const id = `fbpx-${facebookPixelId}`;
      if (!document.getElementById(id)) {
        const s = document.createElement("script");
        s.id = id;
        s.innerHTML = `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${facebookPixelId}'); fbq('track', 'PageView');
        `;
        document.head.appendChild(s);
        cleanup.push(() => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      }
    }

    if (googleAnalyticsId) {
      const id = `ga-${googleAnalyticsId}`;
      if (!document.getElementById(id)) {
        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
        document.head.appendChild(s1);
        const s2 = document.createElement("script");
        s2.id = id;
        s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${googleAnalyticsId}');`;
        document.head.appendChild(s2);
        cleanup.push(() => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      }
    }

    if (gtmId) {
      const id = `gtm-${gtmId}`;
      if (!document.getElementById(id)) {
        const s = document.createElement("script");
        s.id = id;
        s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
        document.head.appendChild(s);
        cleanup.push(() => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      }
    }

    if (customHead) {
      const id = "custom-head-injected";
      if (!document.getElementById(id)) {
        const c = document.createElement("div");
        c.id = id;
        c.style.display = "none";
        c.innerHTML = customHead;
        
        const scripts = c.querySelectorAll("script");
        scripts.forEach((old) => {
          const s = document.createElement("script");
          for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value);
          s.text = old.text;
          document.head.appendChild(s);
        });
        
        const others = c.querySelectorAll("meta, link, style");
        others.forEach((node) => document.head.appendChild(node.cloneNode(true)));
        
        cleanup.push(() => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      }
    }

    return () => cleanup.forEach((fn) => fn());
  }, [facebookPixelId, googleAnalyticsId, gtmId, customHead]);

  return null;
}
