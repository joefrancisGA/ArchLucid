#!/usr/bin/env bash
# Fast local check for ArchLucid.Persistence.Tests — no Coverlet.
# Strict merged + per-package line gates run in CI (job dotnet-full-regression); see docs/library/CODE_COVERAGE.md.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
dotnet test "${ROOT}/ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj" -c Release "$@"
