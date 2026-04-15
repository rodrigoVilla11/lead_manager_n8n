export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: { id: string; name: string }[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  typeVersion?: number;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: "success" | "error" | "running" | "waiting";
  workflowData?: {
    name: string;
  };
}

export interface WorkflowConfig {
  nichos: string;
  regiones: string;
  pais: string;
  producto: string;
  propuestaValor?: string;
  maxResultados?: number;
  googleSheetUrl?: string;
}

// --- Client Workflow (the 1:N bridge) ---

export interface ClientWorkflowRecord {
  id: string;
  clientId: string;
  displayName: string;
  n8nWorkflowId: string | null;
  active: boolean;
  notes: string | null;
  nichos: string | null;
  regiones: string | null;
  pais: string | null;
  producto: string | null;
  propuestaValor: string | null;
  googleSheetUrl: string | null;
  googleSheetId: string | null;
  maxResultados: number | null;
  intervaloMinutos: number | null;
  createdAt: string;
  updatedAt: string;
  executions?: ExecutionRecord[];
}

export interface ClientWithWorkflows {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  assignedUserIds: string[];
  googleSheetUrl: string | null;
  monthlyAmount: number | null;
  nextPaymentDate: string | null;
  paymentMethod: string | null;
  totalLeads: number;
  leadsThisMonth: number;
  createdAt: string;
  updatedAt: string;
  workflows: ClientWorkflowRecord[];
  payments?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  method: string | null;
  notes: string | null;
  status: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  createdAt: string;
}

export interface CreatePaymentInput {
  clientId: string;
  amount: number;
  date: string;
  method?: string;
  notes?: string;
  status?: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
}

export interface UpdateBillingInput {
  monthlyAmount?: number | null;
  nextPaymentDate?: string | null;
  paymentMethod?: string | null;
}

export interface ExecutionRecord {
  id: string;
  clientWorkflowId: string;
  n8nExecutionId: string | null;
  status: "SUCCESS" | "ERROR" | "RUNNING" | "WAITING";
  startedAt: string;
  finishedAt: string | null;
  leadsFound: number;
  emailsExtracted: number;
  errorMessage: string | null;
  clientWorkflow?: {
    displayName: string;
    client?: {
      name: string;
    };
  };
}

export interface DashboardStats {
  activeClients: number;
  totalLeads: number;
  activeWorkflows: number;
  leadsThisWeek: number;
}

export interface LeadsByDay {
  date: string;
  leads: number;
}

// --- Inputs ---

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  workflow?: {
    displayName: string;
    config?: WorkflowConfigInput;
  };
}

export interface WorkflowConfigInput {
  nichos: string;
  regiones: string;
  pais: string;
  producto: string;
  propuestaValor?: string;
  googleSheetUrl?: string;
  maxResultados?: number;
  intervaloMinutos?: number;
}

export interface AddWorkflowInput {
  clientId: string;
  displayName: string;
  n8nWorkflowId?: string;
  config?: WorkflowConfigInput;
}

export interface UpdateWorkflowInput {
  displayName?: string;
  nichos?: string;
  regiones?: string;
  pais?: string;
  producto?: string;
  propuestaValor?: string;
  googleSheetUrl?: string;
  maxResultados?: number;
  intervaloMinutos?: number;
}
