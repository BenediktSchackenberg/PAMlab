import type { Workflow } from '../types';

// ── Stable Fudo IDs (match fudo-mock-api/src/data/seed.js) ─────────
const FUDO = {
  groups: { rdpAdmins: '70000000-0000-0000-0000-000000000001', dbOperators: '70000000-0000-0000-0000-000000000002', integrationServices: '70000000-0000-0000-0000-000000000003' },
  safes: { itAdmin: '40000000-0000-0000-0000-000000000001', appAccess: '40000000-0000-0000-0000-000000000002', fileAccess: '40000000-0000-0000-0000-000000000003', webServers: '40000000-0000-0000-0000-000000000004' },
  listeners: { ssh: '50000000-0000-0000-0000-000000000001', rdp: '50000000-0000-0000-0000-000000000002' },
  users: { jdoe: '10000000-0000-0000-0000-000000000003', asmith: '10000000-0000-0000-0000-000000000004' },
};

/**
 * Pre-built workflow templates that demonstrate real-world PAM scenarios.
 * All templates use real mock data so "Run" works out of the box.
 */
export const workflowTemplates: Workflow[] = [
  // ── Template 1: Full Onboarding ──────────────────────────────────
  {
    name: 'Employee Onboarding (Full)',
    description: 'Complete onboarding: Matrix42 ticket → AD user + groups → Fudo PAM user + access policy → close ticket. Uses realistic test data.',
    trigger: 'matrix42-ticket',
    steps: [
      {
        id: 'tpl-on-1',
        connectorId: 'matrix42',
        actionId: 'm42-create-ticket',
        label: 'Create Onboarding Ticket',
        params: {
          title: 'Onboarding: Sarah Connor',
          description: 'New hire in Engineering — needs VPN, RDP access to dev servers, and ERP application access.',
          priority: 'high',
          category: 'onboarding',
        },
      },
      {
        id: 'tpl-on-2',
        connectorId: 'ad',
        actionId: 'ad-create-user',
        label: 'Create AD User',
        params: {
          sAMAccountName: 's.connor',
          cn: 'Sarah Connor',
          givenName: 'Sarah',
          sn: 'Connor',
          department: 'Engineering',
          title: 'DevOps Engineer',
          ou: 'OU=Engineering,OU=Users',
        },
      },
      {
        id: 'tpl-on-3',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to VPN Group',
        params: {
          groupName: 'GRP-VPN-Users',
          sAMAccountName: 's.connor',
        },
      },
      {
        id: 'tpl-on-4',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to RDP Admins Group',
        params: {
          groupName: 'GRP-RDP-Admins',
          sAMAccountName: 's.connor',
        },
      },
      {
        id: 'tpl-on-5',
        connectorId: 'fudo',
        actionId: 'fudo-create-user',
        label: 'Create Fudo PAM User',
        params: {
          login: 's.connor',
          name: 'Sarah Connor',
          email: 's.connor@corp.local',
          role: 'user',
        },
      },
      {
        id: 'tpl-on-6',
        connectorId: 'fudo',
        actionId: 'fudo-add-to-group',
        label: 'Assign Fudo Group (→ IT-Admin Safe)',
        params: {
          groupId: FUDO.groups.rdpAdmins,
          user_id: 'FROM_STEP_5',  // In production: $step5Result.id
        },
      },
      {
        id: 'tpl-on-7',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Access Policy',
        params: {
          name: 'Sarah Connor — IT-Administration Access',
          group_id: FUDO.groups.rdpAdmins,
          safe_id: FUDO.safes.itAdmin,
          listener_id: FUDO.listeners.rdp,
          max_duration_hours: '8',
          require_approval: 'false',
        },
      },
      {
        id: 'tpl-on-8',
        connectorId: 'matrix42',
        actionId: 'm42-update-ticket',
        label: 'Close Onboarding Ticket',
        params: {
          ticketId: 'FROM_STEP_1',  // In production: $step1Result.ID
          status: 'Resolved',
        },
      },
    ],
  },

  // ── Template 2: Temporary Server Access ──────────────────────────
  {
    name: 'Temporary Server Access',
    description: 'Grant time-limited RDP access to a specific server. Creates Fudo access policy with 4h duration and manager approval.',
    trigger: 'matrix42-ticket',
    steps: [
      {
        id: 'tpl-ta-1',
        connectorId: 'matrix42',
        actionId: 'm42-create-ticket',
        label: 'Create Access Request Ticket',
        params: {
          title: 'Temp Access: j.doe → dc01.corp.local (RDP, 4h)',
          description: 'John Doe needs temporary RDP access to DC01 for Active Directory troubleshooting. Approved by CTO.',
          priority: 'medium',
          category: 'access-request',
        },
      },
      {
        id: 'tpl-ta-2',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to RDP Admins (Temporary)',
        params: {
          groupName: 'GRP-RDP-Admins',
          sAMAccountName: 'j.doe',
        },
      },
      {
        id: 'tpl-ta-3',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Time-Limited Access Policy (4h)',
        params: {
          name: 'Temp: j.doe → IT-Administration (4h)',
          group_id: FUDO.groups.rdpAdmins,
          safe_id: FUDO.safes.itAdmin,
          listener_id: FUDO.listeners.rdp,
          max_duration_hours: '4',
          require_approval: 'true',
        },
      },
      {
        id: 'tpl-ta-4',
        connectorId: 'matrix42',
        actionId: 'm42-update-ticket',
        label: 'Resolve Ticket',
        params: {
          ticketId: 'FROM_STEP_1',  // In production: $step1Result.ID
          status: 'Resolved',
        },
      },
    ],
  },

  // ── Template 3: Employee Offboarding ─────────────────────────────
  {
    name: 'Employee Offboarding',
    description: 'Full offboarding for Lisa Leaving: remove from groups, block Fudo user, disable AD account, create confirmation incident.',
    trigger: 'servicenow-request',
    steps: [
      {
        id: 'tpl-off-1',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from VPN Group',
        params: {
          groupName: 'GRP-VPN-Users',
          sAMAccountName: 'l.leaving',
        },
      },
      {
        id: 'tpl-off-2',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from DB Operators Group',
        params: {
          groupName: 'GRP-DB-Operators',
          sAMAccountName: 'l.leaving',
        },
      },
      {
        id: 'tpl-off-3',
        connectorId: 'fudo',
        actionId: 'fudo-block-user',
        label: 'Block Fudo PAM User',
        params: {
          userId: FUDO.users.asmith,
        },
      },
      {
        id: 'tpl-off-4',
        connectorId: 'ad',
        actionId: 'ad-disable-user',
        label: 'Disable AD Account',
        params: {
          sAMAccountName: 'l.leaving',
        },
      },
      {
        id: 'tpl-off-5',
        connectorId: 'servicenow',
        actionId: 'snow-create-incident',
        label: 'Create Offboarding Confirmation',
        params: {
          short_description: 'Offboarding completed: Lisa Leaving',
          description: 'All access revoked for l.leaving. AD disabled, Fudo blocked, groups removed.',
          urgency: '3',
          category: 'Access',
        },
      },
    ],
  },

  // ── Template 4: Emergency Access Revocation ──────────────────────
  {
    name: 'Emergency Access Revocation',
    description: 'SECURITY: Immediately block compromised account (j.doe). Fudo block + AD disable + group removal + incident.',
    trigger: 'manual',
    steps: [
      {
        id: 'tpl-em-1',
        connectorId: 'fudo',
        actionId: 'fudo-block-user',
        label: '🚨 BLOCK Fudo PAM (immediate)',
        params: {
          userId: FUDO.users.jdoe,
        },
      },
      {
        id: 'tpl-em-2',
        connectorId: 'ad',
        actionId: 'ad-disable-user',
        label: '🚨 DISABLE AD Account',
        params: {
          sAMAccountName: 'j.doe',
        },
      },
      {
        id: 'tpl-em-3',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from DB Operators',
        params: {
          groupName: 'GRP-DB-Operators',
          sAMAccountName: 'j.doe',
        },
      },
      {
        id: 'tpl-em-4',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from VPN Group',
        params: {
          groupName: 'GRP-VPN-Users',
          sAMAccountName: 'j.doe',
        },
      },
      {
        id: 'tpl-em-5',
        connectorId: 'servicenow',
        actionId: 'snow-create-incident',
        label: 'Create Security Incident',
        params: {
          short_description: 'SECURITY: Emergency access revocation — j.doe (John Doe)',
          description: 'Account j.doe compromised. All access revoked: Fudo blocked, AD disabled, groups removed. Reason: Suspicious login from unknown IP.',
          urgency: '1',
          category: 'Security',
        },
      },
    ],
  },

  // ── Template 5: Project Team Access ──────────────────────────────
  {
    name: 'Project Team Access Setup',
    description: 'Grant project team member (Tom Developer) access to web servers + read-only DB. Time-boxed policies via Fudo.',
    trigger: 'jira-request',
    steps: [
      {
        id: 'tpl-proj-1',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to DB Operators Group',
        params: {
          groupName: 'GRP-DB-Operators',
          sAMAccountName: 't.developer',
        },
      },
      {
        id: 'tpl-proj-2',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Web Server Access Policy (SSH, 4h)',
        params: {
          name: 'Project Phoenix — Web Servers (t.developer)',
          group_id: FUDO.groups.dbOperators,
          safe_id: FUDO.safes.webServers,
          listener_id: FUDO.listeners.ssh,
          max_duration_hours: '4',
          require_approval: 'false',
        },
      },
      {
        id: 'tpl-proj-3',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create DB Access Policy (SSH, 2h, Approval)',
        params: {
          name: 'Project Phoenix — DB read-only (t.developer)',
          group_id: FUDO.groups.dbOperators,
          safe_id: FUDO.safes.appAccess,
          listener_id: FUDO.listeners.ssh,
          max_duration_hours: '2',
          require_approval: 'true',
        },
      },
      {
        id: 'tpl-proj-4',
        connectorId: 'jira',
        actionId: 'jira-create-issue',
        label: 'Create Jira Tracking Issue',
        params: {
          summary: 'Access provisioned: t.developer → Project Phoenix servers',
          description: 'Web server SSH access (4h) + DB read-only SSH access (2h, requires approval). Auto-provisioned via PAMlab.',
          issuetype: 'Task',
          priority: 'Medium',
        },
      },
    ],
  },
  {
    name: 'Entra PIM Activation',
    description: 'Activate a Microsoft Entra PIM role for Bob Wilson, revoke stale sessions, and log the change in ServiceNow.',
    trigger: 'manual',
    steps: [
      {
        id: 'tpl-entra-1',
        connectorId: 'azure-ad',
        actionId: 'entra-activate-pim',
        label: 'Activate Privileged Role',
        params: {
          principalId: '20000000-0000-0000-0000-000000000004',
          roleDefinitionId: 'e8611ab8-c189-46e8-94e1-60213ab1f814',
          justification: 'Emergency admin access for PAM maintenance',
        },
      },
      {
        id: 'tpl-entra-2',
        connectorId: 'azure-ad',
        actionId: 'entra-revoke-sessions',
        label: 'Revoke Existing Sessions',
        params: {
          id: 'b.wilson@corp.local',
        },
      },
      {
        id: 'tpl-entra-3',
        connectorId: 'servicenow',
        actionId: 'snow-create-change',
        label: 'Log Change Request',
        params: {
          short_description: 'Entra PIM activation for Bob Wilson',
          type: 'normal',
          risk: 'moderate',
        },
      },
    ],
  },
];
