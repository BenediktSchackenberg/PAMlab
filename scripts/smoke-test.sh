#!/usr/bin/env bash
# PAMlab Smoke Test — Quick E2E verification of all mock services
set -euo pipefail

FUDO=http://localhost:8443
M42=http://localhost:8444
AD=http://localhost:8445
PIPELINE=http://localhost:8446
SNOW=http://localhost:8447
JSM=http://localhost:8448
REMEDY=http://localhost:8449
TOKEN="pamlab-dev-token"

PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "[PASS] $name"
    ((PASS++))
  else
    echo "[FAIL] $name (expected $expected, got $actual)"
    ((FAIL++))
  fi
}

check_not() {
  local name="$1" not_expected="$2" actual="$3"
  if [ "$actual" != "$not_expected" ]; then
    echo "[PASS] $name"
    ((PASS++))
  else
    echo "[FAIL] $name (got unexpected $actual)"
    ((FAIL++))
  fi
}

echo "=== PAMlab Smoke Test ==="
echo ""

# 1. Health checks
echo "--- Health Checks ---"
for svc in "$FUDO:Fudo" "$M42:Matrix42" "$AD:AD" "$PIPELINE:Pipeline" "$SNOW:ServiceNow" "$JSM:JSM" "$REMEDY:Remedy"; do
  url="${svc%%:*}"
  name="${svc##*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url/health" 2>/dev/null || echo "000")
  check "$name health" "200" "$code"
done

# 2. AD auth (valid + invalid)
echo ""
echo "--- AD Auth ---"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$AD/api/ad/auth/bind" \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=admin","password":"admin"}')
check "AD valid auth" "200" "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$AD/api/ad/auth/bind" \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=admin","password":"wrongpass"}')
check "AD invalid auth rejected" "401" "$code"

# 3. Remedy auth (valid + invalid)
echo ""
echo "--- Remedy Auth ---"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$REMEDY/api/jwt/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"Allen","password":"Password1!"}')
check "Remedy valid auth" "200" "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$REMEDY/api/jwt/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"Allen","password":"wrong"}')
check "Remedy invalid auth rejected" "401" "$code"

# 4. Create Matrix42 ticket
echo ""
echo "--- Matrix42 Ticket ---"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$M42/m42Services/api/tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Ticket","description":"Created by smoke-test.sh","type":"onboarding"}')
check "Matrix42 create ticket" "201" "$code"

# 5. Create AD user + assign to group
echo ""
echo "--- AD User + Group ---"
AD_TOKEN=$(curl -s -X POST "$AD/api/ad/auth/bind" \
  -H "Content-Type: application/json" \
  -d '{"dn":"CN=admin","password":"admin"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$AD/api/ad/users" \
  -H "Authorization: Bearer $AD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sAMAccountName":"smoke.test","cn":"Smoke Test","givenName":"Smoke","sn":"Test"}')
check "AD create user" "200" "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$AD/api/ad/groups/GRP-RDP-Admins/members" \
  -H "Authorization: Bearer $AD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"members":["smoke.test"]}')
check "AD assign user to group" "200" "$code"

# 6. Create Fudo account (no server_id — tests auto-assign)
echo ""
echo "--- Fudo Account ---"
FUDO_TOKEN=$(curl -s -X POST "$FUDO/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}' | grep -o '"session_token":"[^"]*"' | cut -d'"' -f4)

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$FUDO/api/v2/accounts" \
  -H "Authorization: Bearer $FUDO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-test-account","type":"regular","credentials":{"protocol":"ssh","login":"smokeuser"}}')
check "Fudo create account (auto-assign server)" "201" "$code"

# 7. Register Matrix42 webhook
echo ""
echo "--- Webhooks ---"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$M42/m42Services/api/webhooks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:9999/hook","events":["ticket.created"]}')
check "Matrix42 register webhook" "201" "$code"

# 8. Register JSM webhook
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$JSM/rest/webhooks/1.0/webhook" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-test","url":"http://localhost:9999/hook","events":["jira:issue_created"]}')
check "JSM register webhook" "201" "$code"

# 9. Pipeline dry-run
echo ""
echo "--- Pipeline ---"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$PIPELINE/pipelines/run" \
  -H "Content-Type: application/json" \
  -d '{"file":"onboarding-mit-genehmigung","dryRun":true,"params":{"employeeName":"Smoke Test","department":"QA"}}')
check "Pipeline onboarding dry-run" "200" "$code"

# Summary
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
