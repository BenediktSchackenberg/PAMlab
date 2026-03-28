import type { Workflow } from '../types';

/**
 * Pre-built workflow templates that demonstrate real-world PAM scenarios.
 * Users can load these, customize parameters, and generate scripts.
 */
export const workflowTemplates: Workflow[] = [
  // ── Template 1: Full Onboarding (Matrix42 → AD → Fudo) ──────────
  {
    name: 'Employee Onboarding (Full)',
    description: 'Matrix42 ticket triggers AD user creation, group assignment, Fudo PAM user + access policy. Complete automated provisioning.',
    trigger: 'matrix42-ticket',
    steps: [
      {
        id: 'tpl-on-1',
        connectorId: 'matrix42',
        actionId: 'm42-create-ticket',
        label: 'Create Onboarding Ticket',
        params: {
          title: 'Onboarding: {{employee_name}}',
          description: 'Automated onboarding for new employee in {{department}}',
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
          sAMAccountName: '{{username}}',
          cn: '{{employee_name}}',
          givenName: '{{first_name}}',
          sn: '{{last_name}}',
          department: '{{department}}',
          title: '{{job_title}}',
          ou: 'OU={{department}},OU=Users',
        },
      },
      {
        id: 'tpl-on-3',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to VPN Group',
        params: {
          groupName: 'GRP-VPN-Users',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-on-4',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to Server Access Group',
        params: {
          groupName: '{{server_access_group}}',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-on-5',
        connectorId: 'fudo',
        actionId: 'fudo-create-user',
        label: 'Create Fudo PAM User',
        params: {
          login: '{{username}}',
          name: '{{employee_name}}',
          email: '{{username}}@corp.local',
          role: 'user',
        },
      },
      {
        id: 'tpl-on-6',
        connectorId: 'fudo',
        actionId: 'fudo-add-to-group',
        label: 'Assign Fudo Group (→ Safe)',
        params: {
          groupId: '{{fudo_group}}',
          user_id: '{{fudo_user_id}}',
        },
      },
      {
        id: 'tpl-on-7',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Access Policy',
        params: {
          name: '{{employee_name}} - {{safe_name}} Access',
          group_id: '{{fudo_group}}',
          safe_id: '{{safe_name}}',
          listener_id: 'rdp',
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
          ticketId: '{{ticket_id}}',
          status: 'Resolved',
        },
      },
    ],
  },

  // ── Template 2: Temporary Server Access ──────────────────────────
  {
    name: 'Temporary Server Access',
    description: 'Grant time-limited RDP/SSH access to a specific server. Automatically creates Fudo access policy with duration and closes ticket after provisioning.',
    trigger: 'matrix42-ticket',
    steps: [
      {
        id: 'tpl-ta-1',
        connectorId: 'matrix42',
        actionId: 'm42-create-ticket',
        label: 'Create Access Request Ticket',
        params: {
          title: 'Temp Access: {{username}} → {{server_name}}',
          description: '{{justification}}',
          priority: 'medium',
          category: 'access-request',
        },
      },
      {
        id: 'tpl-ta-2',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to Temp Access Group',
        params: {
          groupName: '{{server_access_group}}',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-ta-3',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Time-Limited Access Policy',
        params: {
          name: 'Temp: {{username}} → {{server_name}} ({{duration_hours}}h)',
          group_id: '{{fudo_group}}',
          safe_id: '{{safe_name}}',
          listener_id: '{{protocol}}',
          max_duration_hours: '{{duration_hours}}',
          require_approval: 'true',
        },
      },
      {
        id: 'tpl-ta-4',
        connectorId: 'matrix42',
        actionId: 'm42-update-ticket',
        label: 'Resolve Ticket',
        params: {
          ticketId: '{{ticket_id}}',
          status: 'Resolved',
        },
      },
    ],
  },

  // ── Template 3: Employee Offboarding ─────────────────────────────
  {
    name: 'Employee Offboarding',
    description: 'Full offboarding: disable AD user, remove from all groups, block Fudo PAM user, close ServiceNow ticket.',
    trigger: 'servicenow-request',
    steps: [
      {
        id: 'tpl-off-1',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from VPN Group',
        params: {
          groupName: 'GRP-VPN-Users',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-off-2',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from Server Access Group',
        params: {
          groupName: '{{server_access_group}}',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-off-3',
        connectorId: 'fudo',
        actionId: 'fudo-block-user',
        label: 'Block Fudo PAM User',
        params: {
          userId: '{{fudo_user_id}}',
        },
      },
      {
        id: 'tpl-off-4',
        connectorId: 'ad',
        actionId: 'ad-disable-user',
        label: 'Disable AD Account',
        params: {
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-off-5',
        connectorId: 'servicenow',
        actionId: 'snow-create-incident',
        label: 'Create Offboarding Confirmation',
        params: {
          short_description: 'Offboarding completed: {{employee_name}}',
          description: 'All access revoked for {{username}}. AD disabled, Fudo blocked, groups removed.',
          urgency: '3',
          category: 'Access',
        },
      },
    ],
  },

  // ── Template 4: Emergency Access Revocation ──────────────────────
  {
    name: 'Emergency Access Revocation',
    description: 'Immediately block compromised account: Fudo block + AD disable + remove all groups + incident ticket.',
    trigger: 'manual',
    steps: [
      {
        id: 'tpl-em-1',
        connectorId: 'fudo',
        actionId: 'fudo-block-user',
        label: '🚨 BLOCK Fudo PAM (immediate)',
        params: {
          userId: '{{fudo_user_id}}',
        },
      },
      {
        id: 'tpl-em-2',
        connectorId: 'ad',
        actionId: 'ad-disable-user',
        label: '🚨 DISABLE AD Account',
        params: {
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-em-3',
        connectorId: 'ad',
        actionId: 'ad-remove-from-group',
        label: 'Remove from all Server Groups',
        params: {
          groupName: '{{server_access_group}}',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-em-4',
        connectorId: 'servicenow',
        actionId: 'snow-create-incident',
        label: 'Create Security Incident',
        params: {
          short_description: 'SECURITY: Emergency access revocation — {{username}}',
          description: 'Account compromised. All access revoked.\nReason: {{reason}}',
          urgency: '1',
          category: 'Security',
        },
      },
    ],
  },

  // ── Template 5: Project Access (time-boxed, multi-server) ────────
  {
    name: 'Project Team Access Setup',
    description: 'Setup access for a project team: create AD group, assign servers via Fudo, create access policies with time restrictions.',
    trigger: 'jira-request',
    steps: [
      {
        id: 'tpl-proj-1',
        connectorId: 'ad',
        actionId: 'ad-add-to-group',
        label: 'Add to Project Group',
        params: {
          groupName: '{{project_group}}',
          sAMAccountName: '{{username}}',
        },
      },
      {
        id: 'tpl-proj-2',
        connectorId: 'fudo',
        actionId: 'fudo-add-to-group',
        label: 'Assign Fudo Group',
        params: {
          groupId: '{{fudo_group}}',
          user_id: '{{fudo_user_id}}',
        },
      },
      {
        id: 'tpl-proj-3',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create Dev Server Policy',
        params: {
          name: 'Project {{project_name}} — Dev Servers',
          group_id: '{{fudo_group}}',
          safe_id: 'Web-Server-Deployment',
          listener_id: 'ssh',
          max_duration_hours: '4',
          require_approval: 'false',
        },
      },
      {
        id: 'tpl-proj-4',
        connectorId: 'fudo',
        actionId: 'fudo-create-policy',
        label: 'Create DB Access Policy',
        params: {
          name: 'Project {{project_name}} — DB (read-only)',
          group_id: '{{fudo_group}}',
          safe_id: 'Application-Access',
          listener_id: 'ssh',
          max_duration_hours: '2',
          require_approval: 'true',
        },
      },
    ],
  },
];
