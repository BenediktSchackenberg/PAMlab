<div align="center">

# 🔐 PAMlab

### Enterprise Access Management — Developer Sandbox

**Build, test, and debug PAM integrations without touching production.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
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

PAMlab is a **complete developer sandbox** for building and testing enterprise access management integrations. It simulates a real-world IT environment with three interconnected mock APIs:

| System | What it simulates | Port |
|--------|-------------------|------|
| 🔐 **Fudo PAM** | Privileged Access Management — session recording, password rotation, JIT access | `8443` |
| 📋 **Matrix42 ESM** | Enterprise Service Management — asset management, ticketing, approval workflows | `8444` |
| 🏢 **Active Directory** | Directory services — users, groups, OUs, computer objects | `8445` |
| 🖥️ **PAMlab Studio** | Web-based IDE for building and testing integration scripts | `3000` |

### The Problem

You're an IT engineer who needs to automate access provisioning:

> *"When a new employee is onboarded in Matrix42, they should automatically get the right server access in Fudo PAM based on their AD group membership."*

But you can't test against production. Setting up dev instances of Fudo, Matrix42, and AD is expensive, complex, and time-consuming.

### The Solution

```bash
docker-compose up
# → 3 mock APIs + web IDE running in seconds
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

Open [http://localhost:3000](http://localhost:3000) for PAMlab Studio.

### Option 2: Manual

```bash
git clone https://github.com/BenediktSchackenberg/PAMlab.git
cd PAMlab

# Terminal 1: Fudo PAM Mock
cd fudo-mock-api && npm install && npm start

# Terminal 2: Matrix42 Mock
cd matrix42-mock-api && npm install && npm start

# Terminal 3: Active Directory Mock
cd ad-mock-api && npm install && npm start

# Terminal 4: PAMlab Studio
cd pamlab-studio && npm install && npm run dev
```

### Quick Test

```bash
# Fudo PAM — Login
curl -X POST http://localhost:8443/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# Matrix42 — Get token
curl -X POST http://localhost:8444/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/ \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json"

# Active Directory — Bind
curl -X POST http://localhost:8445/api/ad/auth/bind \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=admin","password":"admin"}'
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PAMlab Studio (:3000)                      │
│          Scenario Builder • Code Editor • API Explorer         │
└──────────┬───────────────────┬───────────────────┬───────────┘
           │                   │                   │
     ┌─────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
     │ Matrix42   │    │   Active    │    │  Fudo PAM   │
     │ ESM Mock   │───►│  Directory  │───►│   Mock      │
     │  (:8444)   │    │   Mock      │    │  (:8443)    │
     │            │    │  (:8445)    │    │             │
     │ • Assets   │    │ • Users     │    │ • Sessions  │
     │ • Tickets  │    │ • Groups    │    │ • Accounts  │
     │ • Approvals│    │ • OUs       │    │ • Safes     │
     │ • Webhooks │    │ • Computers │    │ • Events    │
     └────────────┘    └─────────────┘    └─────────────┘
```

### The Integration Flow

```
1. 📋 Matrix42: Access request created for new employee
       │
2. ✅ Matrix42: Manager approves the request
       │
3. 👤 Active Directory: User added to security group
       │
4. 🔄 Fudo PAM: AD sync picks up the group membership
       │
5. 🔐 Fudo PAM: User now has access to target servers
       │
6. 📹 Fudo PAM: All sessions are recorded and monitored
```

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
<summary><b>Password Policies & JIT Access</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v2/password-policies` | Manage rotation policies |
| POST | `/api/v2/password-policies/:id/rotate-now` | Trigger immediate rotation |
| GET | `/api/v2/password-policies/:id/history` | Rotation history |
| POST | `/api/v2/access-requests` | Create JIT access request |
| POST | `/api/v2/access-requests/:id/approve` | Approve request |
| POST | `/api/v2/access-requests/:id/deny` | Deny request |
| POST | `/api/v2/access-requests/:id/revoke` | Revoke access |
</details>

---

### 📋 Matrix42 ESM API (Port 8444)

