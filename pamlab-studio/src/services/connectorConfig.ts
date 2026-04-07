import type { AppSettings } from '../types';

const baseVarMap: Record<string, string> = {
  ad: 'adBase',
  'azure-ad': 'entraBase',
  cyberark: 'cyberarkBase',
  fudo: 'fudoBase',
  matrix42: 'matrixBase',
  servicenow: 'snowBase',
  jira: 'jsmBase',
  remedy: 'remedyBase',
};

const settingsValueMap: Record<string, keyof AppSettings> = {
  ad: 'adUrl',
  'azure-ad': 'azureAdUrl',
  cyberark: 'cyberarkUrl',
  fudo: 'fudoUrl',
  matrix42: 'matrixUrl',
  servicenow: 'snowUrl',
  jira: 'jsmUrl',
  remedy: 'remedyUrl',
};

export function baseUrlVar(connectorId: string): string {
  return baseVarMap[connectorId] || 'baseUrl';
}

export function baseUrlValue(connectorId: string, settings: AppSettings): string {
  const key = settingsValueMap[connectorId];
  return key ? settings[key] : 'http://localhost:8443';
}

export function headersVar(connectorId: string): string {
  return `${connectorId}Headers`;
}

export function baseVarToConnectorId(varName: string): string | undefined {
  return Object.entries(baseVarMap).find(([, value]) => value === varName)?.[0];
}
