#!/bin/bash
# ============================================
#  PAMlab — Run All Tests
#  Usage: ./scripts/test-all.sh [--install]
# ============================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICES=(
  fudo-mock-api
  matrix42-mock-api
  ad-mock-api
  azure-ad-mock-api
  servicenow-mock-api
  jsm-mock-api
  remedy-mock-api
  pipeline-engine
  cyberark-mock-api
)

PASSED=0
FAILED=0
FAILURES=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  🧪 PAMlab — Full Test Suite              ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Install dependencies if --install flag is passed or node_modules missing
install_deps() {
  local dir="$1"
  if [ "$INSTALL" = "true" ] || [ ! -d "$dir/node_modules" ]; then
    echo "  📦 Installing dependencies..."
    (cd "$dir" && npm install --silent 2>&1 | tail -1)
  fi
}

# Parse args
INSTALL=false
if [ "$1" = "--install" ]; then
  INSTALL=true
fi

for service in "${SERVICES[@]}"; do
  dir="$REPO_ROOT/$service"
  
  if [ ! -d "$dir" ]; then
    echo -e "${RED}  ⚠ $service — directory not found, skipping${NC}"
    continue
  fi

  echo -e "${BOLD}▸ $service${NC}"
  install_deps "$dir"

  if (cd "$dir" && npm test 2>&1 | tail -5); then
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ passed${NC}"
  else
    FAILED=$((FAILED + 1))
    FAILURES+="  ❌ $service\n"
    echo -e "  ${RED}❌ FAILED${NC}"
  fi
  echo ""
done

# Summary
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC} (${#SERVICES[@]} services)"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"

if [ -n "$FAILURES" ]; then
  echo ""
  echo "Failed services:"
  echo -e "$FAILURES"
  exit 1
fi

echo ""
echo -e "${GREEN}All tests passed! 🎉${NC}"
