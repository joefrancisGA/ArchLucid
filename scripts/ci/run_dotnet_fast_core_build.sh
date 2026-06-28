#!/usr/bin/env bash
# Tier 1 corset build: restore, vulnerability gates, full-solution Release build, CLI config lint.
# Test execution runs in parallel shard jobs (scripts/ci/run_fast_core_corset_shard.sh).

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

dotnet restore ArchLucid.sln

python3 scripts/ci/assert_nuget_no_high_critical_vulnerabilities.py
python -m unittest discover -s scripts/ci/tests -p "test_assert_nuget_no_high_critical_vulnerabilities.py"

dotnet build ArchLucid.sln --no-restore -c Release "/p:SourceRevisionId=$(git rev-parse HEAD)"

export ASPNETCORE_ENVIRONMENT=Development
dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj --no-build -c Release -- config lint

python3 scripts/ci/run_pilot_readiness_release_train_gate.py
python -m unittest discover -s scripts/ci/tests -p "test_run_pilot_readiness_release_train_gate.py"

echo "dotnet-fast-core-build finished successfully."
