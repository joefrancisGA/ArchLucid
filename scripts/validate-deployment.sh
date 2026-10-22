#!/usr/bin/env bash
# Read-only curl checks (bash). Usage:
#   ./scripts/validate-deployment.sh "http://localhost:5128"
# Optional second arg: API key value for X-API-Key.

set -euo pipefail
BASE_URL="${1:?Base URL required}"
KEY="${2:-}"
FAIL=0

hc() {
  name="$1"
  url="$2"
  start=$(date +%s%3N 2>/dev/null || date +%s)
  if [[ -n "$KEY" ]]; then
    code=$(curl -sS -o /dev/null -w "%{http_code}" -H "X-API-Key: $KEY" "$url" || true)
  else
    code=$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)
  fi
  end=$(date +%s%3N 2>/dev/null || date +%s)
  ms=$((end - start))
  echo "$code  ${ms}ms  $name"
  if [[ "$code" != "$3" ]]; then FAIL=1; fi
}

echo "--- validate-deployment (bash) -> $BASE_URL"
hc "GET /health/live" "$BASE_URL/health/live" "200"
hc "GET /health/ready" "$BASE_URL/health/ready" "200"
hc "GET /version" "$BASE_URL/version" "200"
hc "GET /openapi/v1.json" "$BASE_URL/openapi/v1.json" "200"
if [[ -n "$KEY" ]]; then
  code=$(curl -sS -o /dev/null -w "%{http_code}" -H "X-API-Key: $KEY" "$BASE_URL/v1/architecture/runs" || true)
else
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/v1/architecture/runs" || true)
fi
echo "$code  --  GET /v1/architecture/runs (200 with key; 401/403 acceptable without)"
if ! [[ "$code" == "200" || "$code" == "401" || "$code" == "403" ]]; then FAIL=1; fi

if [[ "$FAIL" -ne 0 ]]; then exit 1; fi
exit 0
