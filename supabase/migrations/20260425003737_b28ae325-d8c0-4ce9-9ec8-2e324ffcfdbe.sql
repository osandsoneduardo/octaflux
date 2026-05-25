-- Funnels
CREATE TABLE public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Meu funil',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funnels publicly viewable" ON public.funnels FOR SELECT USING (true);
CREATE POLICY "Owners insert funnels" ON public.funnels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update funnels" ON public.funnels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete funnels" ON public.funnels FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER funnels_updated BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Funnel steps
CREATE TABLE public.funnel_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'page',
  name TEXT NOT NULL DEFAULT 'Etapa',
  position INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  site_id UUID,
  page_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funnel steps publicly viewable" ON public.funnel_steps FOR SELECT USING (true);
CREATE POLICY "Owners insert steps" ON public.funnel_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update steps" ON public.funnel_steps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete steps" ON public.funnel_steps FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER funnel_steps_updated BEFORE UPDATE ON public.funnel_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles: comunidade
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_url TEXT DEFAULT 'https://chat.whatsapp.com/seu-grupo',
  ADD COLUMN IF NOT EXISTS community_message TEXT DEFAULT 'Entre na nossa comunidade no WhatsApp para receber conteúdos exclusivos!';

-- Sites: header
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS show_header BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_style TEXT NOT NULL DEFAULT 'solid';

-- Mais templates
INSERT INTO public.site_templates (name, description, category, theme, pages) VALUES
('Lançamento de Produto', 'Página de lançamento com contagem regressiva, benefícios e formulário', 'launch',
 '{"primary_color":"#dc2626","secondary_color":"#fbbf24","background_color":"#0a0a0a","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"O lançamento que vai mudar o seu jogo","subtitle":"Entre na lista de espera e seja o primeiro a saber.","cta_text":"Quero entrar na lista","align":"center"}},
   {"type":"countdown","props":{"title":"Contagem regressiva para o lançamento","days":7}},
   {"type":"features","props":{"title":"O que você vai receber","items":[{"title":"Acesso antecipado","desc":"Entre antes de todo mundo"},{"title":"Bônus exclusivos","desc":"Material extra só para a lista"},{"title":"Preço especial","desc":"Desconto de lançamento"}]}},
   {"type":"testimonials","props":{"title":"O que dizem nossos clientes","items":[{"name":"Ana","text":"Mudou minha vida!","role":"Cliente"},{"name":"João","text":"Resultado real.","role":"Empresário"}]}},
   {"type":"form_embed","props":{"title":"Garanta sua vaga"}},
   {"type":"footer","props":{"text":"© 2026 Todos os direitos reservados"}}
 ]}]'::jsonb),
('Infoproduto / Curso Online', 'Página de venda de curso com módulos, depoimentos e oferta', 'course',
 '{"primary_color":"#7c3aed","secondary_color":"#a78bfa","background_color":"#0f0f1a","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Aprenda do zero ao avançado","subtitle":"O curso completo que vai te transformar em especialista","cta_text":"Quero me inscrever","align":"center"}},
   {"type":"features","props":{"title":"Módulos do curso","items":[{"title":"Módulo 1 — Fundamentos","desc":"Base sólida para começar"},{"title":"Módulo 2 — Prática","desc":"Exercícios e cases reais"},{"title":"Módulo 3 — Avançado","desc":"Técnicas profissionais"},{"title":"Módulo 4 — Mercado","desc":"Como se posicionar"}]}},
   {"type":"testimonials","props":{"title":"Alunos aprovam","items":[{"name":"Marina","text":"Conteúdo excepcional!","role":"Aluna"},{"name":"Pedro","text":"Vale cada centavo.","role":"Aluno"}]}},
   {"type":"pricing","props":{"title":"Planos","items":[{"name":"Básico","price":"R$ 297","features":["Acesso por 6 meses","Comunidade","Suporte"]},{"name":"Premium","price":"R$ 497","features":["Acesso vitalício","Mentoria em grupo","Bônus exclusivos"],"highlight":true}]}},
   {"type":"faq","props":{"title":"Perguntas frequentes","items":[{"q":"Por quanto tempo tenho acesso?","a":"Depende do plano escolhido."},{"q":"Tem garantia?","a":"Sim, 7 dias de garantia incondicional."}]}},
   {"type":"form_embed","props":{"title":"Inscreva-se agora"}},
   {"type":"footer","props":{"text":"© 2026"}}
 ]}]'::jsonb),
