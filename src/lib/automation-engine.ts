/**
 * Automation Engine
 * Sistema de automações visuais estilo n8n/Make
 */

import { AutomationWorkflow, WorkflowNode, WorkflowEdge, WorkflowTrigger } from "./schema-builder";

export interface AutomationExecution {
  id: string;
  workflowId: string;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "success" | "failed";
  nodeExecutions: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: "pending" | "running" | "success" | "failed";
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
  duration: number;
}

export class AutomationEngine {
  /**
   * Executa um workflow de automação
   */
  static async executeWorkflow(
    workflow: AutomationWorkflow,
    triggerData: Record<string, any>
  ): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      startedAt: new Date(),
      status: "running",
      nodeExecutions: [],
    };

    try {
      // Encontrar o primeiro nó após o trigger
      const startNodes = this.findStartNodes(workflow);

      for (const nodeId of startNodes) {
        await this.executeNode(workflow, nodeId, triggerData, execution);
      }

      execution.status = "success";
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = "failed";
      execution.completedAt = new Date();
      console.error("Workflow execution error:", error);
    }

    return execution;
  }

  /**
   * Executa um nó individual
   */
  private static async executeNode(
    workflow: AutomationWorkflow,
    nodeId: string,
    data: Record<string, any>,
    execution: AutomationExecution
  ): Promise<Record<string, any>> {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const startTime = Date.now();
    const nodeExecution: NodeExecution = {
      nodeId,
      status: "running",
      input: data,
      output: {},
      duration: 0,
    };

    try {
      let output = data;

      switch (node.type) {
        case "action":
          output = await this.executeAction(node, data);
          break;
        case "condition":
          output = await this.evaluateCondition(node, data);
          break;
        case "delay":
          output = await this.executeDelay(node, data);
          break;
        case "webhook":
          output = await this.executeWebhook(node, data);
          break;
        case "ai_action":
          output = await this.executeAIAction(node, data);
          break;
      }

      nodeExecution.output = output;
      nodeExecution.status = "success";

      // Executar próximos nós
      const nextNodes = workflow.edges
        .filter((e) => e.source === nodeId)
        .map((e) => e.target);

      for (const nextNodeId of nextNodes) {
        await this.executeNode(workflow, nextNodeId, output, execution);
      }
    } catch (error) {
      nodeExecution.status = "failed";
      nodeExecution.error = String(error);
    }

    nodeExecution.duration = Date.now() - startTime;
    execution.nodeExecutions.push(nodeExecution);

    return nodeExecution.output;
  }

  /**
   * Executa uma ação
   */
  private static async executeAction(node: WorkflowNode, data: Record<string, any>): Promise<Record<string, any>> {
    const { actionType, config } = node.config;

    switch (actionType) {
      case "send_email":
        return this.sendEmail(config, data);
      case "send_whatsapp":
        return this.sendWhatsApp(config, data);
      case "add_tag":
        return this.addTag(config, data);
      case "update_score":
        return this.updateScore(config, data);
      case "create_task":
        return this.createTask(config, data);
      default:
        return data;
    }
  }

  /**
   * Avalia uma condição
   */
  private static async evaluateCondition(node: WorkflowNode, data: Record<string, any>): Promise<Record<string, any>> {
    const { field, operator, value } = node.config;
    const fieldValue = data[field];

    let result = false;

    switch (operator) {
      case "equals":
        result = fieldValue === value;
        break;
      case "contains":
        result = String(fieldValue).includes(value);
        break;
      case "greater_than":
        result = fieldValue > value;
        break;
      case "less_than":
        result = fieldValue < value;
        break;
      case "in":
        result = value.includes(fieldValue);
        break;
    }

    return { ...data, _conditionResult: result };
  }

  /**
   * Executa um delay
   */
  private static async executeDelay(node: WorkflowNode, data: Record<string, any>): Promise<Record<string, any>> {
    const { duration, unit } = node.config;
    const ms = this.convertToMilliseconds(duration, unit);
    await new Promise((resolve) => setTimeout(resolve, ms));
    return data;
  }

  /**
   * Executa um webhook
   */
  private static async executeWebhook(node: WorkflowNode, data: Record<string, any>): Promise<Record<string, any>> {
    const { url, method = "POST", headers = {} } = node.config;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return { ...data, webhookResponse: result };
    } catch (error) {
      throw new Error(`Webhook failed: ${error}`);
    }
  }

  /**
   * Executa uma ação de IA
   */
  private static async executeAIAction(node: WorkflowNode, data: Record<string, any>): Promise<Record<string, any>> {
    const { aiType, prompt } = node.config;

    // Placeholder para integração com AI Service
    console.log("AI Action:", aiType, prompt);

    return { ...data, aiResult: "AI action executed" };
  }

  /**
   * Envia e-mail
   */
  private static async sendEmail(config: any, data: Record<string, any>): Promise<Record<string, any>> {
    console.log("Sending email to:", data.email);
    return { ...data, emailSent: true };
  }

  /**
   * Envia WhatsApp
   */
  private static async sendWhatsApp(config: any, data: Record<string, any>): Promise<Record<string, any>> {
    console.log("Sending WhatsApp to:", data.phone);
    return { ...data, whatsappSent: true };
  }

  /**
   * Adiciona tag
   */
  private static async addTag(config: any, data: Record<string, any>): Promise<Record<string, any>> {
    const { tag } = config;
    return { ...data, tags: [...(data.tags || []), tag] };
  }

  /**
   * Atualiza score
   */
  private static async updateScore(config: any, data: Record<string, any>): Promise<Record<string, any>> {
    const { points } = config;
    return { ...data, score: (data.score || 0) + points };
  }

  /**
   * Cria tarefa
   */
  private static async createTask(config: any, data: Record<string, any>): Promise<Record<string, any>> {
    const { title, description } = config;
    return { ...data, taskCreated: true, taskId: `task_${Date.now()}` };
  }

  /**
   * Encontra nós iniciais
   */
  private static findStartNodes(workflow: AutomationWorkflow): string[] {
    const connectedNodes = new Set(workflow.edges.map((e) => e.target));
    return workflow.nodes
      .filter((n) => !connectedNodes.has(n.id) && n.type !== "condition")
      .map((n) => n.id);
  }

  /**
   * Converte tempo para milissegundos
   */
  private static convertToMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case "seconds":
        return duration * 1000;
      case "minutes":
        return duration * 60 * 1000;
      case "hours":
        return duration * 60 * 60 * 1000;
      case "days":
        return duration * 24 * 60 * 60 * 1000;
      default:
        return duration * 1000;
    }
  }
}

