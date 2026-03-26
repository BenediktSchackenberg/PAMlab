// In-memory data store - initialized from seed data
const seed = require('./seed');

const store = {
  users: [...seed.users],
  servers: [...seed.servers],
  accounts: [...seed.accounts],
  safes: [...seed.safes],
  safeUsers: [...seed.safeUsers],
  safeAccounts: [...seed.safeAccounts],
  accountManagers: [...seed.accountManagers],
  listeners: [...seed.listeners],
  pools: [...seed.pools],
  sessions: [...seed.sessions],
  authMethods: [...seed.authMethods],
  groups: [...seed.groups],
  groupUsers: [...seed.groupUsers],
  groupSafes: [...seed.groupSafes],
  userDirectoryConfig: { ...seed.userDirectoryConfig },
  events: [...seed.events],
  passwordPolicies: [...seed.passwordPolicies],
  accessRequests: [...seed.accessRequests],
  webhooks: [...seed.webhooks],
  passwordRotationHistory: [...seed.passwordRotationHistory],
  tokens: new Map(), // token -> { user_id, login, created_at }
};

module.exports = store;
