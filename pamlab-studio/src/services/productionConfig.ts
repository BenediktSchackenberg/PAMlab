import type { Workflow } from '../types/workflow';

export interface SystemConfig {
  id: string;
  name: string;
  type: 'fudo' | 'matrix42' | 'ad' | 'azure-ad' | 'servicenow' | 'jira' | 'remedy';
  baseUrl: string;
  auth: AuthConfig;
}

export type AuthConfig =
  | { method: 'api-token'; token: string }
  | { method: 'basic'; username: string; password: string }
  | { method: 'ldap-bind'; bindDN: string; password: string }
  | { method: 'oauth2'; clientId: string; clientSecret: string; tokenUrl: string }
  | { method: 'api-key'; headerName: string; apiKey: string };

export function generateProductionConfigTemplate(): SystemConfig[] {
  return [
    { id: 'fudo', name: 'Fudo PAM', type: 'fudo', baseUrl: 'https://fudo.company.com', auth: { method: 'api-token', token: '' } },
    { id: 'matrix42', name: 'Matrix42 ESM', type: 'matrix42', baseUrl: 'https://matrix42.company.com', auth: { method: 'api-key', headerName: 'Authorization', apiKey: '' } },
    { id: 'ad', name: 'Active Directory', type: 'ad', baseUrl: 'ldap://dc01.company.com', auth: { method: 'ldap-bind', bindDN: 'CN=svc-pamlab,OU=Service Accounts,DC=company,DC=com', password: '' } },
    { id: 'azure-ad', name: 'Microsoft Entra ID', type: 'azure-ad', baseUrl: 'https://graph.microsoft.com', auth: { method: 'oauth2', clientId: '', clientSecret: '', tokenUrl: 'https://login.microsoftonline.com/contoso.onmicrosoft.com/oauth2/v2.0/token' } },
    { id: 'servicenow', name: 'ServiceNow', type: 'servicenow', baseUrl: 'https://company.service-now.com', auth: { method: 'oauth2', clientId: '', clientSecret: '', tokenUrl: 'https://company.service-now.com/oauth_token.do' } },
    { id: 'jira', name: 'Jira Service Mgmt', type: 'jira', baseUrl: 'https://company.atlassian.net', auth: { method: 'api-token', token: '' } },
    { id: 'remedy', name: 'BMC Remedy', type: 'remedy', baseUrl: 'https://remedy.company.com', auth: { method: 'basic', username: '', password: '' } },
  ];
}

function generateAuthBlock(config: SystemConfig): string {
  switch (config.auth.method) {
    case 'api-token':
      return `# ${config.name} Authentication\n$${config.id}Headers = @{ Authorization = "Bearer ${config.auth.token}" }`;
    case 'basic': {
      const pair = `${config.auth.username}:${config.auth.password}`;
      return `# ${config.name} Authentication\n$pair = "${pair}"\n$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)\n$base64 = [System.Convert]::ToBase64String($bytes)\n$${config.id}Headers = @{ Authorization = "Basic $base64" }`;
    }
    case 'ldap-bind':
      return `# ${config.name} Authentication (LDAP Bind)\n$adCredential = New-Object System.Management.Automation.PSCredential("${config.auth.bindDN}", (ConvertTo-SecureString "${config.auth.password}" -AsPlainText -Force))`;
    case 'oauth2':
      return `# ${config.name} Authentication (OAuth2)\n$tokenBody = @{ grant_type = "client_credentials"; client_id = "${config.auth.clientId}"; client_secret = "${config.auth.clientSecret}" }\n$tokenResponse = Invoke-RestMethod -Uri "${config.auth.tokenUrl}" -Method POST -Body $tokenBody\n$${config.id}Headers = @{ Authorization = "Bearer $($tokenResponse.access_token)" }`;
    case 'api-key':
      return `# ${config.name} Authentication\n$${config.id}Headers = @{ "${config.auth.headerName}" = "Bearer ${config.auth.apiKey}" }`;
  }
}

export function generateProductionScript(workflow: Workflow, configs: SystemConfig[]): string {
  const lines: string[] = [
    `# PAMlab Studio - Production Script`,
    `# Workflow: ${workflow.name}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Description: ${workflow.description}`,
    ``,
    `#Requires -Version 5.1`,
    `Set-StrictMode -Version Latest`,
    `$ErrorActionPreference = "Stop"`,
    ``,
    `# ── Authentication ─────────────────────────────────────────────`,
  ];

  // Determine which systems are used in workflow
  const usedSystems = new Set(workflow.steps.map(s => s.connectorId));
  const relevantConfigs = configs.filter(c => usedSystems.has(c.id));

  // If no specific match, include all
  const authConfigs = relevantConfigs.length > 0 ? relevantConfigs : configs;

  for (const config of authConfigs) {
    lines.push('');
    lines.push(generateAuthBlock(config));
  }

  lines.push('');
  lines.push('# ── Workflow Steps ──────────────────────────────────────────────');
  lines.push('');

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const config = configs.find(c => c.id === step.connectorId);
    const baseUrl = config?.baseUrl || 'https://localhost';
    const headersVar = `$${step.connectorId}Headers`;

    lines.push(`# Step ${i + 1}: ${step.label || step.actionId}`);

    const params = Object.entries(step.params)
      .map(([k, v]) => `  ${k} = "${v}"`)
      .join('\n');

    if (params) {
      lines.push(`$body${i + 1} = @{`);
      lines.push(params);
      lines.push(`} | ConvertTo-Json -Depth 10`);
    }

    lines.push(`$response${i + 1} = Invoke-RestMethod -Uri "${baseUrl}${step.actionId}" -Method POST -Headers ${headersVar} -ContentType "application/json"${params ? ` -Body $body${i + 1}` : ''}`);
    lines.push(`Write-Host "Step ${i + 1} completed: $($response${i + 1} | ConvertTo-Json -Compress)"`);
    lines.push('');
  }

  lines.push('Write-Host "Workflow completed successfully!"');
  return lines.join('\n');
}

export function exportConfigAsJson(configs: SystemConfig[]): string {
  const safe = configs.map(c => ({
    ...c,
    auth: {
      ...c.auth,
      ...(('password' in c.auth) ? { password: '***' } : {}),
      ...(('token' in c.auth) ? { token: '***' } : {}),
      ...(('clientSecret' in c.auth) ? { clientSecret: '***' } : {}),
      ...(('apiKey' in c.auth) ? { apiKey: '***' } : {}),
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
