// Types
export interface ApiConfig {
  name: string;
  url: string;
  label: string;
}

export interface HealthStatus {
  name: string;
  url: string;
  healthy: boolean;
  responseTime: number | null;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  systems: string[];
  steps: string[];
  template: string;
}

export interface ApiCall {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiResult {
  method: string;
  url: string;
  status: number;
  statusText: string;
  time: number;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

export interface StepResultType {
  step: number;
  description: string;
  success: boolean;
  result?: ApiResult;
}

export interface EndpointDef {
  method: string;
  path: string;
  description: string;
  parameters?: { name: string; type: string; required?: boolean; description: string }[];
  exampleRequest?: unknown;
  exampleResponse?: unknown;
}

export interface ApiEndpointGroup {
  api: string;
  baseUrl: string;
  endpoints: EndpointDef[];
}

export interface EventItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AppSettings {
  fudoUrl: string;
  matrixUrl: string;
  adUrl: string;
  snowUrl: string;
  jsmUrl: string;
  remedyUrl: string;
  cyberarkUrl: string;
  fudoUser: string;
  fudoPass: string;
  theme: 'dark' | 'light';
  exportFormat: 'powershell' | 'python';
}

export type Page = 'dashboard' | 'scenarios' | 'workflow' | 'editor' | 'explorer' | 'events' | 'results' | 'settings' | 'welcome' | 'history';

export type { Connector, ConnectorAction, ActionParam, WorkflowStep, Workflow } from './workflow';
