import { getAction } from '../data/connectors';
import type { Workflow, WorkflowStep } from '../types/workflow';
import { baseUrlVar, baseVarToConnectorId, headersVar } from './connectorConfig';

export interface SystemConfig {
  id: string;
  name: string;
  type:
    | 'fudo'
    | 'matrix42'
    | 'ad'
    | 'azure-ad'
    | 'servicenow'
    | 'jira'
    | 'remedy'
    | 'cyberark';
  baseUrl: string;
  auth: AuthConfig;
}

export type AuthConfig =
  | { method: 'api-token'; token: string }
  | { method: 'basic'; username: string; password: string }
  | { method: 'ldap-bind'; bindDN: string; password: string }
  | { method: 'oauth2'; clientId: string; clientSecret: string; tokenUrl: string }
  | { method: 'api-key'; headerName: string; apiKey: string };

const legacyAuthLinePatterns = [
  /^\$credentials\s*=/,
  /^\$pair\s*=/,
  /^\$bytes\s*=/,
  /^\$base64\s*=/,
  /^\$headers\s*=/,
];

function escapePs(value: string): string {
  return value.replace(/`/g, '``').replace(/"/g, '`"');
}

function buildHeaderValue(headerName: string, value: string): string {
  if (headerName.toLowerCase() === 'authorization' && value && !/^bearer\s+/i.test(value)) {
    return `Bearer ${value}`;
  }
  return value;
}

function baseAssignment(config: SystemConfig): string {
  return `$${baseUrlVar(config.id)} = "${escapePs(config.baseUrl)}"`;
}

function generateAuthBlock(config: SystemConfig): string[] {
  const id = config.id;
  const lines = [`# ${config.name} Authentication`];

  switch (config.auth.method) {
    case 'api-token':
      lines.push(
        `$${headersVar(id)} = @{ Authorization = "Bearer ${escapePs(config.auth.token)}" }`,
      );
      break;
    case 'basic': {
      const pair = `${config.auth.username}:${config.auth.password}`;
      lines.push(`$${id}Pair = "${escapePs(pair)}"`);
      lines.push(`$${id}Bytes = [System.Text.Encoding]::ASCII.GetBytes($${id}Pair)`);
      lines.push(
        `$${headersVar(id)} = @{ Authorization = "Basic $([System.Convert]::ToBase64String($${id}Bytes))" }`,
      );
      break;
    }
    case 'ldap-bind': {
      const pair = `${config.auth.bindDN}:${config.auth.password}`;
      lines.push(`$${id}BindDN = "${escapePs(config.auth.bindDN)}"`);
      lines.push(
        `$${id}Credential = New-Object System.Management.Automation.PSCredential($${id}BindDN, (ConvertTo-SecureString "${escapePs(config.auth.password)}" -AsPlainText -Force))`,
      );
      lines.push(`$${id}Pair = "${escapePs(pair)}"`);
      lines.push(`$${id}Bytes = [System.Text.Encoding]::ASCII.GetBytes($${id}Pair)`);
      lines.push(
        `$${headersVar(id)} = @{ Authorization = "Basic $([System.Convert]::ToBase64String($${id}Bytes))" }`,
      );
      break;
    }
    case 'oauth2':
      lines.push(
        `$${id}TokenBody = @{ grant_type = "client_credentials"; client_id = "${escapePs(config.auth.clientId)}"; client_secret = "${escapePs(config.auth.clientSecret)}" }`,
      );
      lines.push(
        `$${id}TokenResponse = Invoke-RestMethod -Uri "${escapePs(config.auth.tokenUrl)}" -Method POST -Body $${id}TokenBody`,
      );
      lines.push(
        `$${headersVar(id)} = @{ Authorization = "Bearer $($${id}TokenResponse.access_token)" }`,
      );
      break;
    case 'api-key':
      lines.push(
        `$${headersVar(id)} = @{ "${escapePs(config.auth.headerName)}" = "${escapePs(buildHeaderValue(config.auth.headerName, config.auth.apiKey))}" }`,
      );
      break;
  }

  return lines;
}

function replaceBaseAssignments(lines: string[], configs: SystemConfig[]): string[] {
  return lines.map((line) => {
    const config = configs.find((entry) =>
      line.trim().startsWith(`$${baseUrlVar(entry.id)} = `),
    );
    return config ? baseAssignment(config) : line;
  });
}

function replaceHeaderReference(line: string): string {
  if (!line.includes('Invoke-RestMethod') || !line.includes('-Headers $headers')) return line;
  const match = line.match(/\$([A-Za-z]+Base)\b/);
  if (!match) return line;
  const connectorId = baseVarToConnectorId(match[1]);
  return connectorId
    ? line.replace('-Headers $headers', `-Headers $${headersVar(connectorId)}`)
    : line;
}

function stripLegacyAuthLines(lines: string[]): string[] {
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === '# Authentication (adjust to your environment)') return false;
    return !legacyAuthLinePatterns.some((pattern) => pattern.test(trimmed));
  });
}

