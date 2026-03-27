# ❄️ ServiceNow ITSM Mock API

Mock implementation of the ServiceNow REST API for PAMlab — simulating incidents, change requests, CMDB, and service catalog.

## Quick Start

```bash
# With Docker (recommended)
docker-compose up servicenow-mock

# Standalone
cd servicenow-mock-api
npm install
npm start
# → http://localhost:8447
```

## Authentication

### Default Token
```bash
curl -H "Authorization: Bearer snow-mock-token-pamlab-2024" \
  http://localhost:8447/api/now/table/incident
```

### Generate Token
```bash
curl -X POST http://localhost:8447/api/now/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Basic Auth
```bash
curl -u admin:admin http://localhost:8447/api/now/table/incident
```

## Core: Table API

The generic Table API works for any table (`incident`, `change_request`, `cmdb_ci_server`, `sys_user`, `sys_user_group`, `sc_request`, `sc_req_item`, `cmdb_rel_ci`, `sys_user_grmember`).

### List Records
```bash
# All incidents
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident"

# With query: high priority incidents in progress
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident?sysparm_query=priority<=2^state=2&sysparm_limit=10"

# Select specific fields
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident?sysparm_fields=number,short_description,priority,state"

# Pagination
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident?sysparm_limit=5&sysparm_offset=0"
```

### Query Syntax (`sysparm_query`)
| Operator | Example | Description |
|----------|---------|-------------|
| `=` | `priority=1` | Equals |
| `!=` | `state!=7` | Not equals |
| `LIKE` | `short_descriptionLIKEfudo` | Contains |
| `STARTSWITH` | `numberSTARTSWITHINC` | Starts with |
| `ENDSWITH` | `nameENDSWITH01` | Ends with |
| `IN` | `priorityIN1,2` | In set |
| `>`, `<`, `>=`, `<=` | `priority<=2` | Comparison |
| `^` | `priority=1^state=2` | AND |
| `ORDERBY` | `ORDERBYpriority` | Sort ascending |
| `ORDERBYDESC` | `ORDERBYDESCsys_created_on` | Sort descending |

### Single Record
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident/{sys_id}"
```

### Create Record
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"short_description":"Test incident","priority":3,"impact":2,"urgency":2}' \
  "http://localhost:8447/api/now/table/incident"
```

### Update Record (full / partial)
```bash
# Full update (PUT)
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"short_description":"Updated","priority":2}' \
  "http://localhost:8447/api/now/table/incident/{sys_id}"

# Partial update (PATCH)
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state":2}' \
  "http://localhost:8447/api/now/table/incident/{sys_id}"
```

### Delete Record
```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/table/incident/{sys_id}"
```

## Incident Convenience Endpoints

```bash
# Resolve incident
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"close_notes":"Root cause identified","close_code":"Solved (Permanently)"}' \
  "http://localhost:8447/api/now/incident/resolve/{sys_id}"

# Close incident
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/incident/close/{sys_id}"

# Incident statistics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/incident/stats"
```

## Change Management

```bash
# Approve change
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"comments":"Approved by CAB"}' \
  "http://localhost:8447/api/now/change/approve/{sys_id}"

# Reject change
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"comments":"Risk too high"}' \
  "http://localhost:8447/api/now/change/reject/{sys_id}"

# Start implementation
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/change/implement/{sys_id}"

# View schedule
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/change/schedule"
```

## CMDB

```bash
# Get CI relationships
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/cmdb/ci/{sys_id}/relations"

# Create relationship
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child":"{target_sys_id}","type":"depends_on"}' \
  "http://localhost:8447/api/now/cmdb/ci/{sys_id}/relations"

# Topology map
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/cmdb/topology"
```

## Service Catalog

```bash
# List catalog items
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/catalog/items"

# Order an item
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requested_for":"t.developer","description":"Need access"}' \
  "http://localhost:8447/api/now/catalog/items/cat-priv-access/order"

# Check request status
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/catalog/requests/REQ0001/status"
```

## Webhooks / Events

```bash
# Register webhook
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://pipeline-engine:8446/webhook","table":"incident"}' \
  "http://localhost:8447/api/now/events/register"

# List webhooks
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/events/list"

# Remove webhook
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8447/api/now/events/{id}"
```

## Seed Data

### Users (matching AD mock)
| Username | Name | Department | Role |
|----------|------|------------|------|
| admin | System Administrator | IT Operations | admin |
| j.doe | John Doe | IT Operations | itil |
| a.smith | Alice Smith | Engineering | itil |
| b.wilson | Bob Wilson | Engineering | itil |
| c.jones | Carol Jones | Management | itil, admin |
| svc-integration | Service Integration | IT Operations | web_service_admin |
| svc-fudo-sync | Fudo Sync Service | IT Operations | web_service_admin |
| svc-matrix42 | Matrix42 Sync Service | IT Operations | web_service_admin |
| t.developer | Tom Developer | Engineering | itil |
| l.leaving | Lisa Leaving (inactive) | Finance | itil |

### Incidents
| Number | Priority | Description |
|--------|----------|-------------|
| INC0001 | P1 Critical | Database server unreachable (DB-PROD) |
| INC0002 | P2 High | VPN authentication failures |
| INC0003 | P3 Medium | ERP application slow response |
| INC0004 | P4 Low | Printer not responding Floor 2 |
| INC0005 | P2 High | Fudo PAM session recording gap |
| INC0006 | P3 Medium | Password rotation failed for svc accounts |

### CMDB Servers
| Name | IP | OS |
|------|----|----|
| DC01 | 10.0.1.10 | Windows Server 2022 |
| DB-PROD | 10.0.1.20 | Ubuntu 22.04 |
| APP-ERP | 10.0.1.30 | RHEL 9 |
| FILE-SRV01 | 10.0.1.40 | Windows Server 2022 |
| FUDO-PAM | 10.0.1.50 | Fudo PAM Appliance |

## Integration with PAMlab

- **Fudo PAM** (8443): Incidents reference Fudo session recording gaps; change requests for PAM upgrades
- **Matrix42 ESM** (8444): INC0002 correlates with Matrix42 INC001; shared service accounts
- **Active Directory** (8445): Users match AD mock users; CHG0004 references AD group restructuring
- **Pipeline Engine** (8446): Connects via `SNOW_URL` environment variable for automated workflows

## Response Format

All responses follow ServiceNow convention:
```json
{
  "result": [ ... ]  // or { ... } for single records
}
```

List endpoints include `X-Total-Count` header with total matching records.

## State Values

**Incident**: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed

**Change Request**: -5=New, -4=Assess, -3=Authorize, -2=Scheduled, -1=Implement, 0=Review, 3=Closed, 4=Cancelled
