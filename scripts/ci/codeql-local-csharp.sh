#!/usr/bin/env bash
# Local C# CodeQL mirror: security-extended + repo model pack (via codescanning-config).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}"

if ! command -v codeql >/dev/null 2>&1
then
  echo "Install CodeQL CLI and add to PATH (https://github.com/github/codeql-cli-binaries/releases)." >&2
  exit 1
fi

if ! command -v dotnet >/dev/null 2>&1
then
  echo "dotnet SDK not on PATH." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1
then
  echo "python3 not on PATH (required for SARIF gate)." >&2
  exit 1
fi

CFG="${ROOT}/.github/codeql/codeql-config.yml"
OUT_DIR="${ROOT}/codeql-out"
DB="${OUT_DIR}/db-csharp"
SARIF="${OUT_DIR}/results-csharp.sarif"

mkdir -p "${OUT_DIR}"

codeql database create "${DB}" \
  --language=csharp \
  --build-mode=none \
  --source-root="${ROOT}" \
  --codescanning-config="${CFG}" \
  --command="dotnet restore ArchLucid.sln" \
  --working-dir="${ROOT}" \
  --overwrite

codeql database analyze "${DB}" security-extended \
  --download \
  --format=sarif-latest \
  --output="${SARIF}" \
  --sarif-category=/language:csharp

python3 "${ROOT}/scripts/ci/assert_codeql_sarif_clean.py" "${OUT_DIR}"
