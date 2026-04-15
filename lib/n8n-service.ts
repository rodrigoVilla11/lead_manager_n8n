import type {
  N8nWorkflow,
  N8nNode,
  N8nExecution,
  WorkflowConfig,
} from "@/types";

const CONFIG_NODE_NAME = "⚙️ CONFIGURACIÓN";

class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_API_URL ?? "";
    this.apiKey = process.env.N8N_API_KEY ?? "";
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error(
        "N8N_API_URL and N8N_API_KEY environment variables must be set"
      );
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": this.apiKey,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(
        `[n8n] ${options?.method ?? "GET"} ${url} → ${response.status}`,
        errorBody
      );
      throw new Error(
        `n8n API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    // Some endpoints (activate/deactivate) may return empty body
    const text = await response.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
  }

  async getAllWorkflows(): Promise<N8nWorkflow[]> {
    const result = await this.request<{ data: N8nWorkflow[] }>("/workflows");
    return result.data;
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>(`/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<void> {
    await this.request(`/workflows/${id}/activate`, { method: "POST" });
  }

  async deactivateWorkflow(id: string): Promise<void> {
    await this.request(`/workflows/${id}/deactivate`, { method: "POST" });
  }

  async duplicateWorkflowForClient(
    templateId: string,
    clientName: string,
    config: WorkflowConfig
  ): Promise<N8nWorkflow> {
    // 1. GET the template workflow
    const template = await this.getWorkflow(templateId);

    // 2. Inject client config into the config node
    const nodes = template.nodes.map((node) => {
      if (node.name === CONFIG_NODE_NAME) {
        return this.buildConfigNode(node, config);
      }
      return node;
    });

    // 3. Create new workflow via POST
    const newWorkflow = await this.request<N8nWorkflow>("/workflows", {
      method: "POST",
      body: JSON.stringify({
        name: `${clientName} - Lead Generation`,
        nodes,
        connections: template.connections,
        settings: template.settings ?? {},
      }),
    });

    return newWorkflow;
  }

  async updateWorkflowConfig(
    workflowId: string,
    config: Partial<WorkflowConfig>
  ): Promise<N8nWorkflow> {
    // 1. GET workflow
    const workflow = await this.getWorkflow(workflowId);

    // 2. Find config node and update assignments
    const nodes = workflow.nodes.map((node) => {
      if (node.name === CONFIG_NODE_NAME) {
        const currentConfig = this.extractConfigFromNode(node);
        const mergedConfig = { ...currentConfig, ...config };
        return this.buildConfigNode(node, mergedConfig as WorkflowConfig);
      }
      return node;
    });

    // 3. PATCH workflow
    const updated = await this.request<N8nWorkflow>(
      `/workflows/${workflowId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ nodes }),
      }
    );

    return updated;
  }

  extractConfigFromWorkflow(workflow: N8nWorkflow): WorkflowConfig | null {
    const configNode = workflow.nodes.find(
      (node) => node.name === CONFIG_NODE_NAME
    );
    if (!configNode) return null;
    return this.extractConfigFromNode(configNode);
  }

  async getExecutions(
    workflowId?: string,
    limit: number = 20
  ): Promise<N8nExecution[]> {
    const params = new URLSearchParams();
    if (workflowId) params.set("workflowId", workflowId);
    params.set("limit", String(limit));

    const result = await this.request<{ data: N8nExecution[] }>(
      `/executions?${params.toString()}`
    );
    return result.data;
  }

  async getExecution(id: string): Promise<N8nExecution> {
    return this.request<N8nExecution>(`/executions/${id}`);
  }

  async duplicateWorkflow(
    templateId: string,
    name: string
  ): Promise<N8nWorkflow> {
    const template = await this.getWorkflow(templateId);

    // Only pass allowed settings fields
    const rawSettings = (template.settings ?? {}) as Record<string, unknown>;
    const allowedSettings = [
      "executionOrder",
      "saveManualExecutions",
      "callerPolicy",
      "errorWorkflow",
      "timezone",
    ];
    const settings: Record<string, unknown> = {};
    for (const key of allowedSettings) {
      if (key in rawSettings) settings[key] = rawSettings[key];
    }

    const payload = {
      name,
      nodes: template.nodes,
      connections: template.connections,
      settings,
    };

    // Log the top-level keys being sent (not the full body to avoid spam)
    console.log(
      "[n8n] duplicateWorkflow payload keys:",
      Object.keys(payload),
      "| template keys:",
      Object.keys(template)
    );

    const newWorkflow = await this.request<N8nWorkflow>("/workflows", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return newWorkflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.request(`/workflows/${id}`, { method: "DELETE" });
  }

  // --- Private helpers ---

  private extractConfigFromNode(node: N8nNode): WorkflowConfig | null {
    const assignments = (
      node.parameters?.assignments as {
        assignments?: Array<{ name: string; value: string; type: string }>;
      }
    )?.assignments;

    if (!assignments) return null;

    const getValue = (name: string): string =>
      assignments.find((a) => a.name === name)?.value ?? "";

    return {
      nichos: getValue("nichos"),
      regiones: getValue("regiones"),
      pais: getValue("pais"),
      producto: getValue("producto"),
      propuestaValor: getValue("propuesta_valor"),
      maxResultados:
        parseInt(getValue("max_resultados_por_busqueda"), 10) || 20,
      googleSheetUrl: getValue("google_sheet_url") || undefined,
    };
  }

  private buildConfigNode(
    originalNode: N8nNode,
    config: WorkflowConfig
  ): N8nNode {
    const assignments: Array<{
      name: string;
      value: string;
      type: string;
    }> = [
      { name: "nichos", value: config.nichos, type: "string" },
      { name: "regiones", value: config.regiones, type: "string" },
      { name: "pais", value: config.pais, type: "string" },
      { name: "producto", value: config.producto, type: "string" },
      {
        name: "propuesta_valor",
        value: config.propuestaValor ?? "",
        type: "string",
      },
      {
        name: "max_resultados_por_busqueda",
        value: String(config.maxResultados ?? 20),
        type: "string",
      },
    ];

    if (config.googleSheetUrl) {
      assignments.push({
        name: "google_sheet_url",
        value: config.googleSheetUrl,
        type: "string",
      });
    }

    return {
      ...originalNode,
      parameters: {
        ...originalNode.parameters,
        assignments: {
          assignments,
        },
      },
    };
  }
}

export const n8nService = new N8nService();
