# Matrix42 Mock API — Data API (Fragments & Objects)

All data endpoints require authentication via `Authorization: Bearer <token>`.

Base path: `/m42Services/api/data`

## Fragments

Fragments are the primary CRUD interface for individual records.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/fragments/:ddName` | 201 | Create a new fragment |
| `GET` | `/fragments/:ddName` | 200 | List all fragments for a data definition |
| `GET` | `/fragments/:ddName/:fragmentId` | 200 | Read a single fragment by ID |
| `GET` | `/fragments/:ddName/:fragmentId/schema-info` | 200 | Read fragment with schema metadata |
| `PUT` | `/fragments/:ddName/:fragmentId` | 200 | Update a fragment |
| `DELETE` | `/fragments/:ddName/:fragmentId` | 204 | Delete a fragment |

### Examples

**Create:**
```bash
curl -X POST http://localhost:8444/m42Services/api/data/fragments/SPSEmployeeClassBase \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"FirstName":"Jane","LastName":"Doe","Email":"jane@example.com"}'
# → 201 {"ID":"<uuid>","FirstName":"Jane",...}
```

**List:**
```bash
curl http://localhost:8444/m42Services/api/data/fragments/SPSEmployeeClassBase \
  -H "Authorization: Bearer pamlab-dev-token"
# → 200 {"columns":["ID","FirstName",...],"items":[...]}
```

**Delete:**
```bash
curl -X DELETE http://localhost:8444/m42Services/api/data/fragments/SPSEmployeeClassBase/<id> \
  -H "Authorization: Bearer pamlab-dev-token"
# → 204 No Content
```

## Objects (Query)

For bulk listing and filtering, use the objects query endpoint instead of fragment listing.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/objects/query` | 200 | Query objects with filtering and pagination |
| `POST` | `/objects/:ddName` | 201 | Create an object |
| `GET` | `/objects/:ddName/:objectId` | 200 | Read an object |
| `PUT` | `/objects/:ddName/:objectId` | 200 | Update an object |
| `DELETE` | `/objects/:ddName/:objectId` | 200 | Delete an object |

### Query Example

```bash
curl -X POST http://localhost:8444/m42Services/api/data/objects/query \
  -H "Authorization: Bearer pamlab-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"ddName":"SPSEmployeeClassBase","columns":["ID","FirstName","LastName"],"pageSize":10}'
# → 200 {"Total":8,"Page":1,"PageSize":10,"Columns":[...],"Data":[...]}
```

### Query Body Parameters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ddName` | string | required | Data definition name |
| `columns` | string[] | all | Columns to return |
| `filter` | string | — | Case-insensitive substring filter |
| `pageSize` | number | 50 | Results per page |
| `page` | number | 1 | Page number |
