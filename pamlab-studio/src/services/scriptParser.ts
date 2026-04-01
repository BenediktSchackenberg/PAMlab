import type { ApiCall } from '../types';
import { getSettings } from './api';

/**
 * Simplified PowerShell Invoke-RestMethod parser.
 * Handles multi-line @{ } hashtables, variable substitution, and string interpolation.
 */
export function parseScript(script: string): ApiCall[] {
  const settings = getSettings();
  const calls: ApiCall[] = [];
  const lines = script.split('\n');

  // Variable substitution map for base URLs
  const baseVars: Record<string, string> = {
    matrixBase: settings.matrixUrl,
    fudoBase: settings.fudoUrl,
    adBase: settings.adUrl,
    snowBase: settings.snowUrl,
    jsmBase: settings.jsmUrl,
    remedyBase: settings.remedyUrl,
    cyberarkBase: settings.cyberarkUrl,
  };

  // Substitute $varName in a string
  function subst(s: string): string {
    return s.replace(/\$(\w+)/g, (_, name) => baseVars[name] || `$${name}`);
  }

  // Collect variable assignments (multi-line hashtable support)
  const vars: Record<string, Record<string, string>> = {};
  // Also track simple string assignments
  const stringVars: Record<string, string> = {};
  let currentVar: string | null = null;
  let currentBlock: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and blank lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Start of multi-line hashtable: $var = @{
    const startMatch = trimmed.match(/^\$(\w+)\s*=\s*@\{\s*$/);
    if (startMatch) {
      currentVar = startMatch[1];
      currentBlock = [];
      continue;
    }

    // Inside a hashtable block
    if (currentVar !== null) {
      if (trimmed === '}') {
        vars[currentVar] = parseHashtable(currentBlock);
        currentVar = null;
        currentBlock = [];
      } else {
        currentBlock.push(trimmed);
      }
      continue;
    }

    // Single-line hashtable: $var = @{ key = "val"; key2 = "val2" }
    const singleMatch = trimmed.match(/^\$(\w+)\s*=\s*@\{(.+)\}\s*$/);
    if (singleMatch) {
      vars[singleMatch[1]] = parseHashtable(singleMatch[2].split(';').map(s => s.trim()));
      continue;
    }

    // Simple string variable: $var = "value" or $var = 'value'
    const strMatch = trimmed.match(/^\$(\w+)\s*=\s*["']([^"']*)["']\s*$/);
    if (strMatch) {
      stringVars[strMatch[1]] = strMatch[2];
      baseVars[strMatch[1]] = strMatch[2]; // also add to base vars for substitution
      continue;
    }

    // Array assignment: $var = @("val1") — store as array-like hashtable
    const arrMatch = trimmed.match(/^\$(\w+)\s*=\s*@\((.+)\)\s*$/);
    if (arrMatch) {
      const items = arrMatch[2].match(/["']([^"']+)["']/g)?.map(s => s.replace(/["']/g, '')) || [];
      vars[arrMatch[1]] = { members: JSON.stringify(items) };
      continue;
    }

    // Look for Invoke-RestMethod
    if (!trimmed.includes('Invoke-RestMethod')) continue;

    let method = 'GET';
    let url = '';
    let body: unknown = undefined;

    // Join continuation lines (`) — not needed for single-line but good practice
    const fullLine = trimmed;

    // Extract -Method
    const methodMatch = fullLine.match(/-Method\s+(\w+)/i);
    if (methodMatch) method = methodMatch[1].toUpperCase();

    // Extract -Uri — handle both quoted and unquoted, with variable substitution
    const uriMatch = fullLine.match(/-Uri\s+"([^"]+)"/i) ||
                     fullLine.match(/-Uri\s+'([^']+)'/i) ||
                     fullLine.match(/-Uri\s+(\S+?)(?:\s+-|$)/i);
    if (uriMatch) {
      url = subst(uriMatch[1]);
    }

    // Extract -Body with variable reference: ($var | ConvertTo-Json) or just $var
    const bodyMatch = fullLine.match(/-Body\s+\(?\$(\w+)/i);
    if (bodyMatch && vars[bodyMatch[1]]) {
      body = vars[bodyMatch[1]];
    }
    // Inline JSON body: -Body '{"key":"val"}'
    const inlineBody = fullLine.match(/-Body\s+'(\{[^']+\})'/i);
    if (inlineBody) {
      try { body = JSON.parse(inlineBody[1]); } catch { /* skip */ }
    }

    if (url) {
      calls.push({ method, url, body: body || undefined });
    }
  }

  return calls;
}

/**
 * Parse PowerShell hashtable lines into a JS object.
 * Handles: key = "value", key = 'value', key = value, key = @("item")
 */
function parseHashtable(lines: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    // Match PowerShell boolean: key = $true / $false
    const boolM = line.match(/^(\w+)\s*=\s*\$(\w+)\s*;?\s*$/);
    if (boolM) {
      result[boolM[1]] = boolM[2] === 'true' ? 'true' : 'false';
      continue;
    }
    // Match: key = "value" or key = 'value' or key = value
    const m = line.match(/^(\w+)\s*=\s*["']?([^"'\n;]*)["']?\s*;?\s*$/);
    if (m) {
      result[m[1]] = m[2].trim();
    }
    // Match: key = @("item1", "item2")
    const arrM = line.match(/^(\w+)\s*=\s*@\((.+)\)\s*;?\s*$/);
    if (arrM) {
      const items = arrM[2].match(/["']([^"']+)["']/g)?.map(s => s.replace(/["']/g, '')) || [];
      result[arrM[1]] = JSON.stringify(items);
    }
  }
  return result;
}
