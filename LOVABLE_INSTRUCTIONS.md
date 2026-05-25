# Como Importar o OCTAFLUX para o Lovable

Siga estes passos para colocar o OCTAFLUX v2.0 para rodar diretamente no Lovable usando o banco interno.

## 1. Importação do Código
1. Crie um novo projeto no **Lovable**.
2. No chat do Lovable, envie os arquivos do projeto ou cole o código dos componentes principais.
3. O Lovable irá detectar automaticamente a estrutura do **Vite + React + Tailwind**.

## 2. Configuração do Banco de Dados (Supabase)
O Lovable usa o Supabase internamente. Para que as funcionalidades enterprise funcionem:
1. Vá para a aba **"Database"** no Lovable.
2. Execute o script SQL contido em `supabase/migrations/20260525000000_octaflux_enterprise.sql`.
3. Isso criará as tabelas de Funis, Automações, Times e White Label.

## 3. Configuração da IA (Gratuita)
Para não gastar créditos de API:
1. O projeto está configurado para usar o **Groq (Llama 3)**, que possui um tier gratuito excelente.
2. Você pode obter uma chave gratuita em [console.groq.com](https://console.groq.com).
3. No Lovable, adicione a variável de ambiente `GROQ_API_KEY`.
4. **Nota**: Se não houver chave, o sistema usará um **Gerador de Templates Offline** (implementado no `ai-service.ts`) para que nada quebre.

## 4. Conexão do Banco Interno
O arquivo `src/integrations/supabase/client.ts` já deve estar configurado pelo Lovable. O código do OCTAFLUX usa este cliente para todas as operações, garantindo que os leads e funis sejam salvos no banco que o Lovable gerencia.

## 5. Rotas Principais para Acessar
- `/app/ai-funnel-generator` - Gerador de Funis com IA
- `/app/automation-builder` - Construtor de Automações
- `/app/lead-scoring` - Qualificação de Leads
- `/app/lead-router` - Roteamento Universal
- `/app/white-label` - Branding Customizado
- `/app/team-management` - Gestão de Times

---

**Dica**: Se o Lovable perguntar sobre as tabelas, diga: *"Use as tabelas existentes no Supabase interno para leads, funnels e automations"*.
