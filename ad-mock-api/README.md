# Active Directory Mock API

Mock-API die eine Active Directory Umgebung simuliert — Teil des PAMlab-Projekts.

## Überblick

Dieser Service simuliert eine Active Directory Domain (`corp.local`) mit REST-API. Er sitzt zwischen Matrix42 ESM (Port 8444) und Fudo PAM (Port 8443):

- **Matrix42** provisioniert Benutzer in AD-Gruppen
- **Fudo PAM** synchronisiert Zugriffsrechte aus AD

## Quick Start

```bash
npm install
npm start    # Port 8445
```

Oder mit Docker:
```bash
docker build -t ad-mock-api .
docker run -p 8445:8445 ad-mock-api
```

## Authentifizierung

Alle Endpoints (außer `/api/ad/auth/bind` und `/health`) benötigen einen Bearer Token.

```bash
# Token holen (simulierter LDAP Bind)
TOKEN=$(curl -s -X POST http://localhost:8445/api/ad/auth/bind \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=Administrator,OU=IT Department,OU=Users,DC=corp,DC=local","password":"admin123"}' \
  | jq -r '.token')
```

## API Endpoints

### Domain Info
```bash
curl -s http://localhost:8445/api/ad/domain -H "Authorization: Bearer $TOKEN" | jq
```

### Benutzer

```bash
# Alle Benutzer auflisten
curl -s http://localhost:8445/api/ad/users -H "Authorization: Bearer $TOKEN" | jq

# Benutzer nach sAMAccountName
curl -s http://localhost:8445/api/ad/users/j.doe -H "Authorization: Bearer $TOKEN" | jq

# Benutzer filtern
curl -s "http://localhost:8445/api/ad/users?filter=smith&limit=5" -H "Authorization: Bearer $TOKEN" | jq

# Benutzer erstellen
curl -s -X POST http://localhost:8445/api/ad/users \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sAMAccountName":"m.mueller","cn":"Max Mueller","givenName":"Max","sn":"Mueller","department":"Engineering"}' | jq

# Benutzer bearbeiten
curl -s -X PUT http://localhost:8445/api/ad/users/j.doe \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Lead Developer"}' | jq

# Benutzer deaktivieren
curl -s -X DELETE http://localhost:8445/api/ad/users/l.leaving -H "Authorization: Bearer $TOKEN" | jq

# Gruppen eines Benutzers
curl -s http://localhost:8445/api/ad/users/j.doe/groups -H "Authorization: Bearer $TOKEN" | jq

# Benutzer zu Gruppen hinzufügen
curl -s -X POST http://localhost:8445/api/ad/users/t.developer/groups \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"groups":["GRP-RDP-Admins","GRP-DB-Operators"]}' | jq
```

### Gruppen

```bash
# Alle Gruppen
curl -s http://localhost:8445/api/ad/groups -H "Authorization: Bearer $TOKEN" | jq

# Gruppenmitglieder
curl -s http://localhost:8445/api/ad/groups/GRP-RDP-Admins/members -H "Authorization: Bearer $TOKEN" | jq

# Mitgliederanzahl
curl -s http://localhost:8445/api/ad/groups/GRP-VPN-Users/members/count -H "Authorization: Bearer $TOKEN" | jq

# Zeitbasierte Mitgliedschaft (JIT Access)
curl -s -X POST http://localhost:8445/api/ad/groups/GRP-RDP-Admins/members/timed \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user":"t.developer","expires_at":"2026-04-26T00:00:00Z"}' | jq
```

### Bulk-Operationen

```bash
curl -s -X POST http://localhost:8445/api/ad/bulk/group-membership \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"add","group":"GRP-ERP-Users","users":["t.developer","b.wilson"]}' | jq
```

### Organisationseinheiten

```bash
curl -s http://localhost:8445/api/ad/ous -H "Authorization: Bearer $TOKEN" | jq
```

### Computer

```bash
curl -s http://localhost:8445/api/ad/computers -H "Authorization: Bearer $TOKEN" | jq
curl -s http://localhost:8445/api/ad/computers/DC01 -H "Authorization: Bearer $TOKEN" | jq
```

## Seed-Daten

### Benutzer (10)
| sAMAccountName | Name | Abteilung | Status |
|---|---|---|---|
| admin | Administrator | IT Department | ✅ |
| j.doe | John Doe | Engineering | ✅ |
| a.smith | Alice Smith | Finance | ✅ |
| b.wilson | Bob Wilson | IT Department | ✅ |
| c.jones | Carol Jones | Management | ✅ |
| svc-integration | Service Integration | IT Department | ✅ |
| svc-fudo-sync | Fudo Sync Service | IT Department | ✅ |
| svc-matrix42 | Matrix42 Service | IT Department | ✅ |
| t.developer | Tom Developer | Engineering | ✅ |
| l.leaving | Lisa Leaving | Finance | ❌ |

### Gruppen → Fudo Mapping
| AD Gruppe | Fudo Account |
|---|---|
| GRP-RDP-Admins | RDP-Server-Admins |
| GRP-DB-Operators | DB-Operators |
| GRP-SVC-Integration | Integration-Services |

## Port

- **8445** (Standard)
- Konfigurierbar über `PORT` Umgebungsvariable
