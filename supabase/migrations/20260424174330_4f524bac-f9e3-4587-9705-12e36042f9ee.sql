
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  genero TEXT,
  idade INTEGER,
  faixa_investimento TEXT,
  status TEXT NOT NULL,
  pipeline TEXT NOT NULL DEFAULT 'Novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendly_url TEXT DEFAULT 'https://calendly.com/seu-usuario/30min',
  wa_msg_qualificado TEXT DEFAULT 'Olá {nome}! Parabéns, você foi qualificado. Agende sua reunião: {calendly}',
  wa_msg_nao_qualificado TEXT DEFAULT 'Olá {nome}! Obrigado pelo interesse. Convidamos você para nossa comunidade!',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.settings (calendly_url, wa_msg_qualificado, wa_msg_nao_qualificado) VALUES
('https://calendly.com/seu-usuario/30min',
 'Olá {nome}! Parabéns, você foi qualificado. Agende sua reunião: {calendly}',
 'Olá {nome}! Obrigado pelo interesse. Convidamos você para nossa comunidade!');

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Public delete leads" ON public.leads FOR DELETE USING (true);

CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public update settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Public insert settings" ON public.settings FOR INSERT WITH CHECK (true);
