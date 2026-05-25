-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Meu site',
  slug TEXT NOT NULL UNIQUE,
  published BOOLEAN NOT NULL DEFAULT false,
  primary_color TEXT NOT NULL DEFAULT '#3B6D11',
  secondary_color TEXT NOT NULL DEFAULT '#86efac',
  background_color TEXT NOT NULL DEFAULT '#0a0a0a',
  text_color TEXT NOT NULL DEFAULT '#fafafa',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  favicon_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL DEFAULT 'home',
  title TEXT NOT NULL DEFAULT 'Início',
  is_home BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, slug)
);

CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  block_type TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'landing',
  thumbnail_url TEXT,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sites publicly viewable" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Owners insert sites" ON public.sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update sites" ON public.sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete sites" ON public.sites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Pages publicly viewable" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Owners insert pages" ON public.pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update pages" ON public.pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete pages" ON public.pages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Blocks publicly viewable" ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Owners insert blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update blocks" ON public.blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete blocks" ON public.blocks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Templates publicly viewable" ON public.site_templates FOR SELECT USING (true);

CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blocks_updated BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sites_user ON public.sites(user_id);
CREATE INDEX idx_pages_site ON public.pages(site_id);
CREATE INDEX idx_blocks_page ON public.blocks(page_id, position);

INSERT INTO public.site_templates (name, description, category, theme, pages) VALUES
('Landing de Serviços', 'Página de captação para prestadores de serviço', 'landing',
 '{"primary_color":"#3B6D11","secondary_color":"#86efac","background_color":"#0a0a0a","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Transforme seu negócio hoje","subtitle":"Soluções sob medida para você crescer","cta_label":"Quero saber mais","cta_link":"#form","bg_gradient":"linear-gradient(135deg,#3B6D11,#0a0a0a)","align":"center"}},
   {"type":"features","props":{"title":"Por que escolher a gente","items":[{"icon":"Zap","title":"Rápido","text":"Entrega em dias"},{"icon":"Shield","title":"Seguro","text":"Dados protegidos"},{"icon":"Heart","title":"Cuidadoso","text":"Atendimento humano"}]}},
   {"type":"testimonials","props":{"title":"O que dizem","items":[{"name":"Ana","text":"Mudou meu negócio!","role":"CEO"},{"name":"Bruno","text":"Recomendo demais","role":"Diretor"}]}},
   {"type":"form_embed","props":{"title":"Fale com a gente","subtitle":"Preencha e retornamos em breve"}},
   {"type":"footer","props":{"text":"© 2026 Sua Marca"}}
 ]}]'::jsonb),
('Portfólio Criativo', 'Mostre seus trabalhos com estilo', 'portfolio',
 '{"primary_color":"#a855f7","secondary_color":"#ec4899","background_color":"#0f0f1a","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Designer & Criativo","subtitle":"Construindo marcas memoráveis","cta_label":"Ver projetos","cta_link":"#gallery","bg_gradient":"linear-gradient(135deg,#a855f7,#ec4899)","align":"left"}},
   {"type":"gallery","props":{"title":"Projetos","images":["https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800","https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800","https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800"]}},
   {"type":"text","props":{"content":"Sou um designer apaixonado por contar histórias visuais.","align":"center"}},
   {"type":"form_embed","props":{"title":"Vamos trabalhar juntos","subtitle":""}},
   {"type":"footer","props":{"text":"© 2026"}}
 ]}]'::jsonb),
('SaaS / Produto Digital', 'Landing para produto SaaS', 'saas',
 '{"primary_color":"#0ea5e9","secondary_color":"#22d3ee","background_color":"#020617","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"O CRM que vende por você","subtitle":"Automatize leads e feche mais negócios","cta_label":"Teste grátis","cta_link":"#pricing","bg_gradient":"linear-gradient(135deg,#0ea5e9,#22d3ee)","align":"center"}},
   {"type":"features","props":{"title":"Recursos","items":[{"icon":"Bot","title":"IA","text":"Qualifica sozinho"},{"icon":"Calendar","title":"Agenda","text":"Integrada"},{"icon":"BarChart","title":"Métricas","text":"Em tempo real"}]}},
   {"type":"pricing","props":{"title":"Planos","plans":[{"name":"Starter","price":"R$ 49","features":["100 leads","1 usuário"],"cta":"Começar"},{"name":"Pro","price":"R$ 149","features":["Ilimitado","5 usuários","Suporte"],"cta":"Assinar","highlight":true}]}},
   {"type":"faq","props":{"title":"Dúvidas","items":[{"q":"Posso cancelar?","a":"Sim, a qualquer momento."},{"q":"Tem teste grátis?","a":"Sim, 14 dias."}]}},
   {"type":"footer","props":{"text":"© 2026 SaaS"}}
 ]}]'::jsonb);