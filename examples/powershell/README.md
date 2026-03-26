# PAMlab PowerShell-Beispiele

Dieses Verzeichnis enthält PowerShell-Skripte, die typische PAM-Workflows (Privileged Access Management) demonstrieren. Alle Skripte arbeiten gegen die drei Mock-APIs des PAMlab-Projekts.

## Voraussetzungen

- PowerShell 7+ (oder Windows PowerShell 5.1)
- PAMlab Mock-APIs müssen laufen (Docker Compose)

## Schnellstart

```powershell
# Modul laden
Import-Module ./_PAMlab-Module.psm1 -Force

# API-Erreichbarkeit prüfen
Test-ApiHealth

# Verbindung herstellen (authentifiziert gegen alle 3 APIs)
Connect-PAMlab
```

## Szenarien

| Skript | Beschreibung |
|--------|-------------|
| `01-Onboarding.ps1` | Neuen Mitarbeiter anlegen: M42-Ticket → AD-User → Fudo-Sync |
| `02-Offboarding.ps1` | Mitarbeiter deaktivieren: Gruppen entfernen → Fudo sperren → AD deaktivieren |
| `03-Role-Change.ps1` | Abteilungswechsel: alte Gruppen raus, neue rein, Fudo sync |
| `04-JIT-Access.ps1` | Temporärer Zugriff mit Ablaufzeit (Just-in-Time) |
| `05-Emergency-Revoke.ps1` | Notfall-Sperrung: alle Sessions beenden, komplett sperren |
| `06-Password-Rotation.ps1` | Passwort-Rotation auslösen und prüfen |
| `07-Audit-Report.ps1` | Audit-Bericht generieren und als Datei speichern |

### Skript ausführen

```powershell
# Einzelnes Szenario starten
./01-Onboarding.ps1

# Oder mit angepassten Variablen (Variablen am Anfang jedes Skripts editieren)
```

## Für Produktion anpassen

Die Skripte sind für die lokale Entwicklungsumgebung vorkonfiguriert. Für den produktiven Einsatz:

1. **URLs ändern** — `Connect-PAMlab` akzeptiert `-FudoUrl`, `-M42Url`, `-ADUrl`
2. **Credentials anpassen** — `-FudoUser`, `-FudoPassword`, `-M42ApiToken`
3. **TLS aktivieren** — URLs auf `https://` umstellen
4. **Fehlerbehandlung erweitern** — die try/catch-Blöcke nach Bedarf anpassen

```powershell
# Beispiel: Produktion
Connect-PAMlab `
    -FudoUrl "https://fudo.example.com" `
    -M42Url "https://matrix42.example.com" `
    -ADUrl "https://ad-api.example.com" `
    -FudoUser "svc-pamlab" `
    -FudoPassword $env:FUDO_PASSWORD `
    -M42ApiToken $env:M42_TOKEN
```

## Verfügbare Helper-Funktionen

| Funktion | Beschreibung |
|----------|-------------|
| `Connect-PAMlab` | Authentifiziert gegen alle 3 APIs, speichert Tokens |
| `Switch-PAMlabEnv` | Wechselt zwischen Dev- und Produktions-Konfiguration |
| `Import-PAMlabConfig` | Lädt Variablen aus einer .env-Datei |
| `Invoke-Fudo` | Fudo-API-Aufrufe (Bearer-Token + Base-URL automatisch) |
| `Invoke-M42` | Matrix42-API-Aufrufe |
| `Invoke-AD` | Active-Directory-API-Aufrufe |
| `Write-Step` | Schritt-Ergebnis mit ✅/❌ ausgeben |
| `Test-ApiHealth` | Erreichbarkeit aller 3 APIs prüfen |

## Konfiguration

PAMlab verwendet `.env`-Dateien im `config/`-Verzeichnis für die Konfiguration:

```
config/
├── pamlab.env                  # Dev-Umgebung (Mock APIs, wird mitgeliefert)
├── production.env.template     # Vorlage für Produktions-Credentials
└── .env                        # Deine Produktions-Credentials (nicht in Git!)
```

### Umgebung wechseln

```powershell
Import-Module ./_PAMlab-Module.psm1 -Force

# Dev-Umgebung (Standard)
Connect-PAMlab

# Oder explizit wechseln:
Switch-PAMlabEnv -Environment dev
Switch-PAMlabEnv -Environment production
```

### Produktions-Credentials einrichten

1. Kopiere die Vorlage:
   ```powershell
   Copy-Item config/production.env.template config/.env
   ```
2. Trage deine echten Werte in `config/.env` ein
3. Wechsle zur Produktion:
   ```powershell
   Switch-PAMlabEnv -Environment production
   ```

### ⚠️ Sicherheit

- **`config/.env` wird NIEMALS committet** (ist in `.gitignore`)
- Bei Produktions-Verbindung erscheint eine **rote Warnung**
- Credentials nur in `.env`-Dateien speichern, nicht in Skripten

## API-Endpunkte

| API | URL | Authentifizierung |
|-----|-----|-------------------|
| Fudo PAM | `http://localhost:8443` | POST `/api/v2/auth/login` → `session_token` |
| Matrix42 ESM | `http://localhost:8444` | POST mit Bearer Token → `RawToken` |
| Active Directory | `http://localhost:8445` | POST `/api/ad/auth/bind` → `token` |