('Agência Digital', 'Site institucional para agência com serviços e portfólio', 'agency',
 '{"primary_color":"#0ea5e9","secondary_color":"#38bdf8","background_color":"#020617","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Sua marca no próximo nível","subtitle":"Estratégia, design e tecnologia para empresas que querem crescer","cta_text":"Solicitar proposta","align":"left"}},
   {"type":"features","props":{"title":"Nossos serviços","items":[{"title":"Branding","desc":"Identidade visual completa"},{"title":"Web Design","desc":"Sites que convertem"},{"title":"Performance","desc":"Tráfego pago e SEO"},{"title":"Conteúdo","desc":"Social media e copywriting"}]}},
   {"type":"gallery","props":{"title":"Portfólio","images":[]}},
   {"type":"testimonials","props":{"title":"Clientes que confiaram","items":[{"name":"Empresa X","text":"Profissionalismo nota 10","role":"CEO"}]}},
   {"type":"form_embed","props":{"title":"Vamos conversar"}},
   {"type":"footer","props":{"text":"© 2026 Agência"}}
 ]}]'::jsonb),
('Consultoria Profissional', 'Página para consultor/coach com autoridade e agendamento', 'consulting',
 '{"primary_color":"#059669","secondary_color":"#10b981","background_color":"#0a0f0d","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Consultoria estratégica para resultados reais","subtitle":"Mais de 10 anos transformando negócios","cta_text":"Agendar diagnóstico","align":"center"}},
   {"type":"features","props":{"title":"Como posso te ajudar","items":[{"title":"Diagnóstico completo","desc":"Análise profunda do seu negócio"},{"title":"Plano de ação","desc":"Estratégia customizada"},{"title":"Acompanhamento","desc":"Suporte contínuo"}]}},
   {"type":"testimonials","props":{"title":"Resultados de clientes","items":[{"name":"Carlos","text":"Triplicou meu faturamento.","role":"Empresário"}]}},
   {"type":"form_embed","props":{"title":"Agende sua consultoria"}},
   {"type":"footer","props":{"text":"© 2026"}}
 ]}]'::jsonb),
('Evento / Workshop', 'Página de inscrição para evento presencial ou online', 'event',
 '{"primary_color":"#f59e0b","secondary_color":"#fbbf24","background_color":"#1a0f00","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Evento exclusivo — vagas limitadas","subtitle":"Uma experiência transformadora para profissionais","cta_text":"Garantir minha vaga","align":"center"}},
   {"type":"countdown","props":{"title":"Faltam para o evento","days":30}},
   {"type":"features","props":{"title":"O que você vai aprender","items":[{"title":"Networking","desc":"Conheça profissionais top"},{"title":"Conteúdo prático","desc":"Aplicável no dia seguinte"},{"title":"Certificado","desc":"Reconhecido no mercado"}]}},
   {"type":"map","props":{"title":"Local","address":"São Paulo, SP"}},
   {"type":"form_embed","props":{"title":"Inscreva-se"}},
   {"type":"footer","props":{"text":"© 2026 Evento"}}
 ]}]'::jsonb),
('Restaurante / Negócio Local', 'Site para restaurante, café ou negócio local', 'local',
 '{"primary_color":"#b91c1c","secondary_color":"#fca5a5","background_color":"#1a0a0a","text_color":"#fafafa","font_family":"Inter"}'::jsonb,
 '[{"slug":"home","title":"Início","is_home":true,"blocks":[
   {"type":"hero","props":{"title":"Sabores que contam histórias","subtitle":"Cozinha autoral no coração da cidade","cta_text":"Reservar mesa","align":"center"}},
   {"type":"gallery","props":{"title":"Nossos pratos","images":[]}},
   {"type":"features","props":{"title":"Sobre nós","items":[{"title":"Ingredientes locais","desc":"Direto do produtor"},{"title":"Ambiente único","desc":"Decoração acolhedora"},{"title":"Eventos","desc":"Reservamos para grupos"}]}},
   {"type":"map","props":{"title":"Onde estamos","address":"Rua Exemplo, 123"}},
   {"type":"form_embed","props":{"title":"Reserve sua mesa"}},
   {"type":"footer","props":{"text":"© 2026 Restaurante"}}
 ]}]'::jsonb);