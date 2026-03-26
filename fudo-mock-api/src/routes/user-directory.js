const { Router } = require('express');
const db = require('../data/store');

const router = Router();

router.get('/config', (req, res) => {
  // Return config without sensitive bind password
  const { ...config } = db.userDirectoryConfig;
  res.json(config);
});

router.put('/config', (req, res) => {
  const allowed = ['host', 'port', 'use_ssl', 'base_dn', 'bind_dn', 'sync_interval_minutes', 'sync_groups', 'group_base_dn', 'user_base_dn'];
  const body = req.body || {};
  for (const key of allowed) {
    if (body[key] !== undefined) db.userDirectoryConfig[key] = body[key];
  }
  res.json(db.userDirectoryConfig);
});

router.post('/sync', (req, res) => {
  // Simulate sync
  const summary = {
    users_added: Math.floor(Math.random() * 3),
    users_updated: Math.floor(Math.random() * 5),
    users_removed: 0,
    groups_synced: db.groups.length,
  };
  db.userDirectoryConfig.last_sync = new Date().toISOString();
  db.userDirectoryConfig.last_sync_status = 'success';
  db.userDirectoryConfig.last_sync_summary = summary;
  res.json({ status: 'success', sync_completed_at: db.userDirectoryConfig.last_sync, summary });
});

router.get('/status', (req, res) => {
  res.json({
    last_sync: db.userDirectoryConfig.last_sync,
    last_sync_status: db.userDirectoryConfig.last_sync_status,
    last_sync_summary: db.userDirectoryConfig.last_sync_summary,
    next_sync: new Date(new Date(db.userDirectoryConfig.last_sync).getTime() + db.userDirectoryConfig.sync_interval_minutes * 60000).toISOString(),
  });
});

router.get('/preview', (req, res) => {
  // Simulate preview of what sync would do
  res.json({
    preview: true,
    changes: {
      users_to_add: [{ login: 'new.user', name: 'New Corporate User', email: 'new.user@corp.local', source_dn: 'CN=New User,OU=Users,DC=corp,DC=local' }],
      users_to_update: [{ login: 'j.doe', field: 'email', old_value: 'john.doe@corp.local', new_value: 'j.doe@corp.local' }],
      users_to_remove: [],
      groups_to_sync: db.groups.filter(g => g.ad_group_dn).map(g => ({ name: g.name, ad_group_dn: g.ad_group_dn, member_count: db.groupUsers.filter(gu => gu.group_id === g.id).length })),
    },
  });
});

module.exports = router;
