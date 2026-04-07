# Azure AD / Entra ID Mock API

Microsoft Entra ID mock service for PAMlab. It simulates a focused subset of the Microsoft Graph API for:

- users and group lifecycle
- service principals / app registrations
- Conditional Access policies
- Privileged Identity Management (PIM) eligibility and activation
- OAuth 2.0 token issuance

## Start

```bash
npm install
npm start
```

Runs on `http://localhost:8452` by default.

## Key Endpoints

- `POST /oauth2/v2.0/token`
- `GET|POST /v1.0/users`
- `GET|PATCH|DELETE /v1.0/users/{id}`
- `GET /v1.0/users/{id}/memberOf`
- `POST /v1.0/users/{id}/revokeSignInSessions`
- `GET|POST /v1.0/groups`
- `GET|PATCH|DELETE /v1.0/groups/{id}`
- `GET|POST /v1.0/groups/{id}/members`
- `DELETE /v1.0/groups/{id}/members/{memberId}`
- `GET|POST /v1.0/servicePrincipals`
- `GET /v1.0/servicePrincipals/{id}`
- `GET|POST /v1.0/identity/conditionalAccess/policies`
- `GET|PATCH|DELETE /v1.0/identity/conditionalAccess/policies/{id}`
- `GET /v1.0/roleManagement/directory/roleAssignments`
- `GET /v1.0/roleManagement/directory/roleEligibilityScheduleRequests`
- `POST /v1.0/roleManagement/directory/roleAssignmentScheduleRequests`
- `GET /v1.0/roleManagement/directory/roleDefinitions`
- `GET /v1.0/me`

## Seed Data

Included out of the box:

- hybrid users aligned with the AD mock (`admin`, `j.doe`, `a.smith`, `b.wilson`, `c.jones`)
- cloud-only identities
- groups: `Cloud-Admins`, `Azure-Contributors`, `PIM-Eligible`
- service principals: `svc-pam-integration`, `svc-fudo-sync`
- Conditional Access policies for MFA and legacy auth blocking
- PIM role definitions and seeded eligibilities

## Default OAuth Client

Use this for the mock client-credentials flow:

- `client_id`: `11111111-2222-3333-4444-555555555551`
- `client_secret`: `PAMlab-Secret-1!`

## Tests

```bash
npm test
```
