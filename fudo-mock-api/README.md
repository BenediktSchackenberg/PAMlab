# Fudo PAM API v2 — Mock Server

Mock-Server für die Fudo PAM API v2 (basierend auf Fudo Enterprise 5.x) zur Entwicklung und zum Testen der Matrix42-Integration.

## Schnellstart

```bash
npm install
npm start
```

Server läuft auf `http://localhost:3000` (Port konfigurierbar über `PORT` Umgebungsvariable).

## Authentifizierung

Alle Endpoints (außer Login) benötigen einen `Authorization: Bearer <token>` Header.

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}' | jq -r .session_token)

echo $TOKEN

# Logout
curl -X POST http://localhost:3000/api/v2/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Standard-Benutzer:** `admin` / `admin123` (alle vorinstallierten Benutzer nutzen dasselbe Passwort)

## Vorinstallierte Testdaten

| Typ | Daten |
|-----|-------|
| **Benutzer** | admin, svc-matrix42, dr.mueller, nurse.schmidt, it-support |
| **Server** | dc01.intern.local (Windows DC), db-patient.intern.local (PostgreSQL), app-his.intern.local (HIS) |
| **Accounts** | Administrator@dc01, postgres@db-patient, his-admin@app-his |
| **Safes** | IT-Administration, KIS-Zugang |
| **Listener** | SSH (Port 2222), RDP (Port 3389) |
| **Pools** | Klinik-Server |
| **Sessions** | 4 Beispiel-Sessions mit realistischen Metadaten |

## API Endpoints

Alle unter `/api/v2/`

### Benutzer
```bash
# Liste
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users

# Einzeln
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users/<id>

# Erstellen
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"login":"test","name":"Test User","email":"test@klinikum.local"}' \
  http://localhost:3000/api/v2/users

# Ändern
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Neuer Name"}' http://localhost:3000/api/v2/users/<id>

# Löschen
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users/<id>

# Auth-Methoden
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users/<id>/auth_methods

# Benutzer sperren/entsperren
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users/<id>/block
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/users/<id>/unblock
```

### Accounts
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/accounts
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/accounts/<id>/managers
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/accounts/<id>/safes
```

### Safes
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/safes
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/safes/<id>/users
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/safes/<id>/accounts
```

### Server
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/servers
```

### Sessions
```bash
# Alle Sessions
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/sessions

# Gefiltert
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v2/sessions?user_id=<id>&limit=10"
```

### Listener
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/listeners
```

### Pools
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/pools
```

### Groups (RBAC)
```bash
# Liste aller Gruppen
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups

# Einzelne Gruppe
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>

# Erstellen
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Neue-Gruppe","description":"Beschreibung","ad_group_dn":"CN=GRP-Neu,OU=Security Groups,DC=corp,DC=local"}' \
  http://localhost:3000/api/v2/groups

# Ändern
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"description":"Neue Beschreibung"}' http://localhost:3000/api/v2/groups/<id>

# Löschen
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>

# Benutzer in Gruppe
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>/users

# Benutzer zu Gruppe hinzufügen
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":"<user_id>"}' http://localhost:3000/api/v2/groups/<id>/users

# Benutzer aus Gruppe entfernen
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>/users/<user_id>

# Safes der Gruppe
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>/safes

# Safe zuweisen
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"safe_id":"<safe_id>"}' http://localhost:3000/api/v2/groups/<id>/safes

# Safe entfernen
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/groups/<id>/safes/<safe_id>
```

### User Directory (AD/LDAP Sync)
```bash
# Sync-Konfiguration abrufen
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/user-directory/config

# Sync-Konfiguration ändern
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sync_interval_minutes":30}' http://localhost:3000/api/v2/user-directory/config

# Sync auslösen
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/user-directory/sync

# Sync-Status abrufen
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/user-directory/status

# Sync-Vorschau (Dry Run)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/user-directory/preview
```

### Health Check
```bash
curl http://localhost:3000/api/v2/health
```

## Pagination

Listen-Endpoints unterstützen `?limit=` und `?offset=` Query-Parameter.

Antwortformat:
```json
{
  "total": 5,
  "limit": 50,
  "offset": 0,
  "items": [...]
}
```

## Fehler-Responses

| Code | Bedeutung |
|------|-----------|
| 401 | Nicht authentifiziert / Token ungültig |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z.B. Login existiert bereits) |
| 422 | Validierungsfehler |

## Konfiguration

Siehe `.env.example`:
- `PORT` — Server-Port (Standard: 3000)
- `DEFAULT_ADMIN_PASSWORD` — Passwort für alle Benutzer (Standard: admin123)

## Groups & AD-Sync

Das Groups-Feature (ab Fudo 5.6) ermöglicht RBAC über AD-synchronisierte Gruppen. Der Workflow:

1. **AD-Gruppe existiert:** `GRP-RDP-Admins` in `OU=Security Groups,DC=corp,DC=local`
2. **Fudo synct via User Directory:** Group `RDP-Server-Admins` wird automatisch erstellt/aktualisiert
3. **Group ist mit Safe verknüpft:** `RDP-Server-Admins` → Safe `IT-Administration`
4. **Safe enthält Accounts:** z.B. `Administrator@dc01`, `postgres@db-prod`, `erp-admin@app-erp` auf 3 Servern
5. **→ Ergebnis:** Alle Benutzer in der AD-Gruppe `GRP-RDP-Admins` erhalten automatisch Zugriff auf alle Accounts im Safe

### Vorinstallierte Gruppen

| Gruppe | AD-Gruppe | Safe | Benutzer |
|--------|-----------|------|----------|
| RDP-Server-Admins | GRP-RDP-Admins | IT-Administration | admin, it-ops |
| DB-Operators | GRP-DB-Operators | Application-Access | j.doe, a.smith |
| Integration-Services | GRP-SVC-Integration | IT-Administration, Application-Access | svc-integration |

---

## Session-Steuerung (Session Control)

Simuliert den Session-Lifecycle wenn Benutzer sich über Fudo verbinden.

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/v2/session-control/connect` | Session initiieren (`{user_id, account_id, protocol}`) |
| POST | `/api/v2/session-control/:id/terminate` | Aktive Session beenden |
| POST | `/api/v2/session-control/:id/pause` | Session pausieren |
| POST | `/api/v2/session-control/:id/resume` | Pausierte Session fortsetzen |
| GET | `/api/v2/session-control/live` | Alle aktiven Sessions auflisten |
| GET | `/api/v2/session-control/:id/summary` | KI-generierte Session-Zusammenfassung (simuliert) |

