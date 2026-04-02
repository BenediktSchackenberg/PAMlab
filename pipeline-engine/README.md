# PAMlab Pipeline Engine

The Pipeline Engine orchestrates PAMlab mock systems with YAML-defined workflows.

## What is new in v2

- 7+ available connector IDs across PAM, ITSM and directory flows
- conditional execution via `condition:`
- parallel fan-out via `parallel:`
- loop support via `foreach:`
- new cross-system pipeline templates for ServiceNow, JSM, Remedy and CyberArk scenarios

## Available connectors

Canonical connector IDs:

- `fudo-pam`
- `matrix42-esm`
- `active-directory`
- `servicenow`
- `jsm`
- `remedy`
- `cyberark`

Compatibility aliases:

- `fudo`
- `matrix42`
- `ad`
- `azure-ad`
- `service-now`
- `snow`
- `jira`

`azure-ad` currently maps to the Active Directory mock until a dedicated Azure AD mock lands.

## Quick start

### Docker

```bash
docker-compose up
```

### Local

```bash
cd pipeline-engine
npm install
npm start
```

The API is available at `http://localhost:8446`.

## CLI

```bash
# Run a pipeline
node src/cli.js run pipelines/cross-itsm-incident.yaml --vars user=j.doe,server=DB-PROD,sessionId=s-1001,fudoUserId=42

# Dry-run a loop-based pipeline with JSON vars
node src/cli.js dry-run pipelines/multi-pam-password-rotation.yaml --vars targets=["srv-1","srv-2"]

# Validate a pipeline
node src/cli.js validate pipelines/cmdb-reconciliation.yaml

# List templates
node src/cli.js list-pipelines

# Inspect connector actions
node src/cli.js list-actions servicenow
node src/cli.js list-actions jsm
node src/cli.js list-actions remedy
```

Supported environment variables:

- `PORT`
- `FUDO_URL`
- `M42_URL`
- `AD_URL`
- `SNOW_URL`
- `JSM_URL`
- `REMEDY_URL`
- `CYBERARK_URL`

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/pipelines` | List pipeline templates |
| `GET` | `/pipelines/:name` | Fetch a pipeline definition |
| `POST` | `/pipelines/validate` | Validate inline YAML or a file |
| `POST` | `/pipelines/run` | Execute a pipeline |
| `GET` | `/pipelines/runs` | List recent runs |
| `GET` | `/pipelines/runs/:id` | Fetch a single run |
| `GET` | `/connectors` | List registered connectors |
| `GET` | `/connectors/:name/actions` | List actions for one connector |

### Example run request

```bash
curl -X POST http://localhost:8446/pipelines/run \
  -H "Content-Type: application/json" \
  -d '{
    "file": "cross-itsm-incident.yaml",
    "dryRun": true,
    "vars": {
      "user": "j.doe",
      "server": "DB-PROD",
      "sessionId": "s-1001",
      "fudoUserId": 42,
      "evidence": ["multiple failed sudo attempts", "unexpected session recording gap"]
    }
  }'
```

## YAML format

### Simple action step

```yaml
steps:
  - name: 'Create ServiceNow incident'
    system: servicenow
    action: incidents.create
    params:
      short_description: 'PAM alert for {{ vars.user }}'
      priority: 1
```

### Conditional step

```yaml
steps:
  - name: 'Disable account'
    condition:
      left: '{{ vars.forceContainment }}'
      equals: true
    system: active-directory
    action: users.update
    params:
      sam: '{{ vars.user }}'
      enabled: false
```

Supported condition forms:

- boolean literal: `condition: true`
- truthy check: `condition: '{{ trigger.autoApprove }}'`
- comparison object: `left` with `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`
- grouped conditions: `all`, `any`, `not`
- value presence: `exists`, `truthy`, `falsy`, `contains`, `in`

### Parallel block

```yaml
steps:
  - name: 'Create peer incidents'
    parallel:
      - name: 'ServiceNow'
        system: servicenow
        action: incidents.create
      - name: 'JSM'
        system: jsm
        action: issues.create
```

### Foreach loop

```yaml
steps:
  - name: 'Inspect each CI'
    foreach:
      items: '{{ trigger.cis }}'
      as: ci
      steps:
        - name: 'Lookup ServiceNow CI'
          system: servicenow
          action: table.list
          params:
            tableName: 'cmdb_ci_server'
            sysparm_query: 'name={{ vars.ci }}'
```

Loop variables are available under:

- `{{ vars.<alias> }}`
- `{{ loop.item }}`
- `{{ loop.<alias> }}`
- `{{ loop.index }}`
- `{{ loop.position }}`
- `{{ loop.total }}`

### Variable resolution

You can reference:

- `{{ trigger.user }}`
- `{{ vars.group }}`
- `{{ steps.Create ServiceNow incident.result.result.number }}`
- `{{ steps.Open peer incidents / Create ServiceNow peer incident.result.result.sys_id }}`

Whole-value templates keep arrays and objects intact, which is important for `foreach.items`.

## Included templates

Existing templates:

- `onboarding-with-approval.yaml`
- `offboarding-emergency.yaml`
- `jit-temporary-access.yaml`
- `password-rotation-campaign.yaml`
- `security-incident-response.yaml`

New v2 templates:

- `cross-itsm-incident.yaml`
- `cmdb-reconciliation.yaml`
- `multi-pam-password-rotation.yaml`
- `azure-ad-pim-jit.yaml`
- `remedy-major-incident-bridge.yaml`

## Notes on execution

- top-level run output keeps step order intact
- nested steps are tracked with qualified names such as `Parent Step / Child Step`
- parallel branches run concurrently
- `foreach` iterations run sequentially per item
- rollback remains available via the `rollback:` array

## Tests

```bash
npm test
```

The test suite covers:

- API endpoints
- connector registration
- validation of the new templates
- `condition`, `parallel` and `foreach` runner behavior
