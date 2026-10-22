#!/usr/bin/env bash
# ArchLucid CI/CD governance gate — create review from repo context, execute, commit, fail on
# PreCommitGateResult (409 governance-pre-commit-blocked) or PilotStrict HOLD signals.
# Requires: curl, jq, mktemp.
#
# Environment (required unless noted):
#   ARCHLUCID_API_URL          — API base, e.g. https://api.example.com (no trailing slash)
#   ARCHLUCID_API_KEY          — X-Api-Key value (or use ARCHLUCID_BEARER_TOKEN)
#   ARCHLUCID_BEARER_TOKEN     — Bearer JWT (OIDC / service principal token exchange output)
# Optional:
#   ARCHLUCID_REQUEST_FILE       — JSON for POST /v1/architecture/request (default: .archlucid/architecture-request.json)
#   ARCHLUCID_MAX_WAIT_SEC       — poll budget (default: 1800)
#   ARCHLUCID_UI_BASE_URL        — operator UI base for review links in CI output
#   ARCHLUCID_CORRELATION_ID     — X-Correlation-ID header (default: ci-governance-gate-<timestamp>)
#   ARCHLUCID_SKIP_COMMIT        — when "1", stop after ReadyForCommit without attempting commit
#
# Returns: 0 = pass, 1 = governance / PilotStrict gate failed, 2 = usage or API error

set -euo pipefail

if [[ -z "${ARCHLUCID_API_URL:-}" ]]; then
  echo "archlucid-governance-gate: set ARCHLUCID_API_URL" >&2
  exit 2
fi

if [[ -z "${ARCHLUCID_API_KEY:-}" && -z "${ARCHLUCID_BEARER_TOKEN:-}" ]]; then
  echo "archlucid-governance-gate: set ARCHLUCID_API_KEY or ARCHLUCID_BEARER_TOKEN" >&2
  exit 2
fi

API_BASE="${ARCHLUCID_API_URL%/}"
REQUEST_FILE="${ARCHLUCID_REQUEST_FILE:-.archlucid/architecture-request.json}"
MAX_WAIT="${ARCHLUCID_MAX_WAIT_SEC:-1800}"
CORRELATION_ID="${ARCHLUCID_CORRELATION_ID:-ci-governance-gate-$(date -u +%Y%m%d%H%M%S)}"
UI_BASE="${ARCHLUCID_UI_BASE_URL:-}"

if [[ ! -f "$REQUEST_FILE" ]]; then
  echo "archlucid-governance-gate: request file not found: $REQUEST_FILE" >&2
  exit 2
fi

if ! jq empty "$REQUEST_FILE" 2>/dev/null; then
  echo "archlucid-governance-gate: invalid JSON in $REQUEST_FILE" >&2
  exit 2
fi

auth_curl() {
  if [[ -n "${ARCHLUCID_BEARER_TOKEN:-}" ]]; then
    curl -sS "$@" -H "Authorization: Bearer ${ARCHLUCID_BEARER_TOKEN}"
  else
    curl -sS "$@" -H "X-Api-Key: ${ARCHLUCID_API_KEY}"
  fi
}

is_terminal_status() {
  local status="$1"
  case "$status" in
    4|5|6|8|ReadyForCommit|Committed|Failed|ExecutionCompletedQualityRejected) return 0 ;;
    *) return 1 ;;
  esac
}

is_quality_rejected() {
  local status="$1"
  [[ "$status" == "8" || "$status" == "ExecutionCompletedQualityRejected" ]]
}

is_failed_status() {
  local status="$1"
  [[ "$status" == "6" || "$status" == "Failed" ]]
}

is_ready_for_commit() {
  local status="$1"
  [[ "$status" == "4" || "$status" == "ReadyForCommit" ]]
}

fail_pilot_strict() {
  local run_id="$1"
  local detail="$2"
  echo "archlucid-governance-gate: PilotStrict HOLD — $detail (run $run_id)" >&2
  emit_run_links "$run_id"
  exit 1
}

emit_run_links() {
  local run_id="$1"
  echo "ArchLucid run id: $run_id"
  echo "Run detail API: $API_BASE/v1/architecture/run/$run_id"
  if [[ -n "$UI_BASE" ]]; then
    echo "Operator UI: ${UI_BASE%/}/reviews/$run_id"
  fi
}

