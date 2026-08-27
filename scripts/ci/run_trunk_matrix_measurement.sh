#!/usr/bin/env bash
# Measures test assemblies beyond the master push corset (Core + Decisioning fast-core).
# Intended for workflow_dispatch on master and local pre-push sanity when corset is green.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

filter_fast='Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord'
filter_integration='Category=Integration&Category!=Slow'

echo "=== trunk-matrix-measurement ==="
echo "repo: $repo_root"
echo "filter_fast: $filter_fast"
echo

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

run_project "ArchLucid.Api.Tests (integration, non-slow)" \
  "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj" \
  "$filter_integration"

echo "trunk-matrix-measurement finished"
