#!/usr/bin/env bash
# Measures test assemblies beyond the master push corset (Core + Decisioning fast-core).
# Intended for workflow_dispatch on master and local pre-push sanity when corset is green.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

filter_fast='Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord'
filter_integration='Category=Integration&Category!=Slow'
default_ci_sql_test='Server=127.0.0.1,1433;User Id=sa;Password=LocalTesting123!;TrustServerCertificate=True;Initial Catalog=ArchLucidPersistenceTests'

echo "=== trunk-matrix-measurement ==="
echo "repo: $repo_root"
echo "filter_fast: $filter_fast"
echo

probe_sql_integration_host() {
  if bash "${repo_root}/scripts/ci/probe-sql-integration-host.sh"; then
    return 0
  fi

  return 1
}

ensure_sql_integration_env() {
  if [ -n "${ARCHLUCID_SQL_TEST:-}" ] || [ -n "${ARCHLUCID_API_TEST_SQL:-}" ]; then
    return 0
  fi

  export ARCHLUCID_SQL_TEST="${default_ci_sql_test}"
}

run_project() {
  local label="$1"
  local project_path="$2"
  local filter="$3"

  echo "--- $label ($project_path) filter=$filter ---"

  if [[ ! -f "$project_path" ]]; then
    echo "SKIP: missing $project_path"
    return 0
  fi

  dotnet test "$project_path" -c Release --filter "$filter" \
    --logger "console;verbosity=minimal" 2>&1 | tail -5
  echo
}

dotnet build ArchLucid.Active.slnf -c Release --nologo -v q

run_project "ArchLucid.Application.Tests (fast-core slice)" \
  "ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj" \
  "$filter_fast"

run_project "ArchLucid.Api.Tests (fast-core slice)" \
  "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj" \
  "$filter_fast"

run_project "ArchLucid.AgentRuntime.Tests (fast-core slice)" \
  "ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj" \
  "$filter_fast"

run_project "ArchLucid.Host.Composition.Tests (fast-core slice)" \
  "ArchLucid.Host.Composition.Tests/ArchLucid.Host.Composition.Tests.csproj" \
  "$filter_fast"

if probe_sql_integration_host; then
  ensure_sql_integration_env
  echo "integration SQL host: reachable (ARCHLUCID_SQL_TEST=${ARCHLUCID_SQL_TEST:-<unset>} ARCHLUCID_API_TEST_SQL=${ARCHLUCID_API_TEST_SQL:-<unset>})"
  bash "${repo_root}/scripts/ci/ensure-ci-sql-catalog.sh" ArchLucidPersistenceTests
  run_project "ArchLucid.Api.Tests (integration, non-slow)" \
    "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj" \
    "$filter_integration"
else
  echo "--- ArchLucid.Api.Tests (integration, non-slow) ---"
  echo "SKIP: no reachable SQL host for integration tier."
  echo "Set ARCHLUCID_SQL_TEST or ARCHLUCID_API_TEST_SQL, start docker compose sqlserver, or run on GHA with the sqlserver service container."
  echo "Prior false-negative: ArchLucidApiFactory throws on Linux without env vars, producing hundreds of failures that are environment gaps, not trunk regressions."
fi

echo "trunk-matrix-measurement finished"