## Events & Webhooks

Fudo generiert Events für alle Aktionen. Diese Endpunkte simulieren den Event-Stream.

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/v2/events` | Events auflisten (`?type`, `?from`, `?to`, `?limit`) |
| GET | `/api/v2/events/:id` | Event-Details |
| GET | `/api/v2/events/stream` | SSE-Endpoint (Server-Sent Events, alle 10s ein Event) |
| POST | `/api/v2/events/webhooks` | Webhook registrieren (`{url, events, secret}`) |
| GET | `/api/v2/events/webhooks` | Registrierte Webhooks auflisten |
| DELETE | `/api/v2/events/webhooks/:id` | Webhook löschen |
| POST | `/api/v2/events/webhooks/:id/test` | Test-Event an Webhook senden |

**Event-Typen:** `session.started`, `session.ended`, `session.terminated`, `session.paused`, `session.anomaly_detected`, `user.blocked`, `user.unblocked`, `user.created`, `user.deleted`, `account.password_changed`, `account.password_rotation`, `access.denied`, `access.granted`, `sync.completed`, `system.alert`

## Passwort-Rotation (Password Policies)

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/v2/password-policies` | Alle Policies auflisten |
| GET | `/api/v2/password-policies/:id` | Policy-Details |
| POST | `/api/v2/password-policies` | Neue Policy erstellen |
| PUT | `/api/v2/password-policies/:id` | Policy aktualisieren |
| DELETE | `/api/v2/password-policies/:id` | Policy löschen |
| POST | `/api/v2/password-policies/:id/rotate-now` | Sofortige Rotation aller Accounts der Policy |
| GET | `/api/v2/password-policies/:id/history` | Rotationshistorie |

**Vorkonfigurierte Policies:**
- **Standard-90-Days** — 90 Tage Rotation, alle Accounts
- **High-Security-30-Days** — 30 Tage Rotation, nur dc01 Admin-Account

## Just-in-Time Access Requests

Simuliert den Workflow für zeitlich begrenzte Zugriffsanfragen.

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/v2/access-requests` | Zugriffsanfrage erstellen |
| GET | `/api/v2/access-requests` | Anfragen auflisten (`?status`, `?user_id`) |
| GET | `/api/v2/access-requests/:id` | Anfrage-Details |
| POST | `/api/v2/access-requests/:id/approve` | Anfrage genehmigen |
| POST | `/api/v2/access-requests/:id/deny` | Anfrage ablehnen |
| POST | `/api/v2/access-requests/:id/revoke` | Genehmigten Zugriff widerrufen |

**Vorkonfigurierte Anfragen:**
- 1× genehmigt (j.doe → ERP-Zugang)
- 1× ausstehend (a.smith → DB-Zugang)
- 1× abgelaufen (j.doe → IT-Administration)

---

## Realistische Szenarien

### Session-Lifecycle Flow
```
1. POST /session-control/connect → Session starten
2. GET /session-control/live → Aktive Sessions überwachen
3. GET /session-control/:id/summary → KI-Zusammenfassung abrufen
4. POST /session-control/:id/pause → Session pausieren (bei Verdacht)
5. POST /session-control/:id/terminate → Session beenden
```

### Event-Stream für Monitoring
```
1. GET /events/stream → SSE-Verbindung für Echtzeit-Events
2. POST /events/webhooks → Webhook für Matrix42-Integration registrieren
3. GET /events?type=session.anomaly_detected → Anomalien filtern
```
Ein Webhook für die Matrix42-Integration ist vorkonfiguriert:
`http://localhost:8444/m42Services/api/webhooks/receive`

### Password-Rotation Automatisierung
```
1. POST /password-policies → Rotations-Policy definieren
2. POST /password-policies/:id/rotate-now → Sofortige Rotation auslösen
3. GET /password-policies/:id/history → Rotationshistorie prüfen
```
Events vom Typ `account.password_rotation` werden automatisch generiert.

### Just-in-Time Access Workflow
```
1. POST /access-requests → Benutzer fordert temporären Zugriff an
2. GET /access-requests?status=pending → Admin sieht ausstehende Anfragen
3. POST /access-requests/:id/approve → Admin genehmigt (Zeitfenster wird gesetzt)
4. POST /access-requests/:id/revoke → Zugriff nach Bedarf widerrufen
```
Events `access.granted` und `access.denied` werden bei Entscheidungen generiert.
