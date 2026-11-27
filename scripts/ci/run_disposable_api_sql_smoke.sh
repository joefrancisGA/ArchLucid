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
  local deadline=$1 remaining
  shift
  remaining=$((deadline - SECONDS))
  if ((remaining <= 0)); then
    return 124
  fi
  "$timeout_command" --kill-after=2s "${remaining}s" docker "$@"
}
setup_docker() {
  docker_until "$setup_deadline" "$@"
}
setup_failed() {
  local status=$1
  if deadline_expired "$status"; then
    record_deadline setup
    exit 124
  fi
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
  if listing="$(docker_until "$deadline" container ls --all --no-trunc --filter "$selector" --format "$format" 2>/dev/null)"; then
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
  if [[ -n "$container_name" ]]; then
    deadline=$((SECONDS + cleanup_seconds))
    # Keep a target even if the daemon started the container but the client timed out before returning its ID.
    if docker_until "$deadline" rm -f "${container_id:-$container_name}" >/dev/null 2>&1; then
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
cancel() {
  trap '' INT TERM
  if [[ -n "${!:-}" ]]; then
    # The runner is the only background job. Wait for its final checkpoint
    # before the EXIT trap removes the SQL fixture.
    kill -s "$1" %+ 2>/dev/null || true
    wait "$!" || true
  fi
  exit "$2"
}
trap cleanup EXIT
trap 'cancel INT 130' INT
trap 'cancel TERM 143' TERM

# A registry may publish an image config digest rather than a pullable manifest digest.
setup_docker pull "$sql_tag" || setup_failed "$?"
image_manifest="$(setup_docker image inspect --format '{{.Id}}{{range .RepoDigests}}{{println}}{{.}}{{end}}' "$sql_tag")" \
  || setup_failed "$?"
image_id=${image_manifest%%$'\n'*}
if [[ ! "$image_id" =~ ^sha256:[[:xdigit:]]{64}$ ]] || ! grep -Eq "(^|@)$sql_digest$" <<< "$image_manifest"; then
  echo 'Disposable SQL image did not match the published digest.' >&2
  exit 1
fi
export MSSQL_SA_PASSWORD
MSSQL_SA_PASSWORD="$(python3 -c 'import secrets; print("Aa1!" + secrets.token_hex(20))')"
container_name="archlucid-focused-sql-${BASHPID:-$$}-${RANDOM}-${RANDOM}-${RANDOM}"
container_id="$(setup_docker run --detach --rm --name "$container_name" --publish 127.0.0.1::1433 \
  --env ACCEPT_EULA=Y --env MSSQL_PID=Developer --env MSSQL_SA_PASSWORD \
  --env MSSQL_MEMORY_LIMIT_MB=2048 "$image_id")" || setup_failed "$?"
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
      setup_failed "$probe_status"
    fi
  fi
  running="$(setup_docker inspect --format '{{.State.Running}}' "$container_id" 2>/dev/null)" || setup_failed "$?"
  if [[ "$running" != 'true' ]]; then
    echo 'Disposable SQL Server exited before accepting connections.' >&2
    exit 1
  fi
  remaining=$((setup_deadline - SECONDS))
  if ((remaining <= 0)); then
    setup_failed 124
  fi
  sleep "$((remaining < 2 ? remaining : 2))"
done
if [[ "$ready" != true ]]; then
  echo 'Disposable SQL Server did not become ready.' >&2
  exit 1
fi

sqlcmd -Q "ALTER DATABASE model SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;" || setup_failed "$?"
port_binding="$(setup_docker port "$container_id" 1433/tcp)" || setup_failed "$?"
if [[ ! "$port_binding" =~ ^127\.0\.0\.1:([0-9]+)$ ]]; then
  echo 'Disposable SQL Server did not publish a loopback port.' >&2
  exit 1
fi
export ARCHLUCID_API_TEST_SQL="Server=127.0.0.1,${BASH_REMATCH[1]};Database=master;User ID=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;Encrypt=True;Connect Timeout=8;Pooling=False"
export ARCHLUCID_SQL_TEST="$ARCHLUCID_API_TEST_SQL"
unset SQLCMDPASSWORD MSSQL_SA_PASSWORD

python3 scripts/ci/run_focused_api_sql.py "${runner_args[@]}" --use-prepared &
wait "$!"
