# Matrix42 ESM API Mock Server

Mock-Server für die Matrix42 Enterprise Service Management API. Entwickelt für PAMlab-Tests.

## Schnellstart

```bash
npm install
npm start
# Server läuft auf http://localhost:8444
```

### Mit Docker

```bash
docker build -t matrix42-mock-api .
docker run -p 8444:8444 matrix42-mock-api
```

## Authentifizierung

Zuerst einen Access Token generieren:

```bash
# Access Token holen
curl -s -X POST http://localhost:8444/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/ \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json"

# Token aus der Antwort verwenden (RawToken)
export TOKEN="<RawToken aus der Antwort>"
```

## Endpoints

### Meta — Data Definitions

```bash
# Alle Data Definitions auflisten
curl -s http://localhost:8444/m42Services/api/meta/datadefinitions \
  -H "Authorization: Bearer $TOKEN"

# Schema einer DD anzeigen
curl -s http://localhost:8444/m42Services/api/meta/datadefinitions/SPSUserClassBase \
  -H "Authorization: Bearer $TOKEN"
```

### Daten — Objekte & Fragmente

```bash
# Objekte abfragen (Query)
curl -s -X POST http://localhost:8444/m42Services/api/data/objects/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ddName": "SPSUserClassBase", "pageSize": 10, "page": 1}'

# Mit Filter
curl -s -X POST http://localhost:8444/m42Services/api/data/objects/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ddName": "SPSAssetClassBase", "filter": "Server", "pageSize": 50}'

# Objekt erstellen
curl -s -X POST http://localhost:8444/m42Services/api/data/objects/SPSUserClassBase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"FirstName": "Max", "LastName": "Mustermann", "Email": "max.mustermann@corp.local", "Department": "IT", "Status": "Active"}'

# Objekt aktualisieren
curl -s -X PUT http://localhost:8444/m42Services/api/data/objects/SPSUserClassBase/<ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"Status": "Inactive"}'

# Objekt löschen
curl -s -X DELETE http://localhost:8444/m42Services/api/data/objects/SPSUserClassBase/<ID> \
  -H "Authorization: Bearer $TOKEN"
```

### Webhooks

```bash
# Webhook registrieren
curl -s -X POST http://localhost:8444/m42Services/api/webhooks/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:9000/hook", "events": ["object.created", "object.updated"], "secret": "mysecret"}'

# Webhooks auflisten
curl -s http://localhost:8444/m42Services/api/webhooks \
  -H "Authorization: Bearer $TOKEN"

# Webhook testen
curl -s -X POST http://localhost:8444/m42Services/api/webhooks/test/<ID> \
  -H "Authorization: Bearer $TOKEN"

# Webhook empfangen (von externem System)
curl -s -X POST http://localhost:8444/m42Services/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{"event": "user.updated", "data": {"user": "john.doe"}}'
```

### Zugriffs-Anträge (Approval Workflow)

Simuliert einen Genehmigungsworkflow für Zugriffsberechtigungen:

```bash
# Antrag erstellen
curl -s -X POST http://localhost:8444/m42Services/api/access-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user": "john.doe", "target_type": "group", "target": "GRP-ADMIN", "access_type": "member", "justification": "Benötige Admin-Zugriff", "duration": "30d"}'

# Alle Anträge auflisten
curl -s http://localhost:8444/m42Services/api/access-requests \
  -H "Authorization: Bearer $TOKEN"

# Nach Status filtern
curl -s "http://localhost:8444/m42Services/api/access-requests?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Antrag genehmigen
curl -s -X POST http://localhost:8444/m42Services/api/access-requests/<ID>/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved_by": "carol.jones", "comment": "Genehmigt für Projekt X"}'

# Antrag ablehnen
curl -s -X POST http://localhost:8444/m42Services/api/access-requests/<ID>/deny \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"denied_by": "carol.jones", "reason": "Keine Berechtigung erforderlich"}'

# Zugriff widerrufen
curl -s -X POST http://localhost:8444/m42Services/api/access-requests/<ID>/revoke \
  -H "Authorization: Bearer $TOKEN"
```

## Seed-Daten

| Data Definition | Anzahl | Beschreibung |
|---|---|---|
| SPSUserClassBase | 8 | Mitarbeiter (inkl. Onboarding/Offboarding) |
| SPSAssetClassBase | 8 | Server, Desktops, Laptops |
| SPSSoftwareType | 5 | Software-Katalog |
| SPSActivityClassBase | 3 | Tickets/Incidents |
| SPSScCategoryClassBase | 5 | Service-Kategorien |

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|---|---|---|
| PORT | 8444 | Server-Port |
| DEFAULT_API_TOKEN | pamlab-dev-token | API-Token für Authentifizierung |
