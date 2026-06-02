#!/usr/bin/env bash
# Post-corset artifacts: CycloneDX SBOM + ReportGenerator HTML from corset Cobertura upload.
# Invoked by workflow job "dotnet-fast-core-artifacts" (full CI only; after dotnet-fast-core).
#
# Expects:
#   - Restored/built tree optional for SBOM (script restores/builds Api project)
#   - Cobertura files under RUNNER_TEMP/coverage-fast-core (downloaded from corset artifact)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COV_DIR="${RUNNER_TEMP}/coverage-fast-core"
OUT="${RUNNER_TEMP}/coverage-report-fast-core"

echo "Generating .NET SBOM (CycloneDX)..."
dotnet tool install CycloneDX --tool-path "${RUNNER_TEMP}/cdx" --verbosity quiet
CDX="${RUNNER_TEMP}/cdx/dotnet-cyclonedx"
if [ ! -x "$CDX" ]; then
  CDX="${RUNNER_TEMP}/cdx/dotnet-CycloneDX"
fi
"$CDX" ArchLucid.Api/ArchLucid.Api.csproj -o sbom-dotnet.json

echo "Merging fast-core coverage (ReportGenerator)..."
dotnet tool restore
if [ ! -d "$COV_DIR" ]; then
  echo "::error::Coverage directory missing: $COV_DIR"
  exit 1
fi
mapfile -d '' -t cov_files < <(find "$COV_DIR" -type f -name 'coverage.cobertura.xml' -print0)
if [ "${#cov_files[@]}" -eq 0 ]; then
  echo "::error::No coverage.cobertura.xml under $COV_DIR (coverlet did not emit Cobertura)."
  find "$COV_DIR" -type f -maxdepth 6 2>/dev/null | head -n 200 || true
  exit 1
fi
report_list=$(IFS=';'; printf '%s' "${cov_files[*]}")
dotnet reportgenerator \
  "-reports:${report_list}" \
  "-targetdir:${OUT}" \
  "-reporttypes:Html;TextSummary;MarkdownSummaryGithub" \
  -verbosity:Info
if [ ! -f "${OUT}/SummaryGithub.md" ]; then
  echo "::error::ReportGenerator did not write SummaryGithub.md under ${OUT}"
  ls -la "$OUT" || true
  exit 1
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "${OUT}/SummaryGithub.md" >> "${GITHUB_STEP_SUMMARY}"
fi

echo "dotnet-fast-core-artifacts finished successfully."
