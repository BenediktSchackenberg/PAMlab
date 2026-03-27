const store = {
  tokens: [],
  tables: {
    incident: [],
    change_request: [],
    sc_request: [],
    sc_req_item: [],
    cmdb_ci_server: [],
    sys_user: [],
    sys_user_group: [],
    cmdb_rel_ci: [],
    sys_user_grmember: [],
  },
  webhooks: [],
  defaultToken: process.env.DEFAULT_API_TOKEN || 'pamlab-dev-token',
};

store.tokens.push({ token: store.defaultToken, user: 'admin', created: new Date().toISOString() });

module.exports = store;