function buildAuthSection(configs: SystemConfig[]): string[] {
  const lines = ['# Authentication (production config)'];
  configs.forEach((config, index) => {
    if (index > 0) lines.push('');
    lines.push(...generateAuthBlock(config));
  });
  lines.push('');
  return lines;
}

function findAuthInsertIndex(lines: string[]): number {
  const errorHandlingIndex = lines.findIndex((line) => line.trim() === '# Error handling');
  if (errorHandlingIndex !== -1) return errorHandlingIndex;

  let lastBaseLine = -1;
  lines.forEach((line, index) => {
    if (/^\$\w+Base\s*=/.test(line.trim())) lastBaseLine = index;
  });

  return lastBaseLine === -1 ? 0 : lastBaseLine + 1;
}

function normalizeScriptWhitespace(script: string): string {
  return script.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function buildRequestBody(step: WorkflowStep, actionId: string): string[] {
  const bodyLines = Object.entries(step.params).flatMap(([key, value]) => {
    if (key === 'sAMAccountName' && actionId === 'ad-add-to-group') {
      return [`  members = @("${escapePs(value)}")`];
    }
    if (value === 'true' || value === 'false') {
      return [`  ${key} = $${value}`];
    }
    return [`  ${key} = "${escapePs(value)}"`];
  });

  if (bodyLines.length === 0) return [];
  return ['$body = @{', ...bodyLines, '} | ConvertTo-Json -Depth 10'];
}

function buildStepLines(step: WorkflowStep, index: number): string[] {
  const action = getAction(step.connectorId, step.actionId);
  if (!action) return [`# Step ${index + 1}: Unknown action`, ''];

  let path = action.path;
  const bodyParams: Record<string, string> = {};

  for (const param of action.params) {
    const value = step.params[param.id] || param.default || '';
    if (!value) continue;
    if (path.includes(`{${param.id}}`)) {
      path = path.replace(`{${param.id}}`, escapePs(value));
    } else {
      bodyParams[param.id] = value;
    }
  }

  const requestBody = buildRequestBody({ ...step, params: bodyParams }, action.id);
  const requestLine = [
    `$response = Invoke-RestMethod -Uri "$${baseUrlVar(step.connectorId)}${path}"`,
    `-Method ${action.method}`,
    `-Headers $${headersVar(step.connectorId)}`,
    requestBody.length > 0 ? '-ContentType "application/json" -Body $body' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    `# Step ${index + 1}: ${step.label || action.name}`,
    ...requestBody,
    requestLine,
    `Write-Host "Step ${index + 1} completed: $($response | ConvertTo-Json -Compress)"`,
    '',
  ];
}

export function generateProductionConfigTemplate(): SystemConfig[] {
  return [
    {
      id: 'fudo',
      name: 'Fudo PAM',
      type: 'fudo',
      baseUrl: 'https://fudo.company.com',
      auth: { method: 'api-token', token: '' },
    },
    {
      id: 'matrix42',
      name: 'Matrix42 ESM',
      type: 'matrix42',
      baseUrl: 'https://matrix42.company.com',
      auth: { method: 'api-key', headerName: 'Authorization', apiKey: '' },
    },
    {
      id: 'ad',
      name: 'Active Directory',
      type: 'ad',
      baseUrl: 'https://ad-gateway.company.com',
      auth: {
        method: 'ldap-bind',
        bindDN: 'CN=svc-pamlab,OU=Service Accounts,DC=company,DC=com',
        password: '',
      },
    },
    {
      id: 'azure-ad',
      name: 'Microsoft Entra ID',
      type: 'azure-ad',
      baseUrl: 'https://graph.microsoft.com',
      auth: {
        method: 'oauth2',
        clientId: '',
        clientSecret: '',
        tokenUrl: 'https://login.microsoftonline.com/contoso.onmicrosoft.com/oauth2/v2.0/token',
      },
    },
    {
      id: 'servicenow',
      name: 'ServiceNow',
      type: 'servicenow',
      baseUrl: 'https://company.service-now.com',
      auth: {
        method: 'oauth2',
        clientId: '',
        clientSecret: '',
        tokenUrl: 'https://company.service-now.com/oauth_token.do',
      },
    },
    {
      id: 'jira',
      name: 'Jira Service Mgmt',
      type: 'jira',
      baseUrl: 'https://company.atlassian.net',
      auth: { method: 'api-token', token: '' },
    },
    {
      id: 'remedy',
      name: 'BMC Remedy',
      type: 'remedy',
      baseUrl: 'https://remedy.company.com',
      auth: { method: 'basic', username: '', password: '' },
    },
    {
      id: 'cyberark',
      name: 'CyberArk PVWA',
      type: 'cyberark',
      baseUrl: 'https://cyberark.company.com',
      auth: { method: 'api-token', token: '' },
    },
  ];
}

export function convertScriptToProduction(script: string, configs: SystemConfig[]): string {
  const usedConfigs = configs.filter((config) => script.includes(`$${baseUrlVar(config.id)}`));
  const relevantConfigs = usedConfigs.length > 0 ? usedConfigs : configs;

  let lines = script.split('\n');
  lines = replaceBaseAssignments(lines, configs);
  lines = lines.map(replaceHeaderReference);
  lines = stripLegacyAuthLines(lines);

  const insertIndex = findAuthInsertIndex(lines);
  const authSection = buildAuthSection(relevantConfigs);
  lines = [...lines.slice(0, insertIndex), ...authSection, ...lines.slice(insertIndex)];

  return normalizeScriptWhitespace(lines.join('\n'));
}

export function generateProductionScript(workflow: Workflow, configs: SystemConfig[]): string {
  const relevantConfigs = configs.filter((config) =>
    workflow.steps.some((step) => step.connectorId === config.id),
  );
  const authConfigs = relevantConfigs.length > 0 ? relevantConfigs : configs;

  const lines: string[] = [
    '# PAMlab Studio - Production Script',
    `# Workflow: ${workflow.name}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Description: ${workflow.description}`,
    '',
    '#Requires -Version 5.1',
    'Set-StrictMode -Version Latest',
    '$ErrorActionPreference = "Stop"',
    '',
    '# Configuration',
  ];

  authConfigs.forEach((config) => lines.push(baseAssignment(config)));
  lines.push('');
  lines.push(...buildAuthSection(authConfigs));
  lines.push('# Workflow Steps');
  lines.push('');

  workflow.steps.forEach((step, index) => {
    lines.push(...buildStepLines(step, index));
  });

  lines.push('Write-Host "Workflow completed successfully!"');
  return normalizeScriptWhitespace(lines.join('\n'));
}

export function exportConfigAsJson(configs: SystemConfig[]): string {
  const safe = configs.map((config) => ({
    ...config,
    auth: {
      ...config.auth,
      ...('password' in config.auth ? { password: '***' } : {}),
      ...('token' in config.auth ? { token: '***' } : {}),
      ...('clientSecret' in config.auth ? { clientSecret: '***' } : {}),
      ...('apiKey' in config.auth ? { apiKey: '***' } : {}),
    },
  }));
  return JSON.stringify(safe, null, 2);
}

export function loadProductionConfig(): SystemConfig[] | null {
  const raw = localStorage.getItem('pamlab-production-config');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SystemConfig[];
  } catch {
    return null;
  }
}

export function saveProductionConfig(configs: SystemConfig[]): void {
  localStorage.setItem('pamlab-production-config', JSON.stringify(configs));
}
