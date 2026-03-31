<div align="center">

# 🔐 PAMlab

### Enterprise Access Management — Developer Sandbox

**Build, test, and debug PAM integrations without touching production.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![CI](https://github.com/PAMlab/pamlab/actions/workflows/ci.yml/badge.svg)](https://github.com/PAMlab/pamlab/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Signed Commits Required](https://img.shields.io/badge/commits-signed_only-important)](CONTRIBUTING.md#commit-requirements)

[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[Mock APIs](#-mock-apis) •
[PowerShell Scripts](#-powershell-automation) •
[PAMlab Studio](#-pamlab-studio) •
[Contributing](#-contributing)

</div>

---

## 🎯 What is PAMlab?

PAMlab is a **complete developer sandbox** for building and testing enterprise access management integrations. It simulates a real-world IT environment with **six interconnected mock APIs**, a pipeline engine, and a web-based IDE:

| System | What it simulates | Port | Endpoints |
|--------|-------------------|------|-----------|
| 🔐 **Fudo PAM** | Privileged Access Management — session recording, password rotation, JIT access | `8443` | 70+ |
| 📋 **Matrix42 ESM** | Enterprise Service Management — asset management, ticketing, approval workflows | `8444` | 88 |
| 🏢 **Active Directory** | Directory services — users, groups, OUs, computer objects | `8445` | 25+ |
| ❄️ **ServiceNow ITSM** | ITSM — incidents, changes, CMDB, service catalog, events | `8447` | 30+ |
| 🎫 **Jira Service Mgmt** | ITSM — issues, JQL search, workflow transitions, approvals, assets, SLA tracking | `8448` | 30+ |
| 🏥 **BMC Remedy/Helix** | ITSM — incidents, changes, CMDB, work orders, SLA, Remedy REST API | `8449` | 30+ |
| 🔗 **Pipeline Engine** | Modular action chain builder — orchestrates workflows across all systems | `8446` | — |
| 🖥️ **PAMlab Studio** | Web-based IDE for building and testing integration scripts | `3000` | — |

### The Problem

You're an IT engineer who needs to automate access provisioning:

> *"When a new employee is onboarded in Matrix42, they should automatically get the right server access in Fudo PAM based on their AD group membership — and ServiceNow needs a change request, while JSM tracks approvals."*

But you can't test against production. Setting up dev instances of all these systems is expensive, complex, and time-consuming.

### The Solution

```bash
docker-compose up
# → 6 mock APIs + pipeline engine + web IDE running in seconds
# → Build your integration scripts
# → Test the complete workflow end-to-end
# → Export scripts and deploy to production (just change the URLs)
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- OR [Node.js 18+](https://nodejs.org/) for running without Docker

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/BenediktSchackenberg/PAMlab.git
cd PAMlab
docker-compose up
```

This starts **all 8 services**. Open [http://localhost:3000](http://localhost:3000) for PAMlab Studio.

### Option 2: Manual (Run Each Service Individually)

```bash
git clone https://github.com/BenediktSchackenberg/PAMlab.git
cd PAMlab

# Terminal 1: Fudo PAM Mock (port 8443)
cd fudo-mock-api && npm install && npm start

# Terminal 2: Matrix42 Mock (port 8444)
cd matrix42-mock-api && npm install && npm start

# Terminal 3: Active Directory Mock (port 8445)
cd ad-mock-api && npm install && npm start

# Terminal 4: ServiceNow Mock (port 8447)
cd servicenow-mock-api && npm install && npm start

# Terminal 5: JSM Mock (port 8448)
cd jsm-mock-api && npm install && npm start

# Terminal 6: Remedy Mock (port 8449)
cd remedy-mock-api && npm install && npm start

# Terminal 7: Pipeline Engine (port 8446)
cd pipeline-engine && npm install && npm start

# Terminal 8: PAMlab Studio (port 3000)
cd pamlab-studio && npm install && npm run dev
```

### Quick Test — Verify All Services

```bash
# ✅ Health checks (all should return JSON with status "ok" or "healthy")
curl -s http://localhost:8443/health | jq .
curl -s http://localhost:8444/health | jq .
curl -s http://localhost:8445/health | jq .
curl -s http://localhost:8447/health | jq .
curl -s http://localhost:8448/health | jq .
curl -s http://localhost:8449/health | jq .

# 🔐 Fudo PAM — Login
curl -X POST http://localhost:8443/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# 📋 Matrix42 — Get token
curl -X POST http://localhost:8444/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/ \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json"

# 🏢 Active Directory — Bind
curl -X POST http://localhost:8445/api/ad/auth/bind \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=admin","password":"admin"}'

# ❄️ ServiceNow — List incidents
curl -s http://localhost:8447/api/now/table/incident \
  -H "Authorization: Bearer pamlab-dev-token" | jq '.result | length'

# 🎫 JSM — Search with JQL
curl -s -X POST http://localhost:8448/rest/api/2/search \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"jql":"project = ITSM AND issuetype = Incident","maxResults":5}' | jq '.total'

# 🏥 Remedy — List incidents
curl -s "http://localhost:8449/api/arsys/v1/entry/HPD%3AHelp%20Desk" \
  -H "Authorization: Bearer pamlab-dev-token" | jq '.entries | length'
```

> **Default API token for all services:** `pamlab-dev-token`

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          PAMlab Studio (:3000)                               │
│      Dashboard • Scenario Builder • Code Editor • API Explorer • Events      │
└────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
     │          │          │          │          │          │
┌────▼────┐ ┌──▼────┐ ┌───▼───┐ ┌───▼─────┐ ┌─▼──────┐ ┌▼────────┐ ┌▼──────────┐
│ Matrix42│ │Active │ │ Fudo  │ │ServiceNow│ │  JSM   │ │ Remedy  │ │ Pipeline  │
│  ESM    │ │Direct.│ │  PAM  │ │  ITSM   │ │        │ │  Helix  │ │  Engine   │
│ (:8444) │ │(:8445)│ │(:8443)│ │ (:8447) │ │(:8448) │ │ (:8449) │ │ (:8446)   │
│         │ │       │ │       │ │         │ │        │ │         │ │           │
│• Assets │ │• Users│ │• Sess.│ │• Incid. │ │• Issues│ │• Incid. │ │• YAML     │
│• Tickets│ │• Group│ │• Accts│ │• Changes│ │• JQL   │ │• Changes│ │• Rollback │
│• Approv.│ │• OUs  │ │• Safes│ │• CMDB   │ │• SLA   │ │• CMDB   │ │• Dry-run  │
│• Provisi│ │• Comp.│ │• JIT  │ │• Catalog│ │• Assets│ │• Work Or│ │• 6 connec.│
│• Webhook│ │• LDAP │ │• Events││• Events │ │• Approv│ │• SLA    │ │• Variables│
└─────────┘ └───────┘ └───────┘ └─────────┘ └────────┘ └─────────┘ └───────────┘
```

### Shared Test Data (Consistent Across All Systems)

All mock APIs share the same **10 test users**, **5 servers**, and consistent identifiers:

| User | Role | Present in |
|------|------|-----------|
| `admin` | System Administrator | All systems |
| `j.doe` (John Doe) | IT Operations Lead | AD, Fudo, SNOW, JSM, Remedy |
| `a.smith` (Alice Smith) | Security Analyst | AD, Fudo, SNOW, JSM, Remedy |
| `b.wilson` (Bob Wilson) | Network Engineer | AD, Fudo, SNOW, JSM, Remedy |
| `c.jones` (Carol Jones) | Change Manager | AD, Fudo, SNOW, JSM, Remedy |
| `svc-integration` | Integration Service Account | AD, Fudo, SNOW, Remedy |
| `svc-fudo-sync` | Fudo AD Sync Account | AD, Fudo, SNOW, Remedy |
| `svc-matrix42` | Matrix42 Service Account | AD, Matrix42, SNOW, Remedy |
| `t.developer` (Tom Developer) | Developer | AD, JSM, Remedy |
| `l.leaving` (Lisa Leaving) | Departing Employee | AD, Fudo, Remedy |

| Server | IP | OS | In CMDB |
|--------|----|----|---------|
| DC01 | 10.0.1.10 | Windows Server 2022 | SNOW ✅ JSM ✅ Remedy ✅ |
| DB-PROD | 10.0.1.20 | Ubuntu 22.04 | SNOW ✅ JSM ✅ Remedy ✅ |
| APP-ERP | 10.0.1.30 | Windows Server 2022 | SNOW ✅ JSM ✅ Remedy ✅ |
| FILE-SRV01 | 10.0.1.40 | Windows Server 2022 | SNOW ✅ JSM ✅ Remedy ✅ |
| FUDO-PAM | 10.0.1.50 | Fudo OS 6.1 | SNOW ✅ JSM ✅ Remedy ✅ |

---

## 📡 Mock APIs

### 🔐 Fudo PAM API (Port 8443)

Simulates [Fudo Enterprise](https://www.fudosecurity.com/) PAM API v2 with **70+ endpoints**:

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/login` | Login with credentials → session token |
| POST | `/api/v2/auth/logout` | Invalidate session |
</details>

<details>
<summary><b>Users</b> — Full CRUD + auth methods + block/unblock</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/users` | List all users |
| GET | `/api/v2/users/:id` | Get user |
| POST | `/api/v2/users` | Create user |
| PUT | `/api/v2/users/:id` | Update user |
| DELETE | `/api/v2/users/:id` | Delete user |
| GET | `/api/v2/users/:id/auth_methods` | List auth methods |
| POST | `/api/v2/users/:id/auth_methods` | Add auth method |
| DELETE | `/api/v2/users/:id/auth_methods/:mid` | Remove auth method |
| POST | `/api/v2/users/:id/block` | Block user |
| POST | `/api/v2/users/:id/unblock` | Unblock user |
</details>

<details>
<summary><b>Accounts, Safes, Servers, Listeners, Pools</b> — Full CRUD</summary>

| Resource | Endpoints | Key Features |
|----------|-----------|--------------|
| Accounts | `/api/v2/accounts` | CRUD + managers + safe assignments + password |
| Safes | `/api/v2/safes` | CRUD + user assignments + account assignments |
| Servers | `/api/v2/servers` | CRUD |
| Listeners | `/api/v2/listeners` | CRUD |
| Pools | `/api/v2/pools` | CRUD |
</details>

<details>
<summary><b>Groups & AD Sync</b> — RBAC groups mapped to AD</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v2/groups` | List / create groups |
| GET/PUT/DELETE | `/api/v2/groups/:id` | CRUD |
| GET/POST/DELETE | `/api/v2/groups/:id/users` | Manage group members |
| GET/POST/DELETE | `/api/v2/groups/:id/safes` | Map groups to safes |
| GET/PUT | `/api/v2/user-directory/config` | AD sync configuration |
| POST | `/api/v2/user-directory/sync` | Trigger AD sync |
| GET | `/api/v2/user-directory/status` | Last sync status |
| GET | `/api/v2/user-directory/preview` | Preview sync changes |
</details>

<details>
<summary><b>Session Lifecycle</b> — Connect, monitor, terminate</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/session-control/connect` | Initiate a session |
| POST | `/api/v2/session-control/:id/terminate` | Terminate session |
| POST | `/api/v2/session-control/:id/pause` | Pause session |
| POST | `/api/v2/session-control/:id/resume` | Resume session |
| GET | `/api/v2/session-control/live` | List active sessions |
| GET | `/api/v2/session-control/:id/summary` | AI session summary |
</details>

<details>
<summary><b>Events & Webhooks</b> — Real-time event stream</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/events` | List events (filter by type, date) |
| GET | `/api/v2/events/:id` | Event detail |
| GET | `/api/v2/events/stream` | SSE real-time event stream |
| POST/GET/DELETE | `/api/v2/events/webhooks` | Manage webhook subscriptions |
</details>

<details>
<summary><b>Password Policies & JIT Access & Access Policies</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v2/password-policies` | Manage rotation policies |
| POST | `/api/v2/password-policies/:id/rotate-now` | Trigger immediate rotation |
| GET | `/api/v2/password-policies/:id/history` | Rotation history |
| POST | `/api/v2/access-requests` | Create JIT access request |
| POST | `/api/v2/access-requests/:id/approve` | Approve request |
| POST | `/api/v2/access-requests/:id/deny` | Deny request |
| POST | `/api/v2/access-requests/:id/revoke` | Revoke access |
| GET/POST | `/api/v2/access-policies` | List / create access policies (Group → Safe → Listener) |
| GET/PUT/DELETE | `/api/v2/access-policies/:id` | Access policy CRUD |
| GET | `/api/v2/access-policies/check/:user_id/:safe_id` | Check if user has access to a safe |
</details>

---

### 📋 Matrix42 ESM API (Port 8444)

Simulates [Matrix42](https://www.matrix42.com/) Enterprise Service Management API with **88 endpoints**:

<details>
<summary><b>Authentication & Core Data</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/` | Exchange API token for access token |
| GET | `/m42Services/api/data/fragments/:ddName/:id` | Get fragment data |
| PUT | `/m42Services/api/data/fragments/:ddName/:id` | Update fragment |
| POST | `/m42Services/api/data/fragments/:ddName` | Create fragment |
| GET/POST/PUT/DELETE | `/m42Services/api/data/objects/:ddName/:id` | Object CRUD |
| POST | `/m42Services/api/data/objects/query` | Query objects with filters |
| GET | `/m42Services/api/meta/datadefinitions` | List data definitions |
</details>

<details>
<summary><b>Users / Employees</b> — 16 endpoints</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/m42Services/api/users` | List / create employees |
| GET/PUT/DELETE | `/m42Services/api/users/:id` | Employee CRUD |
| GET/POST/DELETE | `/m42Services/api/users/:id/assets` | Device assignments |
| GET/POST | `/m42Services/api/users/:id/groups` | AD group memberships |
| GET | `/m42Services/api/users/:id/tickets` | User's tickets |
| GET | `/m42Services/api/users/:id/software` | Installed software |
| POST | `/m42Services/api/users/:id/onboard` | Trigger onboarding |
| POST | `/m42Services/api/users/:id/offboard` | Trigger offboarding |
| GET | `/m42Services/api/users/:id/access-history` | Access provisioning history |
</details>

<details>
<summary><b>Assets, Tickets, Provisioning, Reports, Webhooks</b></summary>

- **Assets (14 endpoints):** CRUD, software deployment, compliance, history
- **Tickets (13 endpoints):** CRUD, assign, comment, resolve, escalate, stats
- **Provisioning (9 endpoints):** Onboarding/offboarding/access-change workflows with rollback
- **Reports (5 endpoints):** Inventory, compliance, licenses, user-access matrix, provisioning
- **Webhooks (3 endpoints):** Register, list, delete
- **Access Requests (4 endpoints):** Request → approve/deny → revoke
</details>

---

### 🏢 Active Directory API (Port 8445)

Simulates Active Directory with a REST interface — **25+ endpoints**:

<details>
<summary><b>All Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ad/auth/bind` | LDAP bind simulation |
| GET/POST | `/api/ad/users` | List / create users |
| GET/PUT/DELETE | `/api/ad/users/:sam` | User CRUD by sAMAccountName |
| POST | `/api/ad/users/:sam/reset-password` | Reset user password |
| POST | `/api/ad/users/:sam/disable` | Disable account |
| GET/POST/DELETE | `/api/ad/users/:sam/groups` | User group memberships |
| GET/POST | `/api/ad/groups` | List / create security groups |
| GET/PUT/DELETE | `/api/ad/groups/:name` | Group CRUD |
| GET/POST/DELETE | `/api/ad/groups/:name/members` | Group members |
| POST | `/api/ad/groups/:name/members/timed` | Timed membership (JIT) |
| GET | `/api/ad/ous` | Organizational Units tree |
| GET/POST | `/api/ad/computers` | Computer objects |
| GET | `/api/ad/domain` | Domain information |
| POST | `/api/ad/bulk/group-membership` | Bulk add/remove members |
</details>

---

### ❄️ ServiceNow ITSM API (Port 8447)

Simulates the [ServiceNow](https://www.servicenow.com/) Table API and ITSM modules — **30+ endpoints**:

<details>
<summary><b>Table API</b> — Generic CRUD for any table</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/now/table/:tableName` | List records (supports `sysparm_query`, `sysparm_fields`, `sysparm_limit`, `sysparm_offset`) |
| GET | `/api/now/table/:tableName/:sys_id` | Get single record |
| POST | `/api/now/table/:tableName` | Create record |
| PUT | `/api/now/table/:tableName/:sys_id` | Update record |
| DELETE | `/api/now/table/:tableName/:sys_id` | Delete record |

**Seeded tables:** `sys_user`, `sys_user_group`, `incident`, `change_request`, `cmdb_ci_server`, `cmdb_rel_ci`, `sc_request`, `sc_req_item`
</details>

<details>
<summary><b>Incident Management</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/now/table/incident` | List incidents (filter by priority, state, category) |
| POST | `/api/now/table/incident` | Create incident |
| GET | `/api/now/incident/stats` | Incident statistics (total, open, by priority/category) |

**Seed data:** 6 incidents covering database outages, VPN failures, PAM alerts, password rotation issues
</details>

<details>
<summary><b>Change Management</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/now/table/change_request` | List change requests |
| POST | `/api/now/table/change_request` | Create change request |
| POST | `/api/now/change/approve/:sys_id` | Approve change (CAB) |
| POST | `/api/now/change/implement/:sys_id` | Start implementation |
| GET | `/api/now/change/schedule` | View change calendar |

**Seed data:** 4 change requests — Fudo PAM upgrade, vulnerability patching, server onboarding, AD restructuring
</details>

<details>
<summary><b>CMDB (Configuration Management)</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/now/table/cmdb_ci_server` | List CI servers |
| GET | `/api/now/cmdb/topology` | CMDB relationship topology (nodes + edges) |
| GET | `/api/now/table/cmdb_rel_ci` | CI relationships |

**Seed data:** 5 servers (DC01, DB-PROD, APP-ERP, FILE-SRV01, FUDO-PAM) with IPs and OS — matching JSM Assets
</details>

<details>
<summary><b>Service Catalog</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/now/catalog/items` | List catalog items |
| GET | `/api/now/catalog/items/:sys_id` | Get item detail |
| POST | `/api/now/catalog/items/:sys_id/order` | Order catalog item |
| GET | `/api/now/table/sc_request` | List requests |
| GET | `/api/now/table/sc_req_item` | List request items |

**Catalog items:** Server Access, VPN Access, Software Installation, Account Creation
</details>

<details>
<summary><b>Events & Webhooks</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/now/events/register` | Register event webhook |
| GET | `/api/now/events/list` | List registered webhooks |
</details>

---

### 🎫 Jira Service Management API (Port 8448)

Simulates [Atlassian JSM](https://www.atlassian.com/software/jira/service-management) with Jira REST API v2 + Service Desk API — **30+ endpoints**:

<details>
<summary><b>Authentication</b> — Session cookies + Bearer + Basic</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rest/auth/1/session` | Login → returns JSESSIONID cookie |
| DELETE | `/rest/auth/1/session` | Logout (invalidate session) |
| GET | `/rest/auth/1/session/current` | Get current session info |

Three auth methods: `Authorization: Bearer pamlab-dev-token`, Basic auth (any seeded user), or JSESSIONID cookie.
</details>

<details>
<summary><b>Issues</b> — Full Jira REST API v2 CRUD</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/api/2/issue/:issueIdOrKey` | Get issue by key (e.g. `ITSM-1`) or numeric ID |
| POST | `/rest/api/2/issue` | Create issue |
| PUT | `/rest/api/2/issue/:issueIdOrKey` | Update issue fields |
| DELETE | `/rest/api/2/issue/:issueIdOrKey` | Delete issue |
| GET | `/rest/api/2/issue/:issueIdOrKey/comment` | List comments |
| POST | `/rest/api/2/issue/:issueIdOrKey/comment` | Add comment |
| GET | `/rest/api/2/issue/:issueIdOrKey/worklog` | List worklogs |
| POST | `/rest/api/2/issue/:issueIdOrKey/worklog` | Add worklog |

**Projects:** ITSM (IT Service Management), SEC (Security)
**Issue Types:** Incident, Service Request, Change, Problem, Task, Sub-task
**Priorities:** Blocker, Critical, Major, Minor, Trivial

**Seed data (13 issues):**
| Key | Type | Priority | Summary |
|-----|------|----------|---------|
| ITSM-1 | Incident | Blocker | Database server unreachable |
| ITSM-2 | Incident | Critical | VPN authentication failures |
| ITSM-3 | Incident | Major | ERP application slow response |
| ITSM-4 | Incident | Minor | Printer not responding Floor 2 |
| ITSM-5 | Incident | Critical | Fudo PAM session recording gap |
| ITSM-6 | Incident | Major | Password rotation failed for svc accounts |
| ITSM-7 | Change | Critical | Upgrade Fudo PAM to v6.2 |
| ITSM-8 | Change | Blocker | Patch critical vulnerability on DC01 |
| ITSM-9 | Change | Major | Add new server to PAM monitoring |
| ITSM-10 | Change | Critical | AD group restructuring for RBAC |
| SEC-1 | Service Request | Major | Privileged access request for new engineer |
| SEC-2 | Service Request | Blocker | Emergency access revocation |
| SEC-3 | Service Request | Major | Password vault onboarding |
</details>

<details>
<summary><b>JQL Search</b> — Query issues with Jira Query Language</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rest/api/2/search` | Search with JQL (supports pagination) |

**Supported JQL:**
```sql
-- Field comparisons
project = ITSM
issuetype = Incident
priority = Blocker
status = Open
assignee = j.doe

-- Combinators
project = ITSM AND issuetype = Incident AND priority in (Blocker, Critical)

-- Sorting
ORDER BY created DESC
ORDER BY priority ASC

-- Pagination
{"jql": "project = ITSM", "maxResults": 10, "startAt": 0}
```
</details>

<details>
<summary><b>Workflow Transitions</b> — Context-aware state machine</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/api/2/issue/:issueIdOrKey/transitions` | Get **available** transitions (based on current status + issue type) |
| POST | `/rest/api/2/issue/:issueIdOrKey/transitions` | Execute transition |

**Workflows (only valid next states shown):**
- **Incident:** Open → In Progress → Waiting for Customer → Resolved → Closed
- **Service Request:** Open → Waiting for Approval → In Progress → Completed → Closed
- **Change:** Open → Planning → Awaiting Approval → Implementing → Review → Closed
</details>

<details>
<summary><b>Approvals</b> — Multi-level approval workflow</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/servicedeskapi/request/:requestId/approval` | List approvals for request |
| POST | `/rest/servicedeskapi/request/:requestId/approval` | Create approval (set approvers + required count) |
| POST | `/rest/servicedeskapi/request/:requestId/approval/:approvalId/approve` | Approve |
| POST | `/rest/servicedeskapi/request/:requestId/approval/:approvalId/decline` | Decline |

Supports `required_count` — e.g. 2 approvers set, only 1 required = first approval completes it.
</details>

<details>
<summary><b>Assets (Insight)</b> — CMDB for JSM</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/assets/1.0/objectschema/list` | List asset schemas |
| GET | `/rest/assets/1.0/objecttype/:schemaId` | List object types in schema |
| GET | `/rest/assets/1.0/object/:objectId` | Get asset by ID |
| POST | `/rest/assets/1.0/object/create` | Create asset |
| PUT | `/rest/assets/1.0/object/:objectId` | Update asset |
| GET | `/rest/assets/1.0/object/aql` | AQL search (e.g. `objectType=Server AND Name="DC01"`) |
| GET | `/rest/assets/1.0/objecttype/:typeId/objects` | List objects by type |

**Seed data:** "PAMlab Infrastructure" schema with Server, Network Device, Security Appliance types. 5 server objects matching ServiceNow CMDB.
</details>

<details>
<summary><b>Queues, SLA, Customers, Webhooks</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/servicedeskapi/servicedesk/:id/queue` | List queues (All Open, My Assigned, Unassigned, SLA Breached, Security) |
| GET | `/rest/servicedeskapi/servicedesk/:id/queue/:queueId/issue` | Get issues in queue |
| GET | `/rest/servicedeskapi/request/:requestId/sla` | SLA tracking (time remaining, breach status, % elapsed) |
| GET/POST | `/rest/servicedeskapi/customer` | List / create customers |
| GET/POST | `/rest/servicedeskapi/organization` | List / create organizations |
| GET | `/rest/servicedeskapi/organization/:orgId/user` | Org members |
| POST/GET/DELETE | `/rest/api/2/webhook` | Webhook management |

**SLA Policies:**
| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| P1 (Blocker) | 1 hour | 4 hours |
| P2 (Critical) | 4 hours | 8 hours |
| P3 (Major) | 8 hours | 24 hours |
| P4 (Minor) | 24 hours | 72 hours |
</details>

---

### 🏥 BMC Remedy / Helix ITSM API (Port 8449)

Simulates the [BMC Helix ITSM](https://www.bmc.com/it-solutions/bmc-helix-itsm.html) (formerly Remedy) REST API — **30+ endpoints**:

<details>
<summary><b>Authentication</b> — AR-JWT tokens + Bearer + Basic</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jwt/login` | Login → returns AR-JWT token (plain text UUID) |
| DELETE | `/api/jwt/logout` | Invalidate AR-JWT token |

Three auth methods: `Authorization: AR-JWT <token>`, `Authorization: Bearer pamlab-dev-token`, or Basic auth.

```bash
# Get AR-JWT token
TOKEN=$(curl -s -X POST http://localhost:8449/api/jwt/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

# Use it
curl -s http://localhost:8449/api/arsys/v1/entry/HPD%3AHelp%20Desk \
  -H "Authorization: AR-JWT $TOKEN"
```
</details>

<details>
<summary><b>Generic Entry API</b> — CRUD for any Remedy form</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/arsys/v1/entry/{formName}` | List entries (supports `q=` qualification, `fields=`, `limit`, `offset`, `sort`) |
| GET | `/api/arsys/v1/entry/{formName}/{entryId}` | Get single entry |
| POST | `/api/arsys/v1/entry/{formName}` | Create entry (returns Location header) |
| PUT | `/api/arsys/v1/entry/{formName}/{entryId}` | Update entry |
| DELETE | `/api/arsys/v1/entry/{formName}/{entryId}` | Delete entry |

**Available forms:** `HPD:Help Desk`, `CHG:Infrastructure Change`, `AST:ComputerSystem`, `CTM:People`, `CTM:Support Group`, `WOI:WorkOrder`, `SLA:SLADefinition`

**Qualification syntax:** `'Field' = "Value" AND 'Field' LIKE "%pattern%"`
</details>

<details>
<summary><b>Incident Management</b> (HPD:Help Desk) — 8 seed incidents</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/arsys/v1/incident/stats` | Incident statistics (total, open, by priority/group) |
| POST | `/api/arsys/v1/incident/{id}/assign` | Assign to group/person |
| POST | `/api/arsys/v1/incident/{id}/resolve` | Resolve with resolution text |
| POST | `/api/arsys/v1/incident/{id}/reopen` | Reopen resolved/closed incident |
| POST | `/api/arsys/v1/incident/{id}/worknotes` | Add work note |

**Seed incidents:** INC000000001–INC000000008 (Critical DB outage, VPN failures, PAM recording gap, unauthorized access, etc.)
</details>

<details>
<summary><b>Change Management</b> (CHG:Infrastructure Change) — 5 seed changes</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/arsys/v1/change/schedule` | Change calendar |
| POST | `/api/arsys/v1/change/{id}/approve` | CAB approval |
| POST | `/api/arsys/v1/change/{id}/reject` | Reject with reason |
| POST | `/api/arsys/v1/change/{id}/implement` | Start implementation |
| POST | `/api/arsys/v1/change/{id}/complete` | Complete change |
| GET | `/api/arsys/v1/change/{id}/tasks` | List change tasks |

**Seed changes:** CRQ000000001–CRQ000000005 (Fudo upgrade, vuln patch, server onboarding, AD restructuring, firewall rules)
</details>

<details>
<summary><b>CMDB, People, Work Orders, SLA, Webhooks</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/arsys/v1/asset/topology` | Asset relationship topology |
| GET | `/api/arsys/v1/asset/{id}/relationships` | CI relationships |
| POST | `/api/arsys/v1/asset/{id}/relationships` | Create CI relationship |
| GET | `/api/arsys/v1/people/groups` | List support groups |
| GET | `/api/arsys/v1/people/groups/{id}/members` | Group members |
| POST | `/api/arsys/v1/workorder/{id}/assign` | Assign work order |
| POST | `/api/arsys/v1/workorder/{id}/complete` | Complete work order |
| GET | `/api/arsys/v1/sla/definitions` | SLA definitions (P1–P4) |
| GET | `/api/arsys/v1/sla/status/{incidentId}` | SLA status (time remaining, breach) |
| POST/GET/DELETE | `/api/arsys/v1/webhook` | Webhook management |

**CMDB:** 5 servers (DC01, DB-PROD, APP-ERP, FILE-SRV01, FUDO-PAM) matching SNOW + JSM
**SLA:** P1: 15min/4h, P2: 1h/8h, P3: 4h/24h, P4: 8h/72h
</details>

---

## 🖥️ PAMlab Studio

Web-based developer IDE at [http://localhost:3000](http://localhost:3000):

### 🎉 Welcome & Onboarding
First-time users see a guided welcome screen with quick-start options:
- **▶️ Start with a Demo** — loads the Onboarding template and runs it immediately
- **🔧 Build from Scratch** — jump to the Workflow Builder
- Quick feature overview of all capabilities

### 📊 Live Dashboard
Real-time overview of your PAM environment:
- **Health Monitoring** — all 6 APIs at a glance (green/red status, response times)
- **Live Stats** — Users, Servers, Groups, Active Sessions, Pending Requests (fetched from Fudo API)
- **Quick Actions** — one-click to run Onboarding Demo, Emergency Revoke, or build a custom workflow
- **🔄 Reset Mock Data** — restore all APIs to default state with one click

### 🔧 Workflow Builder
Visual workflow builder with **5 pre-built templates**:

| Template | Systems | Steps | What it does |
|----------|---------|-------|-------------|
| **Employee Onboarding** | Matrix42 → AD → Fudo | 8 | Ticket → User → Groups → PAM User → Access Policy → Close |
| **Temporary Server Access** | Matrix42 → AD → Fudo | 4 | Ticket → Temp Group → Time-Limited Policy → Close |
| **Employee Offboarding** | AD → Fudo → ServiceNow | 5 | Remove Groups → Block PAM → Disable AD → Incident |
| **Emergency Access Revocation** | Fudo → AD → ServiceNow | 5 | 🚨 Block → Disable → Remove → Security Incident |
| **Project Team Access** | AD → Fudo → Jira | 4 | Group → Web Policy → DB Policy → Jira Issue |

Features:
- **Template Picker** — browse, preview, and load templates in one click
- **Step-by-Step Builder** — pick connectors, configure actions, reorder steps
- **📊 Flow Visualization** — visual diagram with colored nodes per system and live status indicators
- **Cross-Step References** — Step 6 can use the User ID created in Step 5 (auto-resolved at runtime)

### 📝 Code Editor (Monaco)
Full VS Code-quality editor with PowerShell syntax highlighting:
- **▶️ Run** — execute against mock APIs with inline split-view results
- **🧪 Test Run** — generates random test users (`test-a3f8b`) so templates work repeatedly without conflicts
- **🐛 Debug** — step-by-step execution with Next/Stop controls
- **💾 Save** — persist to browser storage
- **📤 Export** — download as `.ps1` file
- **🏭 Production** — export with real auth blocks (API tokens, OAuth2, LDAP bind) from your production config
- **🧹 Cleanup** — after Test Run, delete all created test data with one click
- **Inline Results** — each step shows status code, response time, and JSON response preview

### 🔍 API Explorer
Browse **280+ endpoints** across all 6 systems, try them interactively.

### ⚡ Event Stream
Real-time Fudo PAM events via Server-Sent Events.

### 📜 Run History
All workflow runs are saved automatically:
- Timestamp, workflow name, pass/fail badge, duration, test/production flag
- Expandable rows with full step-by-step details
- Up to 50 runs stored in browser

### ⚙️ Settings (3 Tabs)

**🧪 Mock APIs** — Configure mock API URLs (defaults work out of the box)

**🏭 Production Config** — Per-system configuration for real environments:
| System | Auth Methods |
|--------|-------------|
| Fudo PAM | API Token |
| Matrix42 ESM | API Key |
| Active Directory | LDAP Bind (DN + Password) |
| ServiceNow | OAuth2 (Client ID/Secret) |
| Jira Service Mgmt | API Token |
| BMC Remedy | Basic Auth |

- **Test Connection** per system
- **Export/Import** config as JSON (passwords masked)
- Generated scripts automatically include correct auth blocks

**🎨 Preferences** — Export format, keyboard shortcuts reference

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run script |
| `Ctrl+S` | Save script |
| `Ctrl+E` | Export as .ps1 |
| `Ctrl+1` – `Ctrl+5` | Navigate pages |

### Predefined Scenarios (16)

| Scenario | Systems | What it does |
|----------|---------|-------------|
| Onboarding | AD, Fudo, Matrix42 | Create user → add groups → PAM access → ESM ticket |
| Offboarding | AD, Fudo, Matrix42 | Disable → revoke → delete → close ticket |
| Role Change | AD, Fudo | Swap groups → update PAM access |
| JIT Access | Fudo, Matrix42 | Time-limited access with approval |
| Emergency Revoke | Fudo, AD | Kill sessions → lock account → revoke all |
| Password Rotation | AD, Fudo | Rotate creds across systems |
| SNOW Incident from PAM | Fudo, SNOW | PAM anomaly → auto-create ServiceNow incident |
| SNOW Change for Rotation | SNOW, AD, Fudo | Change request → CAB → rotate → close |
| CMDB Sync | SNOW, Fudo, AD | Sync infrastructure into CMDB |
| JSM Incident from PAM | Fudo, JSM | PAM alert → JSM incident → transition workflow |
| JSM Approval Workflow | JSM, AD, Fudo | Access request → approval → provision → SLA check |
| JSM ↔ CMDB Sync | JSM, SNOW | Compare JSM Assets with SNOW CMDB → reconciliation |
| Remedy Incident from PAM | Fudo, Remedy | PAM anomaly → Remedy incident → work notes → SLA check |
| Remedy Change Workflow | Remedy, Fudo, AD | Change request → CAB approval → implement → complete |
| Remedy CMDB Asset Audit | Remedy, SNOW, JSM | Cross-ITSM CMDB comparison & drift detection |
| Audit Report | **All 6 systems** | Comprehensive compliance report |

---

## 📜 PowerShell Automation

Ready-to-use scripts in `examples/powershell/`:

| Script | Scenario | Systems |
|--------|----------|---------|
| `01-Onboarding.ps1` | New employee provisioning | AD, Fudo, Matrix42 |
| `02-Offboarding.ps1` | Employee departure — revoke all | AD, Fudo, Matrix42 |
| `03-Role-Change.ps1` | Department change → swap groups | AD, Fudo |
| `04-JIT-Access.ps1` | Temporary access with auto-expiry | Fudo, Matrix42 |
| `05-Emergency-Revoke.ps1` | Security incident → terminate all | Fudo, AD |
| `06-Password-Rotation.ps1` | Rotate service account creds | AD, Fudo |
| `07-Audit-Report.ps1` | Cross-system compliance report | All |
| `08-ServiceNow-Integration.ps1` | Incidents, changes, CMDB sync | SNOW, Fudo, AD |
| `09-JSM-Integration.ps1` | JQL search, approvals, assets, SLA | JSM, Fudo, AD |
| `10-Remedy-Integration.ps1` | Incidents, changes, CMDB, SLA, work orders | Remedy, Fudo, AD |

### Usage

```powershell
# Import the helper module
Import-Module ./examples/powershell/_PAMlab-Module.psm1

# Connect to PAMlab (dev environment)
Connect-PAMlab

# Run a scenario
./examples/powershell/01-Onboarding.ps1
```

### Switch to Production

```powershell
# Copy and fill in the production config
cp examples/powershell/config/production.env.template examples/powershell/config/.env
# Edit .env with your real credentials

# Switch environment
Switch-PAMlabEnv -Environment production
```

> ⚠️ **The scripts are identical for dev and production.** Only the URLs and credentials change via the config file. Build once, deploy anywhere.

---

## 🔗 Pipeline Engine (Port 8446)

The Pipeline Engine orchestrates workflows across **all six mock APIs** using YAML-based pipeline definitions.

```bash
# Run a pipeline via CLI
cd pipeline-engine
node src/cli.js run pipelines/onboarding-with-approval.yaml --vars user=j.doe,group=Server-Admins

# Or via REST API
curl -X POST http://localhost:8446/pipelines/run \
  -H "Content-Type: application/json" \
  -d '{"file": "onboarding-with-approval.yaml", "vars": {"user": "j.doe", "group": "Server-Admins"}}'
```

### Pipeline Templates

| Template | Scenario |
|----------|----------|
| `onboarding-with-approval.yaml` | M42 ticket → AD user → group → Fudo sync → audit |
| `offboarding-emergency.yaml` | Fudo block → AD disable → M42 incident |
| `jit-temporary-access.yaml` | Timed group membership with auto-revoke |
| `password-rotation-campaign.yaml` | Policy rotation + compliance report |
| `security-incident-response.yaml` | Terminate sessions → block → incidents |

### Key Features

| Feature | Description |
|---------|-------------|
| ⏰ **Timed Access** | Grant access for 4h, 8h, 30d — auto-revokes when expired |
| 🔄 **Rollback** | If any step fails, all previous steps are automatically undone |
| 🧩 **6 Connectors** | Fudo PAM, Matrix42, AD, ServiceNow, JSM, Remedy |
| 📋 **YAML Templates** | Pre-built workflows for common scenarios |
| 🐛 **Step-by-Step Debug** | Pause after each step, inspect variables, continue |
| 🏃 **Dry-run Mode** | Validate without executing |
| 🔀 **Any Combination** | Matrix42→AD→Fudo, JSM→AD→Fudo, SNOW→AD→Fudo... |

### Mix and Match Any System

```
┌─── Frontends ───┐     ┌── Directory ──┐     ┌──── PAM ────┐
│ Matrix42 ESM    │     │ Active Dir.   │     │ Fudo PAM    │
│ Jira SM         │────►│ Azure AD      │────►│ CyberArk    │
│ ServiceNow      │     │ LDAP          │     │ BeyondTrust │
│ BMC Remedy      │     └───────────────┘     └─────────────┘
└─────────────────┘           │
                              ▼
                   ┌── Execution ──────┐
                   │ PowerShell        │
                   │ Python            │
                   │ Pipeline Engine   │
                   └───────────────────┘
```

> See [Epic #5](https://github.com/BenediktSchackenberg/PAMlab/issues/5) for the full Pipeline Engine specification.

---

## 📦 Project Structure

```
PAMlab/
├── fudo-mock-api/              # 🔐 Fudo PAM API Mock (70+ endpoints)
│   ├── src/
│   │   ├── routes/             #    14 route files
│   │   ├── data/               #    Seed data + in-memory store
│   │   └── middleware/         #    Auth middleware
│   ├── Dockerfile
│   └── package.json
│
├── matrix42-mock-api/          # 📋 Matrix42 ESM API Mock (88 endpoints)
│   ├── src/
│   │   ├── routes/             #    5 route files
│   │   └── data/               #    29 seed objects
│   ├── Dockerfile
│   └── package.json
│
├── ad-mock-api/                # 🏢 Active Directory API Mock (25+ endpoints)
│   ├── src/
│   │   ├── routes/             #    7 route files
│   │   └── data/               #    Users, groups, OUs, computers
│   ├── Dockerfile
│   └── package.json
│
├── servicenow-mock-api/        # ❄️ ServiceNow ITSM Mock (30+ endpoints)
│   ├── src/
│   │   ├── routes/             #    table, incident, change, cmdb, catalog, events
│   │   └── data/               #    8 seeded tables, 5 CMDB CIs
│   ├── Dockerfile
│   └── package.json
│
├── jsm-mock-api/               # 🎫 Jira Service Management Mock (30+ endpoints)
│   ├── src/
│   │   ├── routes/             #    issues, search, transitions, approvals, assets, queues, webhooks
│   │   └── data/               #    13 issues, 5 assets, 3 orgs, SLA policies
│   ├── Dockerfile
│   └── package.json
│
├── remedy-mock-api/            # 🏥 BMC Remedy / Helix Mock (30+ endpoints)
│   ├── src/
│   │   ├── routes/             #    entry, incident, change, asset, people, workorder, sla, webhook
│   │   └── data/               #    8 incidents, 5 changes, 5 assets, 10 people, 3 work orders
│   ├── Dockerfile
│   └── package.json
│
├── pipeline-engine/            # 🔗 Pipeline Engine (YAML workflows)
│   ├── src/
│   │   ├── engine/             #    PipelineRunner, StepExecutor, Rollback
│   │   ├── connectors/         #    Fudo, Matrix42, AD, SNOW, JSM, Remedy connectors
│   │   ├── api.js              #    REST API (port 8446)
│   │   └── cli.js              #    CLI runner
│   ├── pipelines/              #    5 YAML pipeline templates
│   ├── Dockerfile
│   └── package.json
│
├── pamlab-studio/              # 🖥️ Web Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         #    Dashboard, Editor, Explorer, Scenarios
│   │   ├── data/               #    280+ endpoint definitions
│   │   └── services/           #    API clients, 16 predefined scenarios
│   └── Dockerfile
│
├── examples/
│   └── powershell/             # 📜 10 automation scripts + helper module
│       ├── config/             #    Environment configs (dev/prod)
│       ├── _PAMlab-Module.psm1
│       └── 01-09 scripts
│
├── docker-compose.yml          # 🐳 One command to run everything (8 services)
├── CONTRIBUTING.md             # 📖 How to contribute
├── SECURITY.md                 # 🔒 Security policy
├── DISCLAIMER.md               # ⚠️ Legal disclaimer
├── LICENSE                     # Apache 2.0
└── README.md                   # You are here
```

---

## 🧪 Integration Flows

### Onboarding Flow (Matrix42 → AD → Fudo)
```
Matrix42          Active Directory       Fudo PAM
   │                     │                  │
   │ Access Request      │                  │
   ├────────────────►    │                  │
   │                     │                  │
   │ ✅ Approved         │                  │
   ├─────────────────────┤                  │
   │                     │ Add to Group     │
   │                     ├─────────────────►│
   │                     │                  │ Sync
   │                     │                  ├───┐
   │                     │                  │   │
   │                     │                  │◄──┘
   │                     │                  │
   │                     │                  │ ✅ Access Granted
```

### Cross-ITSM Incident Flow (Fudo → ServiceNow + JSM)
```
Fudo PAM        ServiceNow          JSM
   │                │                │
   │ 🚨 Anomaly     │                │
   ├───────────────►│                │
   │                │ Create INC     │
   │                ├───┐            │
   │                │◄──┘            │
   │                │                │
   ├────────────────────────────────►│
   │                │                │ Create ITSM-xx
   │                │                ├───┐
   │                │                │◄──┘
   │                │                │
   │                │◄──────────────►│
   │                │  CMDB ↔ Assets │
   │                │     Sync       │
```

### Emergency Revoke Flow
```
Security Alert    Fudo PAM        Active Directory    Matrix42 / SNOW / JSM
      │              │                  │                      │
      │ Anomaly!     │                  │                      │
      ├─────────────►│                  │                      │
      │              │ Kill Sessions    │                      │
      │              ├───┐              │                      │
      │              │◄──┘              │                      │
      │              │ Block User       │                      │
      │              ├───┐              │                      │
      │              │◄──┘              │                      │
      │              │                  │                      │
      │              ├─────────────────►│                      │
      │              │   Remove Groups  │                      │
      │              │                  ├─────────────────────►│
      │              │                  │  🚨 Incident Ticket  │
```

---

## 🗺️ Roadmap

| Epic | Component | Status |
|------|-----------|--------|
| — | 🔐 **Fudo PAM Mock** (70+ endpoints) | ✅ Done |
| — | 📋 **Matrix42 ESM Mock** (88 endpoints) | ✅ Done |
| — | 🏢 **Active Directory Mock** (25+ endpoints) | ✅ Done |
| [#3](https://github.com/BenediktSchackenberg/PAMlab/issues/3) | ❄️ **ServiceNow ITSM Mock** (30+ endpoints) | ✅ Done |
| [#2](https://github.com/BenediktSchackenberg/PAMlab/issues/2) | 🎫 **Jira Service Management Mock** (30+ endpoints) | ✅ Done |
| [#4](https://github.com/BenediktSchackenberg/PAMlab/issues/4) | 🏥 **BMC Remedy / Helix Mock** (30+ endpoints) | ✅ Done |
| — | 🔗 **Pipeline Engine** (YAML workflows) | ✅ Done |
| — | 🖥️ **PAMlab Studio** (Web IDE) | ✅ Done |
| [#6](https://github.com/BenediktSchackenberg/PAMlab/issues/6) | 🔒 **CyberArk PAM Mock** — PVWA REST API, Safes, Accounts, PSM | 📋 Planned |
| [#7](https://github.com/BenediktSchackenberg/PAMlab/issues/7) | 🔑 **HashiCorp Vault Mock** — Secrets, Dynamic Creds, PKI | 📋 Planned |
| [#8](https://github.com/BenediktSchackenberg/PAMlab/issues/8) | ☁️ **Azure AD / Entra ID Mock** — Graph API, PIM, Conditional Access | 📋 Planned |
| [#14](https://github.com/BenediktSchackenberg/PAMlab/issues/14) | 📧 **Microsoft 365 / Graph Mock** — Mail, Teams, Planner | 📋 Planned |
| [#9](https://github.com/BenediktSchackenberg/PAMlab/issues/9) | 🧪 **E2E Test Suite** — Automated tests for all APIs | 📋 Planned |
| [#10](https://github.com/BenediktSchackenberg/PAMlab/issues/10) | 🔗 **Pipeline Engine v2** — All connectors, conditional logic, loops | 📋 Planned |
| [#11](https://github.com/BenediktSchackenberg/PAMlab/issues/11) | 🔄 **CI/CD + Docker Hub** — GitHub Actions, pre-built images | 📋 Planned |
| [#12](https://github.com/BenediktSchackenberg/PAMlab/issues/12) | 🖥️ **PAMlab Studio v2** — Multi-user collaboration, Python export, CMDB diff viewer | 📋 Planned |
| [#13](https://github.com/BenediktSchackenberg/PAMlab/issues/13) | 🌐 **GitHub Pages Docs** — Full documentation site | 📋 Planned |

> Want another ITSM system? [Open an issue!](https://github.com/BenediktSchackenberg/PAMlab/issues/new)

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Requirements

- ✅ All commits must be **signed** (GPG or SSH)
- ✅ All PRs require **code review** from a maintainer
- ✅ Use **conventional commit** messages
- ✅ Follow existing code style

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## ⚠️ Disclaimer

PAMlab is an **independent open-source project** for development and testing purposes only. It is **not affiliated with** Fudo Security, Matrix42 AG, Microsoft, ServiceNow, Inc., Atlassian, or BMC Software. See [DISCLAIMER.md](DISCLAIMER.md).

---

## 📝 License

[Apache License 2.0](LICENSE)

---

<div align="center">

**Built with ❤️ for the PAM integration community**

[⭐ Star this repo](https://github.com/BenediktSchackenberg/PAMlab) if you find it useful!

</div>
