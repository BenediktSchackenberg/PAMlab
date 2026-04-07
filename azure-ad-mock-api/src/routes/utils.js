const { v4: uuidv4 } = require('uuid');

function omitSecrets(resource) {
  if (!resource || typeof resource !== 'object') return resource;
  const clone = JSON.parse(JSON.stringify(resource));
  delete clone.mockPassword;
  delete clone.mockClientSecret;
  return clone;
}

function graphCollection(context, value) {
  return {
    '@odata.context': `https://graph.microsoft.com/v1.0/$metadata#${context}`,
    value,
  };
}

function applySearch(items, query, fields) {
  const term = query?.$search || query?.search || query?.q;
  if (!term) return items;

  const needle = String(term).toLowerCase();
  return items.filter((item) =>
    fields.some((field) => String(item[field] || '').toLowerCase().includes(needle)),
  );
}

function applyTop(items, query) {
  const top = Number.parseInt(query?.$top || query?.top, 10);
  if (!Number.isFinite(top) || top <= 0) return items;
  return items.slice(0, top);
}

function extractMemberIds(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.members)) return body.members.map(String);
  if (body.memberId) return [String(body.memberId)];
  if (body.id) return [String(body.id)];
  if (body['@odata.id']) {
    const parts = String(body['@odata.id']).split('/');
    return parts.length > 0 ? [parts[parts.length - 1]] : [];
  }
  return [];
}

function createRoleAssignment({ principal, role, directoryScopeId }) {
  return {
    id: uuidv4(),
    principalId: principal.id,
    principalDisplayName: principal.displayName,
    roleDefinitionId: role.id,
    roleDefinitionDisplayName: role.displayName,
    directoryScopeId: directoryScopeId || '/',
    assignmentType: 'Activated',
    createdDateTime: new Date().toISOString(),
  };
}

module.exports = {
  omitSecrets,
  graphCollection,
  applySearch,
  applyTop,
  extractMemberIds,
  createRoleAssignment,
};
