/**
 * Schema-Driven Builder
 * Sistema universal baseado em JSON Schema para criar qualquer tipo de formulário/página
 */

export interface JSONSchema {
  $schema: string;
  type: string;
  title: string;
  description?: string;
  properties: Record<string, SchemaProperty>;
  required?: string[];
  uiSchema?: UISchema;
}

export interface SchemaProperty {
  type: string;
  title: string;
  description?: string;
  enum?: any[];
  default?: any;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  conditional?: ConditionalRule[];
}

export interface UISchema {
  [key: string]: UISchemaItem;
}

export interface UISchemaItem {
  "ui:widget"?: string;
  "ui:options"?: Record<string, any>;
  "ui:placeholder"?: string;
  "ui:help"?: string;
  "ui:hidden"?: boolean;
}

export interface ConditionalRule {
  if: {
    field: string;
    equals: any;
  };
  then: {
    show: string[];
    hide: string[];
  };
}

export interface LeadRouterConfig {
  id: string;
  name: string;
  rules: LeadRouterRule[];
  defaultDestination: LeadDestination;
}

export interface LeadRouterRule {
  id: string;
  condition: {
    field: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "in";
    value: any;
  };
  destination: LeadDestination;
  priority: number;
}

export interface LeadDestination {
  type: "crm" | "whatsapp" | "email" | "webhook" | "slack" | "telegram" | "discord" | "notion" | "sheets" | "api";
  config: Record<string, any>;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowTrigger {
  type: "form_submit" | "lead_created" | "tag_added" | "time_based" | "webhook";
  config: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: "action" | "condition" | "delay" | "webhook" | "ai_action";
  label: string;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export class SchemaBuilder {
  /**
   * Cria um schema de formulário padrão
   */
  static createFormSchema(config: {
    title: string;
    description?: string;
    fields: FormFieldConfig[];
  }): JSONSchema {
    const properties: Record<string, SchemaProperty> = {};
    const required: string[] = [];

    config.fields.forEach((field) => {
      properties[field.id] = {
        type: field.type,
        title: field.label,
        description: field.description,
        ...(field.required && { minLength: 1 }),
        ...(field.options && { enum: field.options }),
        ...(field.pattern && { pattern: field.pattern }),
      };

      if (field.required) {
        required.push(field.id);
      }
    });

    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      title: config.title,
      description: config.description,
      properties,
      required,
    };
  }

  /**
   * Valida dados contra um schema
   */
  static validateData(data: Record<string, any>, schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar campos obrigatórios
    if (schema.required) {
      schema.required.forEach((field) => {
        if (!data[field]) {
          errors.push(`Campo "${field}" é obrigatório`);
        }
      });
    }

    // Validar tipos e regras
    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (data[key] === undefined || data[key] === null) return;

      const value = data[key];

      // Validar tipo
      if (prop.type === "string" && typeof value !== "string") {
        errors.push(`Campo "${key}" deve ser texto`);
      }
      if (prop.type === "number" && typeof value !== "number") {
        errors.push(`Campo "${key}" deve ser número`);
      }

      // Validar comprimento
      if (prop.minLength && value.length < prop.minLength) {
        errors.push(`Campo "${key}" deve ter no mínimo ${prop.minLength} caracteres`);
      }
      if (prop.maxLength && value.length > prop.maxLength) {
        errors.push(`Campo "${key}" deve ter no máximo ${prop.maxLength} caracteres`);
      }

      // Validar padrão regex
      if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
        errors.push(`Campo "${key}" tem formato inválido`);
      }

      // Validar enum
      if (prop.enum && !prop.enum.includes(value)) {
        errors.push(`Campo "${key}" tem valor inválido`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Aplica regras condicionais
   */
  static applyConditionals(data: Record<string, any>, conditionals: ConditionalRule[]): string[] {
    const hidden: string[] = [];

    conditionals.forEach((rule) => {
      const fieldValue = data[rule.if.field];
      const condition = fieldValue === rule.if.equals;

      if (condition) {
        rule.then.show.forEach((field) => {
          const index = hidden.indexOf(field);
          if (index > -1) hidden.splice(index, 1);
        });
      } else {
        hidden.push(...rule.then.hide);
      }
    });

    return hidden;
  }
}

export class LeadRouter {
  /**
   * Roteia um lead para o destino correto baseado em regras
   */
  static routeLead(leadData: Record<string, any>, config: LeadRouterConfig): LeadDestination {
    // Ordenar regras por prioridade
    const sortedRules = [...config.rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.evaluateCondition(leadData, rule.condition)) {
        return rule.destination;
      }
    }

    return config.defaultDestination;
  }

  /**
   * Avalia uma condição
   */
  private static evaluateCondition(
    data: Record<string, any>,
    condition: LeadRouterRule["condition"]
  ): boolean {
    const value = data[condition.field];

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "contains":
        return String(value).includes(condition.value);
      case "greater_than":
        return value > condition.value;
      case "less_than":
        return value < condition.value;
      case "in":
        return condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Formata dados para envio ao destino
   */
  static formatForDestination(leadData: Record<string, any>, destination: LeadDestination): string {
    switch (destination.type) {
      case "whatsapp":
        return this.formatWhatsApp(leadData, destination.config);
      case "email":
        return this.formatEmail(leadData, destination.config);
      case "webhook":
        return JSON.stringify(leadData);
      default:
        return JSON.stringify(leadData);
    }
  }

  private static formatWhatsApp(data: Record<string, any>, config: any): string {
    const template = config.template || "Novo lead: {nome} - {email}";
    return template
      .replace("{nome}", data.nome || "")
      .replace("{email}", data.email || "")
      .replace("{phone}", data.phone || "");
  }

  private static formatEmail(data: Record<string, any>, config: any): string {
    const template = config.template || JSON.stringify(data);
    return template
      .replace("{nome}", data.nome || "")
      .replace("{email}", data.email || "");
  }
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: "string" | "number" | "email" | "phone" | "select" | "textarea" | "checkbox" | "date";
  description?: string;
  required: boolean;
  options?: string[];
  pattern?: string;
  placeholder?: string;
}

/**
 * Presets de schemas comuns
 */
export const SCHEMA_PRESETS = {
  simpleContact: (): JSONSchema => ({
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Formulário de Contato",
    properties: {
      nome: { type: "string", title: "Nome completo" },
      email: { type: "string", title: "E-mail" },
      phone: { type: "string", title: "Telefone" },
      mensagem: { type: "string", title: "Mensagem" },
    },
    required: ["nome", "email"],
  }),

  leadQualification: (): JSONSchema => ({
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Qualificação de Lead",
    properties: {
      nome: { type: "string", title: "Nome" },
      email: { type: "string", title: "E-mail" },
      empresa: { type: "string", title: "Empresa" },
      cargo: { type: "string", title: "Cargo" },
      budget: { type: "string", title: "Orçamento", enum: ["< R$ 5k", "R$ 5k-10k", "R$ 10k-50k", "> R$ 50k"] },
      timeline: { type: "string", title: "Timeline", enum: ["Imediato", "1-3 meses", "3-6 meses", "Indefinido"] },
    },
    required: ["nome", "email", "empresa"],
  }),

  webinarRegistration: (): JSONSchema => ({
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Registro para Webinar",
    properties: {
      nome: { type: "string", title: "Nome completo" },
      email: { type: "string", title: "E-mail" },
      phone: { type: "string", title: "Telefone (opcional)" },
      empresa: { type: "string", title: "Empresa" },
      interesse: { type: "string", title: "Seu maior interesse", enum: ["Vendas", "Marketing", "Operações", "Outro"] },
    },
    required: ["nome", "email"],
  }),
};
