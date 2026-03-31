# CyberArk PVWA Mock API v12.6

Mock-Server für die CyberArk Privileged Vault Web Access (PVWA) REST API v12+ zur Entwicklung und zum Testen.

## Schnellstart

```bash
npm install
npm start
```

Server läuft auf `http://localhost:8450` (Port konfigurierbar über `PORT` Umgebungsvariable).

## Authentifizierung

Alle Endpoints (außer Logon) benötigen ein Session-Token im `Authorization` Header.

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8450/api/auth/Cyberark/Logon \
  -H "Content-Type: application/json" \
  -d '{"username":"Administrator","password":"Cyberark1!"}' | jq -r .)

echo $TOKEN

# Safes auflisten
curl -s http://localhost:8450/api/Safes \
  -H "Authorization: $TOKEN" | jq .

# Logout
curl -X POST http://localhost:8450/api/auth/Logoff \
  -H "Authorization: $TOKEN"
```

## Dev Token

Für lokale Entwicklung: `Authorization: Bearer pamlab-dev-token`

## Endpoints

### Authentication
- `POST /api/auth/Cyberark/Logon` — Login
- `POST /api/auth/Logoff` — Logout

### Safes
- `GET /api/Safes` — List (search, offset, limit)
- `GET /api/Safes/:id` — Get
- `POST /api/Safes` — Create
- `PUT /api/Safes/:id` — Update
- `DELETE /api/Safes/:id` — Delete
- `GET /api/Safes/:id/Members` — List members
- `POST /api/Safes/:id/Members` — Add member
- `PUT /api/Safes/:id/Members/:name` — Update member
- `DELETE /api/Safes/:id/Members/:name` — Remove member

### Accounts
- `GET /api/Accounts` — List/Search (search, filter, offset, limit, SafeName)
- `GET /api/Accounts/:id` — Get
- `POST /api/Accounts` — Create
- `PUT /api/Accounts/:id` — Update
- `PATCH /api/Accounts/:id` — Patch (JSON Patch)
- `DELETE /api/Accounts/:id` — Delete
- `POST /api/Accounts/:id/Password/Retrieve` — Get password
- `POST /api/Accounts/:id/CheckIn` — Check in
- `POST /api/Accounts/:id/Change` — Change password
- `POST /api/Accounts/:id/Verify` — Verify password
- `POST /api/Accounts/:id/Reconcile` — Reconcile password

### Platforms
- `GET /api/Platforms` — List (search, Active)
- `GET /api/Platforms/:id` — Get
- `POST /api/Platforms/:id/Activate` — Activate
- `POST /api/Platforms/:id/Deactivate` — Deactivate

### Users
- `GET /api/Users` — List (search, filter, offset, limit)
- `GET /api/Users/:id` — Get
- `POST /api/Users` — Create
- `PUT /api/Users/:id` — Update
- `DELETE /api/Users/:id` — Delete
- `POST /api/Users/:id/Activate` — Activate
- `POST /api/Users/:id/Deactivate` — Suspend
- `POST /api/Users/:id/ResetPassword` — Reset password

### User Groups
- `GET /api/UserGroups` — List
- `GET /api/UserGroups/:id` — Get
- `POST /api/UserGroups` — Create
- `PUT /api/UserGroups/:id` — Update
- `DELETE /api/UserGroups/:id` — Delete
- `POST /api/UserGroups/:id/Members` — Add member
- `DELETE /api/UserGroups/:id/Members/:memberId` — Remove member

### Session Monitoring
- `GET /api/LiveSessions` — List PSM sessions
- `GET /api/LiveSessions/:id` — Get session
- `POST /api/LiveSessions/:id/Terminate` — Terminate session

### System Health
- `GET /api/ComponentsMonitoringDetails` — All components
- `GET /api/ComponentsMonitoringDetails/:componentId` — By component

### Server
- `GET /api/Server` — Server info
- `GET /health` — Health check

## Seed Data

- **4 Safes**: IT-Admins, DB-Credentials, Application-Accounts, Cloud-Keys
- **12 Accounts**: Windows Domain, Unix SSH, MySQL, AWS Access Keys
- **6 Users**: Administrator, Auditor, Operator, Helpdesk, Service, Developer
- **5 Groups**: Vault Admins, IT-Ops, DBA, AppTeam, Auditors
- **5 Platforms**: WinDomain, UnixSSH, MySQL, WinServerLocal, AWSAccessKeys
- **4 PSM Sessions**: 3 active, 1 completed

## Tests

```bash
npm test
```
