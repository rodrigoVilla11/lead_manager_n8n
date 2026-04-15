export type UserRole = "admin" | "worker" | "client";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  worker: "Trabajador",
  client: "Cliente",
};

export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageClients: boolean;
  canManageWorkflows: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canExport: boolean;
  canSeeAutomation: boolean;
  canSeeAllClients: boolean;
}> = {
  admin: {
    canManageClients: true,
    canManageWorkflows: true,
    canManageBilling: true,
    canManageSettings: true,
    canManageUsers: true,
    canExport: true,
    canSeeAutomation: true,
    canSeeAllClients: true,
  },
  worker: {
    canManageClients: true,
    canManageWorkflows: true,
    canManageBilling: false,
    canManageSettings: false,
    canManageUsers: false,
    canExport: true,
    canSeeAutomation: true,
    canSeeAllClients: false, // only assigned clients
  },
  client: {
    canManageClients: false,
    canManageWorkflows: false,
    canManageBilling: false,
    canManageSettings: false,
    canManageUsers: false,
    canExport: false,
    canSeeAutomation: false, // no workflows visible
    canSeeAllClients: false, // only their own
  },
};

export function getPermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.client;
}
