import type { ApiCall } from '../types';

/**
 * Cross-step reference resolver.
 * After each step execution, extracts IDs from the response and resolves
 * FROM_STEP_X references in subsequent steps' URLs and body params.
 * 
 * Supported patterns:
 * - FROM_STEP_1, FROM_STEP_2, etc. in body values and URL path segments
 * - Automatically extracts: id, ID, sys_id, user_id, TicketNumber, key
 */

export interface StepResults {
  [stepNumber: number]: {
    id: string | null;       // Primary ID from response
    secondaryIds: Record<string, string>;  // All extracted IDs
  };
}

/** Extract IDs from an API response */
export function extractIds(responseBody: unknown): { id: string | null; secondaryIds: Record<string, string> } {
  const secondaryIds: Record<string, string> = {};
  let id: string | null = null;

  if (!responseBody || typeof responseBody !== 'object') return { id, secondaryIds };

  const data = responseBody as Record<string, unknown>;

  // Direct ID fields
  const idFields = ['id', 'ID', 'sys_id', 'key', 'TicketNumber', 'user_id'];
  for (const field of idFields) {
    if (data[field] && typeof data[field] === 'string') {
      secondaryIds[field] = data[field] as string;
      if (!id) id = data[field] as string;
    }
  }

  // ServiceNow wraps in { result: { sys_id: ... } }
  if (data.result && typeof data.result === 'object') {
    const result = data.result as Record<string, unknown>;
    for (const field of idFields) {
      if (result[field] && typeof result[field] === 'string') {
        secondaryIds[field] = result[field] as string;
        if (!id) id = result[field] as string;
      }
    }
  }

  // Jira wraps differently: { key: "ITSM-1" }
  if (data.key && typeof data.key === 'string') {
    secondaryIds.key = data.key as string;
    if (!id) id = data.key as string;
  }

  return { id, secondaryIds };
}

/** Resolve FROM_STEP_X references in a URL string */
function resolveUrl(url: string, results: StepResults): string {
  return url.replace(/FROM_STEP_(\d+)/g, (match, stepNum) => {
    const step = results[parseInt(stepNum)];
    return step?.id || match;
  });
}

/** Resolve FROM_STEP_X references in a body object (deep) */
function resolveBody(body: unknown, results: StepResults): unknown {
  if (!body) return body;

  if (typeof body === 'string') {
    return body.replace(/FROM_STEP_(\d+)/g, (match, stepNum) => {
      const step = results[parseInt(stepNum)];
      return step?.id || match;
    });
  }

  if (Array.isArray(body)) {
    return body.map(item => resolveBody(item, results));
  }

  if (typeof body === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      resolved[key] = resolveBody(value, results);
    }
    return resolved;
  }

  return body;
}

/** Resolve all FROM_STEP_X references in an API call */
export function resolveStepReferences(call: ApiCall, results: StepResults): ApiCall {
  return {
    ...call,
    url: resolveUrl(call.url, results),
    body: resolveBody(call.body, results),
  };
}
