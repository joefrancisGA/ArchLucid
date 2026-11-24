#!/usr/bin/env bash
# Tier 1 corset build: restore, vulnerability gates, full-solution Release build, CLI config lint.
# Test execution runs in parallel shard jobs (scripts/ci/run_fast_core_corset_shard.sh).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

dotnet restore ArchLucid.sln

python3 scripts/ci/assert_nuget_no_high_critical_vulnerabilities.py
python3 -m unittest discover -s scripts/ci/tests -p "test_assert_nuget_no_high_critical_vulnerabilities.py"

enum_audit_dir="${ENUM_AUDIT_OUTPUT:-$(mktemp -d)}"
mkdir -p "$enum_audit_dir"
if compgen -G "$enum_audit_dir/*.sarif" > /dev/null; then
  echo "::error::Stale enum audit SARIF files; use a clean directory."
  exit 1
fi

dotnet build ArchLucid.sln --no-restore -c Release "/p:SourceRevisionId=$(git rev-parse HEAD)" \
  -p:RunAnalyzers=true -p:RunAnalyzersDuringBuild=true -p:EnumAuditInventory=true \
  "-p:EnumAuditLogDirectory=$enum_audit_dir"

python3 -m unittest discover -s scripts/ci/tests -p "test_enum_boundary_gate.py"
gate_args=(--reports "$enum_audit_dir" --exceptions scripts/ci/data/enum_boundary_exceptions.json)
case "${GITHUB_EVENT_NAME:-}" in
  pull_request|merge_group)
    : "${ENUM_AUDIT_BASE_SHA:?Missing enum audit base SHA}"
    gate_args+=(--base-ref "$ENUM_AUDIT_BASE_SHA")
    ;;
  *)
    if [ -n "${ENUM_AUDIT_BASE_SHA:-}" ]; then
      gate_args+=(--base-ref "$ENUM_AUDIT_BASE_SHA")
    else
      gate_args+=(--inventory-only)
    fi
    ;;
esac
python3 scripts/ci/enum_boundary_gate.py "${gate_args[@]}"

# Reuse the already-built test assembly; never restore or compile a second time.
dotnet test ArchLucid.Analyzers.Tests/ArchLucid.Analyzers.Tests.csproj \
  --no-build --no-restore -c Release --filter "FullyQualifiedName~EnumBoundaryReviewAnalyzerTests"

export ASPNETCORE_ENVIRONMENT=Development
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj --no-build -c Release -- config lint

python3 scripts/ci/run_pilot_readiness_release_train_gate.py
python3 -m unittest discover -s scripts/ci/tests -p "test_run_pilot_readiness_release_train_gate.py"

echo "dotnet-fast-core-build finished successfully."
