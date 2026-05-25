/**
 * AI Service
 * Integração com OpenAI para geração de funis, leads e conteúdo
 */

import { AIFunnelRequest, AIGeneratedFunnel, AIGeneratedCopy, LeadScoringModel, AILeadScore } from "./ai-schemas";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export class AIService {
  /**
   * Gera um funil completo baseado na descrição do negócio
   */
  static async generateFunnel(request: AIFunnelRequest): Promise<AIGeneratedFunnel> {
    const prompt = `
      Você é um especialista em marketing de alto desempenho e vendas B2B/B2C.
      
      Crie um funil de vendas completo para:
      - Tipo de negócio: ${request.businessType}
      - Público-alvo: ${request.targetAudience}
      - Objetivo principal: ${request.mainGoal}
      - Produto/Serviço: ${request.productOrService}
      - Tom: ${request.tone || "professional"}
      
      Retorne um JSON estruturado com:
      1. Nome e descrição do funil
      2. Tipo de funil (vsl, quiz, webinar, application, booking)
      3. Landing page headline, subheadline e CTA
      4. Formulário com 5-7 campos estratégicos
      5. Sequência de automação (triggers e ações)
      6. Pipeline do CRM com 4-5 estágios
      
      Certifique-se de que o funil seja otimizado para conversão e alinhado com as melhores práticas de marketing.
    `;

    const response = await this.callOpenAI(prompt);
    return this.parseFunnelResponse(response);
  }

  /**
   * Gera copy de vendas otimizado
   */
  static async generateCopy(context: {
    productName: string;
    targetAudience: string;
    mainBenefit: string;
    tone: string;
  }): Promise<AIGeneratedCopy> {
    const prompt = `
      Você é um copywriter especializado em vendas de alto ticket.
      
      Crie copy para:
      - Produto: ${context.productName}
      - Público: ${context.targetAudience}
      - Benefício principal: ${context.mainBenefit}
      - Tom: ${context.tone}
      
      Retorne um JSON com:
      1. Headline (máx 10 palavras)
      2. Subheadline (máx 20 palavras)
      3. Body text (2-3 parágrafos)
      4. CTA (máx 5 palavras)
      5. Sequência de WhatsApp (3-5 mensagens)
      6. Sequência de Email (3-5 emails)
      
      Foque em gatilhos psicológicos, urgência e benefícios claros.
    `;

    const response = await this.callOpenAI(prompt);
    return this.parseCopyResponse(response);
  }

  /**
   * Gera modelo de lead scoring automático
   */
  static async generateLeadScoringModel(businessContext: string): Promise<LeadScoringModel> {
    const prompt = `
      Você é um especialista em lead scoring e qualificação.
      
      Crie um modelo de lead scoring para: ${businessContext}
      
      Retorne um JSON com:
      1. Nome do modelo
      2. 8-10 critérios de scoring
      3. Pesos para cada critério (0-100)
      4. Limiares para cold/warm/hot
      
      Exemplo de critérios: tempo de resposta, engajamento, tamanho da empresa, orçamento, etc.
    `;

    const response = await this.callOpenAI(prompt);
    return this.parseScoringResponse(response);
  }

  /**
   * Calcula score de um lead baseado no modelo
   */
  static calculateLeadScore(
    leadData: Record<string, any>,
    model: LeadScoringModel
  ): AILeadScore {
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    model.criteria.forEach((criterion) => {
      const fieldValue = leadData[criterion.field];
      let points = 0;

      switch (criterion.operator) {
        case "equals":
          points = fieldValue === criterion.value ? criterion.points : 0;
          break;
        case "contains":
          points = String(fieldValue).includes(criterion.value) ? criterion.points : 0;
          break;
        case "greater_than":
          points = fieldValue > criterion.value ? criterion.points : 0;
          break;
        case "less_than":
          points = fieldValue < criterion.value ? criterion.points : 0;
          break;
        case "in_range":
          points =
            fieldValue >= criterion.value[0] && fieldValue <= criterion.value[1]
              ? criterion.points
              : 0;
          break;
      }

      breakdown[criterion.field] = points;
      totalScore += points;
    });

    const temperature = this.getTemperature(totalScore);
    const recommendation = this.getRecommendation(temperature, totalScore);

    return {
      leadId: leadData.id,
      totalScore,
      temperature,
      breakdown,
      recommendation,
    };
  }

  /**
   * Chama uma API de IA Gratuita (Ex: Groq Free Tier ou Hugging Face)
   * Adaptado para rodar no Lovable sem custo de API OpenAI
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    try {
      // Usando Groq (que possui um tier gratuito generoso) ou fallback local
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // O usuário pode inserir uma chave gratuita do Groq aqui
          Authorization: `Bearer ${process.env.GROQ_API_KEY || "gsk_free_tier_placeholder"}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Modelo rápido e gratuito
          messages: [
            {
              role: "system",
              content: "Você é um assistente de IA especializado em marketing e vendas. Retorne APENAS o JSON solicitado.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        // Fallback para geração baseada em templates se a API falhar
        console.warn("API de IA falhou, usando gerador de templates offline.");
        return this.getOfflineTemplateResponse(prompt);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      return this.getOfflineTemplateResponse(prompt);
    }
  }

  /**
   * Gerador de templates offline para garantir funcionamento sem API
   */
  private static getOfflineTemplateResponse(prompt: string): string {
    if (prompt.includes("funil")) {
      return JSON.stringify(this.getDefaultFunnel());
    }
    if (prompt.includes("copy")) {
      return JSON.stringify(this.getDefaultCopy());
    }
    return JSON.stringify({});
  }

  /**
   * Parseia resposta de funil
   */
  private static parseFunnelResponse(response: string): AIGeneratedFunnel {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || response);
      return {
        id: `funnel_${Date.now()}`,
        name: parsed.name || "Novo Funil",
        description: parsed.description || "",
        type: parsed.type || "vsl",
        landingPage: parsed.landingPage || {},
        form: parsed.form || { fields: [] },
        automation: parsed.automation || { triggers: [], actions: [] },
        crm: parsed.crm || { pipelineName: "Novo Pipeline", stages: [] },
      };
    } catch (error) {
      console.error("Parse error:", error);
      return this.getDefaultFunnel();
    }
  }

  /**
   * Parseia resposta de copy
   */
  private static parseCopyResponse(response: string): AIGeneratedCopy {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || response);
      return {
        headline: parsed.headline || "Transforme seu negócio",
        subheadline: parsed.subheadline || "Com a melhor solução do mercado",
        bodyText: parsed.bodyText || "",
        cta: parsed.cta || "Começar Agora",
        whatsappSequence: parsed.whatsappSequence || [],
        emailSequence: parsed.emailSequence || [],
      };
    } catch (error) {
      console.error("Parse error:", error);
      return this.getDefaultCopy();
    }
  }

  /**
   * Parseia resposta de scoring
   */
  private static parseScoringResponse(response: string): LeadScoringModel {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || response);
      return {
        id: `model_${Date.now()}`,
        name: parsed.name || "Modelo de Scoring",
        criteria: parsed.criteria || [],
        weights: parsed.weights || {},
      };
    } catch (error) {
      console.error("Parse error:", error);
      return this.getDefaultScoringModel();
    }
  }

  /**
   * Determina temperatura do lead
   */
  private static getTemperature(score: number): "cold" | "warm" | "hot" {
    if (score >= 70) return "hot";
    if (score >= 40) return "warm";
    return "cold";
  }

  /**
   * Gera recomendação baseada na temperatura
   */
  private static getRecommendation(temperature: string, score: number): string {
    const recommendations = {
      hot: `Lead altamente qualificado (${score} pts). Prioridade máxima para contato imediato.`,
      warm: `Lead moderadamente qualificado (${score} pts). Agendar follow-up em 24-48h.`,
      cold: `Lead em estágio inicial (${score} pts). Enviar conteúdo educativo e nutrir.`,
    };
    return recommendations[temperature as keyof typeof recommendations] || "";
  }

  /**
   * Funil padrão fallback
   */
  private static getDefaultFunnel(): AIGeneratedFunnel {
    return {
      id: `funnel_${Date.now()}`,
      name: "Funil de Vendas Padrão",
      description: "Funil gerado automaticamente",
      type: "vsl",
      landingPage: {
        headline: "Transforme seu negócio com OCTAFLUX",
        subheadline: "Plataforma de vendas potenciada por IA",
        cta: "Começar Agora",
      },
      form: {
        title: "Qualifique-se",
        fields: [],
        successMessage: "Obrigado! Entraremos em contato em breve.",
      },
      automation: { triggers: [], actions: [] },
      crm: { pipelineName: "Pipeline Principal", stages: ["Novo", "Qualificado", "Proposta", "Fechado"] },
    };
  }

  /**
   * Copy padrão fallback
   */
  private static getDefaultCopy(): AIGeneratedCopy {
    return {
      headline: "Revolucione suas vendas",
      subheadline: "Com inteligência artificial",
      bodyText: "Automatize seu funil de vendas e qualifique leads em tempo real.",
      cta: "Começar Grátis",
      whatsappSequence: [],
      emailSequence: [],
    };
  }

  /**
   * Modelo de scoring padrão fallback
   */
  private static getDefaultScoringModel(): LeadScoringModel {
    return {
      id: `model_${Date.now()}`,
      name: "Modelo de Scoring Padrão",
      criteria: [
        { id: "1", field: "email", operator: "contains", value: "@", points: 10 },
        { id: "2", field: "phone", operator: "contains", value: "", points: 15 },
        { id: "3", field: "company", operator: "contains", value: "", points: 20 },
      ],
      weights: { email: 0.2, phone: 0.3, company: 0.5 },
    };
  }
}