Simulates [Matrix42](https://www.matrix42.com/) Enterprise Service Management API:

<details>
<summary><b>All Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/` | Exchange API token for access token |
| GET | `/m42Services/api/data/fragments/:ddName/:id` | Get fragment data |
| GET | `/m42Services/api/data/fragments/:ddName/:id/schema-info` | Fragment + schema |
| PUT | `/m42Services/api/data/fragments/:ddName/:id` | Update fragment |
| POST | `/m42Services/api/data/fragments/:ddName` | Create fragment |
| GET/POST/PUT/DELETE | `/m42Services/api/data/objects/:ddName/:id` | Object CRUD |
| POST | `/m42Services/api/data/objects/query` | Query objects with filters |
| GET | `/m42Services/api/meta/datadefinitions` | List data definitions |
| GET | `/m42Services/api/meta/datadefinitions/:ddName` | Get DD schema |
| POST/GET/DELETE | `/m42Services/api/webhooks` | Webhook management |
| POST/GET | `/m42Services/api/access-requests` | Approval workflow |
| POST | `/m42Services/api/access-requests/:id/approve` | Approve |
| POST | `/m42Services/api/access-requests/:id/deny` | Deny |
| POST | `/m42Services/api/access-requests/:id/revoke` | Revoke |

**Data Definitions:** SPSUserClassBase (employees), SPSAssetClassBase (devices), SPSSoftwareType, SPSActivityClassBase (tickets), SPSScCategoryClassBase (categories)
</details>

---

### 🏢 Active Directory API (Port 8445)

Simulates Active Directory with a REST interface:

<details>
<summary><b>All Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ad/auth/bind` | LDAP bind simulation |
| GET/POST | `/api/ad/users` | List / create users |
| GET/PUT/DELETE | `/api/ad/users/:sam` | User CRUD by sAMAccountName |
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

## 🖥️ PAMlab Studio

Web-based developer IDE at [http://localhost:3000](http://localhost:3000):

- **📋 Scenario Builder** — Select predefined scenarios or define your own
- **📝 Code Editor** — Monaco Editor (VS Code engine) with PowerShell syntax highlighting
- **▶️ Script Runner** — Execute scripts against mock APIs with real-time results
- **🔍 API Explorer** — Browse all endpoints, try them interactively
- **⚡ Event Stream** — Real-time Fudo events via Server-Sent Events
- **📊 Results Panel** — Step-by-step results + API traffic log

---

## 📜 PowerShell Automation

Ready-to-use scripts in `examples/powershell/`:

| Script | Scenario |
|--------|----------|
| `01-Onboarding.ps1` | New employee → access request → AD group → Fudo access |
| `02-Offboarding.ps1` | Employee leaves → revoke all access → block → disable |
| `03-Role-Change.ps1` | Department change → swap groups → verify new access |
| `04-JIT-Access.ps1` | Temporary access with automatic expiry |
| `05-Emergency-Revoke.ps1` | Security incident → terminate sessions → lock everything |
| `06-Password-Rotation.ps1` | Trigger and verify password rotation policies |
| `07-Audit-Report.ps1` | Generate comprehensive audit report |

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

## 🧪 Predefined Test Scenarios

### Onboarding Flow
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

### Emergency Revoke Flow
```
Security Alert    Fudo PAM        Active Directory    Matrix42
      │              │                  │                │
      │ Anomaly!     │                  │                │
      ├─────────────►│                  │                │
      │              │ Kill Sessions    │                │
      │              ├───┐              │                │
      │              │◄──┘              │                │
      │              │ Block User       │                │
      │              ├───┐              │                │
      │              │◄──┘              │                │
      │              │                  │                │
      │              ├─────────────────►│                │
      │              │   Remove Groups  │                │
      │              │                  ├───────────────►│
      │              │                  │  🚨 Incident   │
      │              │                  │     Ticket     │
```

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
├── matrix42-mock-api/          # 📋 Matrix42 ESM API Mock
│   ├── src/
│   │   ├── routes/             #    5 route files
│   │   └── data/               #    29 seed objects
│   ├── Dockerfile
│   └── package.json
│
├── ad-mock-api/                # 🏢 Active Directory API Mock
│   ├── src/
│   │   ├── routes/             #    7 route files
│   │   └── data/               #    Users, groups, OUs, computers
│   ├── Dockerfile
│   └── package.json
│
├── pamlab-studio/              # 🖥️ Web Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/         #    Dashboard, Editor, Explorer, etc.
│   │   └── services/           #    API clients, script parser
│   └── Dockerfile
│
├── examples/
│   └── powershell/             # 📜 7 automation scripts + helper module
│       ├── config/             #    Environment configs (dev/prod)
│       ├── _PAMlab-Module.psm1
│       └── 01-07 scripts
│
├── docker-compose.yml          # 🐳 One command to run everything
├── CONTRIBUTING.md             # 📖 How to contribute
├── SECURITY.md                 # 🔒 Security policy
├── DISCLAIMER.md               # ⚠️ Legal disclaimer
├── LICENSE                     # Apache 2.0
└── README.md                   # You are here
```

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

PAMlab is an **independent open-source project** for development and testing purposes only. It is **not affiliated with** Fudo Security, Matrix42 AG, or Microsoft. See [DISCLAIMER.md](DISCLAIMER.md).

---

## 📝 License

[Apache License 2.0](LICENSE)

---

<div align="center">

**Built with ❤️ for the PAM integration community**

[⭐ Star this repo](https://github.com/BenediktSchackenberg/PAMlab) if you find it useful!

</div>