/**
 * Presets de workflows comuns
 */
export const WORKFLOW_PRESETS = {
  /**
   * Workflow: Qualificar e Rotear Lead
   */
  qualifyAndRoute: (): AutomationWorkflow => ({
    id: `workflow_${Date.now()}`,
    name: "Qualificar e Rotear Lead",
    trigger: {
      type: "form_submit",
      config: {},
    },
    nodes: [
      {
        id: "node_1",
        type: "action",
        label: "Adicionar Tag",
        config: { actionType: "add_tag", tag: "novo_lead" },
      },
      {
        id: "node_2",
        type: "condition",
        label: "Score > 50?",
        config: { field: "score", operator: "greater_than", value: 50 },
      },
      {
        id: "node_3",
        type: "action",
        label: "Enviar WhatsApp",
        config: { actionType: "send_whatsapp", template: "Olá {nome}!" },
      },
      {
        id: "node_4",
        type: "action",
        label: "Criar Tarefa",
        config: { actionType: "create_task", title: "Follow-up com {nome}" },
      },
    ],
    edges: [
      { id: "edge_1", source: "node_1", target: "node_2" },
      { id: "edge_2", source: "node_2", target: "node_3", condition: "true" },
      { id: "edge_3", source: "node_3", target: "node_4" },
    ],
  }),

  /**
   * Workflow: Sequência de Email
   */
  emailSequence: (): AutomationWorkflow => ({
    id: `workflow_${Date.now()}`,
    name: "Sequência de Email",
    trigger: {
      type: "lead_created",
      config: {},
    },
    nodes: [
      {
        id: "node_1",
        type: "action",
        label: "Email 1 - Boas-vindas",
        config: { actionType: "send_email", template: "email_welcome" },
      },
      {
        id: "node_2",
        type: "delay",
        label: "Esperar 2 dias",
        config: { duration: 2, unit: "days" },
      },
      {
        id: "node_3",
        type: "action",
        label: "Email 2 - Proposta",
        config: { actionType: "send_email", template: "email_proposal" },
      },
      {
        id: "node_4",
        type: "delay",
        label: "Esperar 3 dias",
        config: { duration: 3, unit: "days" },
      },
      {
        id: "node_5",
        type: "action",
        label: "Email 3 - Follow-up",
        config: { actionType: "send_email", template: "email_followup" },
      },
    ],
    edges: [
      { id: "edge_1", source: "node_1", target: "node_2" },
      { id: "edge_2", source: "node_2", target: "node_3" },
      { id: "edge_3", source: "node_3", target: "node_4" },
      { id: "edge_4", source: "node_4", target: "node_5" },
    ],
  }),
};
