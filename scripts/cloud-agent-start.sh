#!/usr/bin/env bash
set -euo pipefail

# Per-boot services: API (in-memory storage, no SQL) and the Next.js dev server.
# Safe to rerun. Skips a service that is already answering.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

export DOTNET_ROOT="${DOTNET_ROOT:-${HOME}/.dotnet}"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="${NUGET_PACKAGES:-${HOME}/.nuget/packages}"
export PATH="${HOME}/.local/bin:/usr/local/bin:${DOTNET_ROOT}:${PATH}"

API_URL="http://127.0.0.1:5128/health/live"
UI_URL="http://127.0.0.1:3000/help"

ensure_session() {
  local name="$1"
  local probe="$2"
  local command="$3"

  if curl -sf "${probe}" >/dev/null 2>&1; then
    echo "${name} already responding at ${probe}"
    return 0
  fi

  if tmux has-session -t "${name}" 2>/dev/null; then
    echo "${name} session exists and is still starting"
    return 0
  fi

  tmux new-session -d -s "${name}" "bash -lc $(printf '%q' "${command}")"
  echo "Started ${name}"
}

API_CMD="cd ${REPO_ROOT} && export DOTNET_ROOT=\"\${HOME}/.dotnet\" && export PATH=\"/usr/local/bin:\${DOTNET_ROOT}:\${PATH}\" && export DOTNET_CLI_TELEMETRY_OPTOUT=1 && export DOTNET_NOLOGO=1 && export NUGET_PACKAGES=\"\${HOME}/.nuget/packages\" && export ASPNETCORE_ENVIRONMENT=Development && export ArchLucid__StorageProvider=InMemory && export ArchLucidAuth__AllowTestActorHeaders=true && export DataConsistency__InitialDelaySeconds=0 && export HostLeaderElection__Enabled=false && exec dotnet run --project ArchLucid.Api/ArchLucid.Api.csproj --no-launch-profile --urls http://127.0.0.1:5128 >>/tmp/archlucid-api.log 2>&1"

UI_CMD="cd ${REPO_ROOT}/archlucid-ui && export PATH=\"\${HOME}/.local/bin:/usr/local/bin:\${PATH}\" && exec npm run dev -- --hostname 0.0.0.0 --port 3000 >>/tmp/archlucid-ui.log 2>&1"

ensure_session archlucid_api "${API_URL}" "${API_CMD}"
ensure_session archlucid_ui "${UI_URL}" "${UI_CMD}"

for _ in $(seq 1 180); do
  api_ok=0
  ui_ok=0
  curl -sf "${API_URL}" >/dev/null 2>&1 && api_ok=1
  curl -sf -o /dev/null "${UI_URL}" && ui_ok=1
  if [[ "${api_ok}" -eq 1 && "${ui_ok}" -eq 1 ]]; then
    echo "ArchLucid API and UI are ready"
    echo "API health: http://127.0.0.1:5128/health/live"
    echo "UI: http://localhost:3000 (use localhost; 127.0.0.1 blocks Next.js dev assets)"
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for ArchLucid API (${API_URL}) and UI (${UI_URL})." >&2
echo "--- /tmp/archlucid-api.log ---" >&2
tail -n 80 /tmp/archlucid-api.log >&2 || true
echo "--- /tmp/archlucid-ui.log ---" >&2
tail -n 80 /tmp/archlucid-ui.log >&2 || true
exit 1
