import * as Icons from "lucide-react";

export type BlockType =
  | "hero" | "text" | "image" | "button" | "features" | "gallery"
  | "testimonials" | "faq" | "pricing" | "video" | "vsl" | "map" | "social"
  | "countdown" | "form_embed" | "ai_chat" | "footer";

export type Block = {
  id: string;
  block_type: BlockType;
  props: Record<string, any>;
  position: number;
};

export type SiteTheme = {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  logo_url?: string | null;
};

export const BLOCK_CATALOG: { type: BlockType; label: string; icon: keyof typeof Icons; defaults: Record<string, any> }[] = [
  { type: "hero", label: "Hero", icon: "LayoutTemplate", defaults: { title: "Título principal", subtitle: "Subtítulo cativante", cta_label: "Começar", cta_link: "#", bg_gradient: "linear-gradient(135deg,#3B6D11,#0a0a0a)", align: "center" } },
  { type: "text", label: "Texto", icon: "Type", defaults: { content: "Escreva seu texto aqui.", align: "left" } },
  { type: "image", label: "Imagem", icon: "Image", defaults: { url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200", alt: "Imagem", rounded: true } },
  { type: "button", label: "Botão", icon: "MousePointerClick", defaults: { label: "Clique aqui", link: "#", align: "center", style: "solid" } },
  { type: "features", label: "Recursos", icon: "Sparkles", defaults: { title: "Recursos", items: [{ icon: "Zap", title: "Rápido", text: "Descrição" }, { icon: "Shield", title: "Seguro", text: "Descrição" }, { icon: "Heart", title: "Cuidado", text: "Descrição" }] } },
  { type: "gallery", label: "Galeria", icon: "Images", defaults: { title: "Galeria", images: ["https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800", "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800", "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800"] } },
  { type: "testimonials", label: "Depoimentos", icon: "Quote", defaults: { title: "O que dizem", items: [{ name: "Cliente", text: "Excelente!", role: "Cargo", avatar_url: "https://i.pravatar.cc/120?img=1" }] } },
  { type: "faq", label: "FAQ", icon: "HelpCircle", defaults: { title: "Dúvidas", items: [{ q: "Pergunta?", a: "Resposta." }] } },
  { type: "pricing", label: "Preços", icon: "DollarSign", defaults: { title: "Planos", plans: [{ name: "Básico", price: "R$ 49", features: ["Recurso 1", "Recurso 2"], cta: "Começar" }, { name: "Pro", price: "R$ 149", features: ["Tudo", "+ Suporte"], cta: "Assinar", highlight: true }] } },
  { type: "video", label: "Vídeo", icon: "Video", defaults: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ" } },
  { type: "vsl", label: "VSL (vídeo + CTA)", icon: "PlayCircle", defaults: { headline: "Assista antes de continuar", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", cta_label: "Quero saber mais", cta_link: "#form", subtext: "Vídeo curto explicando tudo" } },
  { type: "map", label: "Mapa", icon: "MapPin", defaults: { embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d-46.6333!2d-23.5505!4d-46.633!2m3!1f0!2f0!3f0" } },
  { type: "social", label: "Redes sociais", icon: "Share2", defaults: { items: [{ network: "Instagram", url: "https://instagram.com" }, { network: "WhatsApp", url: "https://wa.me/5511999999999" }] } },
  { type: "countdown", label: "Contagem regressiva", icon: "Timer", defaults: { title: "Oferta termina em:", target: new Date(Date.now() + 7 * 86400000).toISOString() } },
  { type: "form_embed", label: "Formulário", icon: "FileText", defaults: { title: "Fale com a gente", subtitle: "" } },
  { type: "ai_chat", label: "Chat IA", icon: "MessageSquare", defaults: { title: "Tire suas dúvidas", subtitle: "Nosso assistente responde na hora", placeholder: "Digite sua pergunta...", system: "Você é um atendente prestativo da empresa. Responda de forma curta, clara e em português." } },
  { type: "footer", label: "Rodapé", icon: "Minus", defaults: { text: "© 2026 Sua marca" } },
];
