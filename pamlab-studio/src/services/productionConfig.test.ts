import { describe, expect, it } from 'vitest';
import { convertScriptToProduction, generateProductionConfigTemplate } from './productionConfig';

describe('productionConfig', () => {
  it('replaces mock base urls and generic headers during production export', () => {
    const configs = generateProductionConfigTemplate().map((config) => {
      if (config.id === 'fudo') {
        return {
          ...config,
          baseUrl: 'https://fudo.example.com',
          auth: { method: 'api-token' as const, token: 'fudo-token' },
        };
      }
      if (config.id === 'ad') {
        return {
          ...config,
          baseUrl: 'https://ad.example.com',
          auth: { method: 'basic' as const, username: 'svc-ad', password: 'secret' },
        };
      }
      return config;
    });

    const script = [
      '# Configuration',
      '$adBase = "/api/ad"',
      '$fudoBase = "/api/fudo"',
      '',
      '# Authentication (adjust to your environment)',
      '$credentials = Get-Credential -Message "Enter service account credentials"',
      '$pair = "$($credentials.UserName):$($credentials.GetNetworkCredential().Password)"',
      '$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)',
      '$base64 = [System.Convert]::ToBase64String($bytes)',
      '$headers = @{ Authorization = "Basic $base64" }',
      '',
      '# Error handling',
      '$ErrorActionPreference = "Stop"',
      '',
      '$step1Result = Invoke-RestMethod -Uri "$adBase/api/users" -Method POST -Headers $headers',
      '$step2Result = Invoke-RestMethod -Uri "$fudoBase/api/v2/users" -Method GET -Headers $headers',
    ].join('\n');

    const result = convertScriptToProduction(script, configs);

    expect(result).toContain('$adBase = "https://ad.example.com"');
    expect(result).toContain('$fudoBase = "https://fudo.example.com"');
    expect(result).toContain('-Headers $adHeaders');
    expect(result).toContain('-Headers $fudoHeaders');
    expect(result).toContain('$adHeaders = @{ Authorization = "Basic $([System.Convert]::ToBase64String($adBytes))" }');
    expect(result).toContain('$fudoHeaders = @{ Authorization = "Bearer fudo-token" }');
    expect(result).not.toContain('$headers = @{ Authorization = "Basic $base64" }');
    expect(result).not.toContain('$credentials = Get-Credential');
  });
});
