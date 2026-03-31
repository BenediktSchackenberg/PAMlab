const seed = require('./seed');

const store = {
  platforms: [...seed.platforms],
  safes: [...seed.safes],
  safeMembers: [...seed.safeMembers],
  accounts: [...seed.accounts],
  users: [...seed.users],
  groups: seed.groups.map(g => ({ ...g, members: [...g.members] })),
  psmSessions: [...seed.psmSessions],
  systemHealth: [...seed.systemHealth],
  tokens: new Map(), // token -> { userId, username, created_at }
};

module.exports = store;
