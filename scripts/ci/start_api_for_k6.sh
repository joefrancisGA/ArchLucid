#!/usr/bin/env bash
# Reusable: create SQL catalog, start ArchLucid.Api in background, wait for /health/ready,
# then verify GET /v1/audit/search (same path as k6 audit_search) returns 200 before k6 runs.
# Usage: ./scripts/ci/start_api_for_k6.sh <database_name> <log_file> <pid_file>
# Env: SA_PASSWORD (default: LocalTesting123!), API_PORT (default: 5128)
set -euo pipefail

DB_NAME="${1:?usage: start_api_for_k6.sh <database_name> <log_file> <pid_file>}"
LOG_FILE="${2:?usage: start_api_for_k6.sh <database_name> <log_file> <pid_file>}"
PID_FILE="${3:?usage: start_api_for_k6.sh <database_name> <log_file> <pid_file>}"

SA_PASSWORD="${SA_PASSWORD:-LocalTesting123!}"
API_PORT="${API_PORT:-5128}"
API_URL="http://127.0.0.1:${API_PORT}"

echo "Creating SQL catalog ${DB_NAME}..."
docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
  mcr.microsoft.com/mssql/server:2022-latest \
  -S "127.0.0.1,1433" -U sa -P "${SA_PASSWORD}" -C \
  -Q "IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'${DB_NAME}') CREATE DATABASE [${DB_NAME}];"

echo "Starting ArchLucid.Api (background, port ${API_PORT})..."
export API_URL="http://127.0.0.1:${API_PORT}"
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="${API_URL}"
export ConnectionStrings__ArchLucid="Server=127.0.0.1,1433;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;Initial Catalog=${DB_NAME}"
export ArchLucid__StorageProvider=Sql
export ArchLucidAuth__Mode=DevelopmentBypass
export Authentication__ApiKey__DevelopmentBypassAll=true
export AgentExecution__Mode=Simulator
# Match integration-test hosts: skip demo seed and trial preseed so write-path smoke is not competing with startup workers.
export Demo__Enabled=false
export Demo__SeedOnStartup=false
export TrialArchitecturePreseed__Enabled=false
# Parity with api-greenfield-boot / GreenfieldSqlApiFactory: readiness and create-run on cold CI SQL.
export DataConsistency__InitialDelaySeconds=0
export HostLeaderElection__Enabled=false
# k6 path uses appsettings.Advanced.json (chained in Program); DbUp + schema bootstrap run without database RLS.
export RateLimiting__FixedWindow__PermitLimit=200000
export RateLimiting__FixedWindow__WindowMinutes=1
# k6 create_run hits the full authority pipeline + sp_getapplock idempotency gate; 300s matches GreenfieldSqlApiFactory.
export ArchLucid__Persistence__DefaultSqlCommandTimeoutSeconds=300
export ArchLucid__CreateRun__DistributedIdempotencyLockTimeoutMilliseconds=180000
export AuthorityPipeline__PipelineTimeout=00:05:00

nohup dotnet run --no-build -c Release --no-launch-profile --project ArchLucid.Api/ArchLucid.Api.csproj > "${LOG_FILE}" 2>&1 &
echo $! > "${PID_FILE}"

export ARCHLUCID_API_READY_WAIT_ATTEMPTS="${ARCHLUCID_K6_READY_WAIT_ATTEMPTS:-180}"
export ARCHLUCID_API_READY_WAIT_SLEEP_SECONDS="${ARCHLUCID_K6_READY_WAIT_SLEEP_SECONDS:-2}"
bash scripts/ci/wait-for-api-ready.sh "${LOG_FILE}"

audit_code="$(curl -sS -o /dev/null -w "%{http_code}" "${API_URL}/v1/audit/search?take=1" -H "Accept: application/json")"
if [ "${audit_code}" != "200" ]; then
  echo "::error::GET /v1/audit/search (smoke) returned HTTP ${audit_code} — check API log for SQL/auth/RLS errors"
  tail -n 200 "${LOG_FILE}" || true
  exit 1
fi

list_runs_code="$(curl -sS -o /dev/null -w "%{http_code}" "${API_URL}/v1/architecture/reviews?limit=1" -H "Accept: application/json")"
if [ "${list_runs_code}" != "200" ]; then
  echo "::error::GET /v1/architecture/reviews (smoke) returned HTTP ${list_runs_code} — check API log for SQL/auth/RLS errors"
  tail -n 200 "${LOG_FILE}" || true
  exit 1
fi

create_run_body='{"requestId":"k6-startup-smoke-1","description":"k6 CI smoke architecture write-path test","systemName":"K6CiSmokeSystem","environment":"prod","cloudProvider":1,"constraints":[],"requiredCapabilities":["SQL"],"assumptions":[],"priorManifestVersion":null}'
create_run_code="$(curl -sS --max-time 360 -o "${LOG_FILE}.create-run-smoke.json" -w "%{http_code}" \
  -X POST "${API_URL}/v1/architecture/request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "${create_run_body}")"
if [ "${create_run_code}" != "200" ] && [ "${create_run_code}" != "201" ]; then
  echo "::error::POST /v1/architecture/request (smoke) returned HTTP ${create_run_code} — check API log for auth/trial/validation errors"
  head -c 500 "${LOG_FILE}.create-run-smoke.json" 2>/dev/null || true
  echo ""
  tail -n 200 "${LOG_FILE}" || true
  exit 1
fi