REQ_JSON="$(jq --arg cid "$CORRELATION_ID" '
  .requestId = (.requestId // "ci-governance-gate") + "-" + ($cid | gsub("[^a-zA-Z0-9-]"; ""))
' "$REQUEST_FILE")"

CREATE_RES="$(mktemp)"
HTTP_CREATE="$(mktemp)"
auth_curl -o "$CREATE_RES" -w "%{http_code}" -X POST "$API_BASE/v1/architecture/request" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $CORRELATION_ID" \
  -d "$REQ_JSON" > "$HTTP_CREATE" || true
CODE_CREATE="$(cat "$HTTP_CREATE")"
if [[ "$CODE_CREATE" != "201" && "$CODE_CREATE" != "200" ]]; then
  echo "archlucid-governance-gate: create run failed: HTTP $CODE_CREATE" >&2
  cat "$CREATE_RES" >&2
  rm -f "$CREATE_RES" "$HTTP_CREATE"
  exit 2
fi

RUN_ID="$(jq -r '.run.runId // empty' < "$CREATE_RES")"
if [[ -z "$RUN_ID" ]]; then
  echo "archlucid-governance-gate: no runId in create response" >&2
  cat "$CREATE_RES" >&2
  rm -f "$CREATE_RES" "$HTTP_CREATE"
  exit 2
fi
rm -f "$CREATE_RES" "$HTTP_CREATE"

echo "Created ArchLucid review run: $RUN_ID"
emit_run_links "$RUN_ID"

EXEC_RES="$(mktemp)"
HTTP_EXEC="$(mktemp)"
auth_curl -o "$EXEC_RES" -w "%{http_code}" -X POST "$API_BASE/v1/architecture/run/$RUN_ID/execute" \
  -H "X-Correlation-ID: $CORRELATION_ID" > "$HTTP_EXEC" || true
CODE_EXEC="$(cat "$HTTP_EXEC")"
if [[ "$CODE_EXEC" != "200" && "$CODE_EXEC" != "202" && "$CODE_EXEC" != "409" ]]; then
  echo "archlucid-governance-gate: execute failed: HTTP $CODE_EXEC" >&2
  cat "$EXEC_RES" >&2
  rm -f "$EXEC_RES" "$HTTP_EXEC"
  exit 2
fi
rm -f "$EXEC_RES" "$HTTP_EXEC"

START_TS="$(date +%s)"
DEADLINE=$((START_TS + MAX_WAIT))
RUN_JSON="$(mktemp)"
while :; do
  auth_curl -o "$RUN_JSON" -H "X-Correlation-ID: $CORRELATION_ID" \
    "$API_BASE/v1/architecture/run/$RUN_ID" || true
  ST="$(jq -r '.run.status // empty' < "$RUN_JSON")"

  if is_terminal_status "$ST"; then
    break
  fi

  NOW="$(date +%s)"
  if (( NOW >= DEADLINE )); then
    echo "archlucid-governance-gate: timeout after ${MAX_WAIT}s waiting for terminal run status" >&2
    rm -f "$RUN_JSON"
    exit 2
  fi
  sleep 3
done

ST="$(jq -r '.run.status // empty' < "$RUN_JSON")"

if is_quality_rejected "$ST"; then
  fail_pilot_strict "$RUN_ID" "run status is ExecutionCompletedQualityRejected (quality gate blocked execute completion)"
fi

if is_failed_status "$ST"; then
  echo "archlucid-governance-gate: run $RUN_ID failed during execute" >&2
  cat "$RUN_JSON" >&2
  rm -f "$RUN_JSON"
  exit 2
fi

if ! is_ready_for_commit "$ST"; then
  echo "archlucid-governance-gate: run $RUN_ID ended in unexpected status: $ST" >&2
  cat "$RUN_JSON" >&2
  rm -f "$RUN_JSON"
  exit 2
fi

rm -f "$RUN_JSON"

if [[ "${ARCHLUCID_SKIP_COMMIT:-}" == "1" ]]; then
  echo "archlucid-governance-gate: ReadyForCommit — commit skipped (ARCHLUCID_SKIP_COMMIT=1)"
  exit 0
fi

COMMIT_RES="$(mktemp)"
HTTP_COMMIT="$(mktemp)"
auth_curl -o "$COMMIT_RES" -w "%{http_code}" -X POST "$API_BASE/v1/architecture/run/$RUN_ID/commit" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: $CORRELATION_ID" \
  -d '{}' > "$HTTP_COMMIT" || true
CODE_COMMIT="$(cat "$HTTP_COMMIT")"

if [[ "$CODE_COMMIT" == "409" ]]; then
  PROBLEM_TYPE="$(jq -r '.type // .Type // empty' < "$COMMIT_RES")"
  if [[ "$PROBLEM_TYPE" == *"governance-pre-commit-blocked"* ]]; then
    echo "archlucid-governance-gate: pre-commit governance gate blocked commit (PreCommitGateResult)" >&2
    jq -r '.detail // .title // "Conflict"' < "$COMMIT_RES" >&2 || true
    jq -r '.extensions.blockingFindingIds[]? // empty' < "$COMMIT_RES" 2>/dev/null | sed 's/^/  blockingFindingId: /' >&2 || true
    jq -r '.extensions.blockExplanation // empty' < "$COMMIT_RES" 2>/dev/null | sed 's/^/  blockExplanation: /' >&2 || true
    rm -f "$COMMIT_RES" "$HTTP_COMMIT"
    emit_run_links "$RUN_ID"
    exit 1
  fi

  echo "archlucid-governance-gate: commit conflict HTTP 409 (not governance-pre-commit-blocked)" >&2
  cat "$COMMIT_RES" >&2
  rm -f "$COMMIT_RES" "$HTTP_COMMIT"
  exit 2
fi

if [[ "$CODE_COMMIT" != "200" && "$CODE_COMMIT" != "201" ]]; then
  echo "archlucid-governance-gate: commit failed: HTTP $CODE_COMMIT" >&2
  cat "$COMMIT_RES" >&2
  rm -f "$COMMIT_RES" "$HTTP_COMMIT"
  exit 2
fi
rm -f "$COMMIT_RES" "$HTTP_COMMIT"

echo "Committed golden manifest for run $RUN_ID"

DELTAS_JSON="$(mktemp)"
HTTP_DELTAS="$(mktemp)"
auth_curl -o "$DELTAS_JSON" -w "%{http_code}" \
  "$API_BASE/v1/pilots/runs/$RUN_ID/pilot-run-deltas" \
  -H "X-Correlation-ID: $CORRELATION_ID" > "$HTTP_DELTAS" || true
CODE_DELTAS="$(cat "$HTTP_DELTAS")"

if [[ "$CODE_DELTAS" == "200" ]]; then
  STRICT_OK="$(jq -r '.proofPackageCompleteness.agentOutputPilotStrictEvidenceSatisfied // true' < "$DELTAS_JSON")"
  SENDABILITY="$(jq -r '.proofPackageCompleteness.proofSendability // empty' < "$DELTAS_JSON")"
  SPONSOR_READINESS="$(jq -r '.proofPackageCompleteness.sponsorProofReadiness // empty' < "$DELTAS_JSON")"

  if [[ "$STRICT_OK" == "false" ]]; then
    rm -f "$DELTAS_JSON" "$HTTP_DELTAS"
    fail_pilot_strict "$RUN_ID" "proofPackageCompleteness.agentOutputPilotStrictEvidenceSatisfied=false"
  fi

  if [[ "$SENDABILITY" == "NotSendable" ]]; then
    rm -f "$DELTAS_JSON" "$HTTP_DELTAS"
    fail_pilot_strict "$RUN_ID" "proofPackageCompleteness.proofSendability=NotSendable"
  fi

  if [[ "$SPONSOR_READINESS" == "Incomplete" || "$SPONSOR_READINESS" == "DemoOnly" ]]; then
    rm -f "$DELTAS_JSON" "$HTTP_DELTAS"
    fail_pilot_strict "$RUN_ID" "proofPackageCompleteness.sponsorProofReadiness=$SPONSOR_READINESS"
  fi
else
  echo "archlucid-governance-gate: warning — pilot-run-deltas HTTP $CODE_DELTAS (PilotStrict post-commit check skipped)" >&2
fi

rm -f "$DELTAS_JSON" "$HTTP_DELTAS"

echo "archlucid-governance-gate: PASS — governance pre-commit and PilotStrict checks cleared."
emit_run_links "$RUN_ID"
exit 0
