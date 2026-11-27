#!/usr/bin/env bash
# Run after building ArchLucid.Api.Tests in Release. Owns the database for this invocation.
set -euo pipefail

if [[ ( $# != 1 && $# != 3 ) || -z "${1:-}" || -e "$1" ]]; then
  echo "Usage: $0 <new-results-directory> [--case <listed-test>]" >&2
  exit 2
fi

results_dir=$1
setup_seconds=${ARCHLUCID_FOCUSED_SQL_SETUP_SECONDS:-180}
cleanup_seconds=${ARCHLUCID_FOCUSED_SQL_CLEANUP_SECONDS:-15}
if ! [[ "$setup_seconds" =~ ^[1-9][0-9]{0,3}$ && "$cleanup_seconds" =~ ^[1-9][0-9]{0,3}$ ]]; then
  echo 'SQL fixture deadlines must be positive whole seconds (up to 9999).' >&2
  exit 2
fi
if ! timeout_command=$(command -v timeout || command -v gtimeout); then
  echo 'The focused SQL wrapper requires GNU timeout.' >&2
  exit 2
fi
if [[ $# == 3 ]]; then
  if [[ "$2" != --case || -z "$3" ]] || ! grep -Fxq -- "$3" scripts/ci/focused-api-sql-cases.txt; then
    echo 'Provide one exact test from the focused API SQL case list.' >&2
    exit 2
  fi
  cases=(--case "$3")
else
  cases=(
    --case ArchLucid.Api.Tests.AuthorityPipelineCommittedInventorySqlIntegrationTests.Fresh_sql_review_finalization_replays_the_sealed_artifact_inventory
    --case ArchLucid.Api.Tests.AuthorityPipelineCommittedInventorySqlIntegrationTests.Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash
    --case ArchLucid.Api.Tests.Security.AuditExportTenantIsolationIntegrationTests.Tenant_b_audit_list_take_200_excludes_tenant_a_run_id_sql_tb295
  )
fi

runner_args=(--results-dir "$results_dir" --timeout-seconds 180 "${cases[@]}")
python3 scripts/ci/run_focused_api_sql.py "${runner_args[@]}" --prepare-only

sql_tag='mcr.microsoft.com/mssql/server:2022-CU22-ubuntu-22.04'
sql_digest='sha256:db9a8fe3098b7e8bbde41106bdc7caee942e97124e5fdb71b872ca208de3092d'
setup_deadline=$((SECONDS + setup_seconds))
container_name=''
container_id=''
setup_output="$results_dir/.fixture-output"
active_phase=''
active_pid=''
cancel_signal=''
cancel_status=0

deadline_expired() {
  # GNU timeout returns 137 instead of 124 when it has to escalate to SIGKILL.
  [[ "$1" == 124 || "$1" == 137 ]]
}
record_deadline() {
  echo "Disposable SQL fixture $1 timed out." >&2
  python3 scripts/ci/run_focused_api_sql.py --results-dir "$results_dir" "--record-fixture-timeout=$1" \
    || echo 'Could not annotate the focused SQL summary.' >&2
}
record_cleanup() {
  if [[ "$1" == already-absent ]]; then
    echo 'Disposable SQL fixture was already absent after the removal error.' >&2
  else
    echo "Disposable SQL fixture cleanup failed ($1)." >&2
  fi
  python3 scripts/ci/run_focused_api_sql.py --results-dir "$results_dir" "--record-fixture-cleanup=$1" \
    || echo 'Could not annotate the focused SQL summary.' >&2
}
docker_until() {
  local deadline=$1 phase=$2 remaining
  shift 2
  remaining=$((deadline - SECONDS))
  if ((remaining <= 0)); then
    return 124
  fi
  if [[ "$phase" == setup ]]; then
    run_interruptible setup "$timeout_command" --kill-after=2s "${remaining}s" docker "$@"
  else
    "$timeout_command" --kill-after=2s "${remaining}s" docker "$@"
  fi
}
setup_docker() {
  docker_until "$setup_deadline" setup "$@"
}
setup_failed() {
  local status=$1 reason=$2
  if deadline_expired "$status"; then
    record_deadline setup
    exit 124
  fi
  echo "${3:-Disposable SQL fixture setup failed ($reason).}" >&2
  python3 scripts/ci/run_focused_api_sql.py --results-dir "$results_dir" "--record-fixture-setup-failure=$reason" \
    || echo 'Could not annotate the focused SQL summary.' >&2
  exit "$status"
}
verify_removal() {
  local deadline=$1 target selector format listing query_status
  if [[ -n "$container_id" ]]; then
    target=$container_id
    selector="id=$target"
    format='{{.ID}}'
  else
    target=$container_name
    selector="name=$target"
    format='{{.Names}}'
  fi
  # An unsuccessful inspect can mean either "not found" or an unreachable daemon.
  # Accept absence only from a successful, bounded lookup including stopped containers.
  if listing="$(docker_until "$deadline" cleanup container ls --all --no-trunc --filter "$selector" --format "$format" 2>/dev/null)"; then
    if [[ -z "$listing" ]]; then
      record_cleanup already-absent
      return 0
    fi
    if grep -Fxq -- "$target" <<< "$listing"; then
      record_cleanup still-present
    else
      record_cleanup unverified
    fi
  else
    query_status=$?
    record_cleanup unverified
    if deadline_expired "$query_status"; then
      record_deadline cleanup
      return 124
    fi
  fi
  return 1
}
cleanup() {
  local status=$? cleanup_status deadline
  rm -f -- "$setup_output" 2>/dev/null || true
  if [[ -n "$container_name" ]]; then
    deadline=$((SECONDS + cleanup_seconds))
    # Keep a target even if the daemon started the container but the client timed out before returning its ID.
    if docker_until "$deadline" cleanup rm -f "${container_id:-$container_name}" >/dev/null 2>&1; then
      :
    else
      cleanup_status=$?
      if deadline_expired "$cleanup_status"; then
        record_deadline cleanup
        cleanup_status=124
      elif verify_removal "$deadline"; then
        cleanup_status=0
      else
        cleanup_status=$?
      fi
      if ((status == 0)); then
        status=$cleanup_status
      fi
    fi
  fi
  exit "$status"
}
finish_cancellation() {
  trap '' INT TERM
  if [[ -n "$active_pid" ]]; then
    # The current job is the wrapper's sole background job. Setup jobs
    # have their own process group, including the timed Docker client.
    if [[ "$active_phase" == setup ]]; then
      kill -s KILL %+ 2>/dev/null || true
    else
      # Give the test runner time to save its final checkpoint.
      kill -s "$cancel_signal" %+ 2>/dev/null || true
    fi
    wait "$active_pid" 2>/dev/null || true
  fi
  set +m
  exit "$cancel_status"
}
cancel() {
  if ((cancel_status == 0)); then
    cancel_signal=$1
    cancel_status=$2
  fi
  # A signal between launch and PID registration is handled as soon as
  # the parent can identify the job, before waiting on it.
  if [[ -z "$active_phase" || -n "$active_pid" ]]; then
    finish_cancellation
  fi
}
run_interruptible() {
  local status=0
  active_phase=$1
  shift
  if ((cancel_status)); then finish_cancellation; fi
  "$@" &
  active_pid=$!
  if ((cancel_status)); then finish_cancellation; fi
  wait "$active_pid" 2>/dev/null || status=$?
  active_pid=''
  active_phase=''
  if ((cancel_status)); then finish_cancellation; fi
  return "$status"
}
trap cleanup EXIT
trap 'cancel INT 130' INT
trap 'cancel TERM 143' TERM
set -m

# Capture setup output without running the supervisor in a command substitution.
# A registry may publish an image config digest rather than a pullable manifest digest.
setup_docker pull "$sql_tag" >/dev/null 2>&1 || setup_failed "$?" image-pull-failed
setup_docker image inspect --format '{{.Id}}{{range .RepoDigests}}{{println}}{{.}}{{end}}' "$sql_tag" >"$setup_output" 2>/dev/null \
  || setup_failed "$?" image-inspect-failed
image_manifest=$(<"$setup_output")
image_id=${image_manifest%%$'\n'*}
if [[ ! "$image_id" =~ ^sha256:[[:xdigit:]]{64}$ ]] || ! grep -Eq "(^|@)$sql_digest$" <<< "$image_manifest"; then
  setup_failed 1 image-digest-mismatch 'Disposable SQL image did not match the published digest.'
fi
export MSSQL_SA_PASSWORD
MSSQL_SA_PASSWORD="$(python3 -c 'import secrets; print("Aa1!" + secrets.token_hex(20))' 2>/dev/null)" \
  || setup_failed "$?" fixture-initialization-failed
container_name="archlucid-focused-sql-${BASHPID:-$$}-${RANDOM}-${RANDOM}-${RANDOM}"
setup_docker run --detach --rm --name "$container_name" --publish 127.0.0.1::1433 \
  --env ACCEPT_EULA=Y --env MSSQL_PID=Developer --env MSSQL_SA_PASSWORD \
  --env MSSQL_MEMORY_LIMIT_MB=2048 "$image_id" >"$setup_output" 2>/dev/null || setup_failed "$?" container-start-failed
container_id=$(<"$setup_output")
if [[ -z "$container_id" ]]; then
  setup_failed 1 container-start-failed
fi
export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"

sqlcmd() {
  setup_docker exec --env SQLCMDPASSWORD "$container_id" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -l 3 -t 15 "$@"
}

ready=false
for attempt in {1..30}; do
  if sqlcmd -Q 'SET NOCOUNT ON; SELECT 1;' >/dev/null 2>&1; then
    ready=true
    break
  else
    probe_status=$?
    if deadline_expired "$probe_status"; then
      setup_failed "$probe_status" readiness-check-failed
    fi
  fi
  setup_docker inspect --format '{{.State.Running}}' "$container_id" >"$setup_output" 2>/dev/null \
    || setup_failed "$?" readiness-check-failed
  running=$(<"$setup_output")
  if [[ "$running" == 'false' ]]; then
    setup_failed 1 server-exited 'Disposable SQL Server exited before accepting connections.'
  elif [[ "$running" != 'true' ]]; then
    setup_failed 1 readiness-check-failed
  fi
  remaining=$((setup_deadline - SECONDS))
  if ((remaining <= 0)); then
    setup_failed 124 readiness-check-failed
  fi
  run_interruptible setup sleep "$((remaining < 2 ? remaining : 2))"
done
if [[ "$ready" != true ]]; then
  setup_failed 1 readiness-exhausted 'Disposable SQL Server did not become ready.'
fi

sqlcmd -Q "ALTER DATABASE model SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;" >/dev/null 2>&1 \
  || setup_failed "$?" sql-configuration-failed
setup_docker port "$container_id" 1433/tcp >"$setup_output" 2>/dev/null || setup_failed "$?" port-lookup-failed
port_binding=$(<"$setup_output")
if [[ ! "$port_binding" =~ ^127\.0\.0\.1:([0-9]+)$ ]]; then
  setup_failed 1 invalid-port-binding 'Disposable SQL Server did not publish a loopback port.'
fi
export ARCHLUCID_API_TEST_SQL="Server=127.0.0.1,${BASH_REMATCH[1]};Database=master;User ID=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;Encrypt=True;Connect Timeout=8;Pooling=False"
export ARCHLUCID_SQL_TEST="$ARCHLUCID_API_TEST_SQL"
unset SQLCMDPASSWORD MSSQL_SA_PASSWORD

set +m
run_interruptible tests python3 scripts/ci/run_focused_api_sql.py "${runner_args[@]}" --use-prepared
