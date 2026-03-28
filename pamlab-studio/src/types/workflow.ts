// ── Workflow Builder Types ──────────────────────────────────────────

/** A system connector (AD, Fudo PAM, etc.) */
export interface Connector {
  id: string;
  name: string;
  icon: string;
  color: string;        // tailwind bg class
  description: string;
  actions: ConnectorAction[];
}

/** One action a connector can perform */
export interface ConnectorAction {
  id: string;
  name: string;
  description: string;
  method: string;
  path: string;         // relative, e.g. /api/users
  params: ActionParam[];
}

/** A user-configurable parameter for an action */
export interface ActionParam {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'duration';
  placeholder?: string;
  required?: boolean;
  default?: string;
  options?: { value: string; label: string }[];
}

/** A configured step in a workflow */
export interface WorkflowStep {
  id: string;           // uuid
  connectorId: string;
  actionId: string;
  params: Record<string, string>;
  label?: string;       // user-defined step label
}

/** The full workflow definition */
export interface Workflow {
  name: string;
  description: string;
  trigger: 'manual' | 'matrix42-ticket' | 'servicenow-request' | 'jira-request';
  steps: WorkflowStep[];
}
