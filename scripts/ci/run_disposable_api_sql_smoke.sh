#!/usr/bin/env bash
# Run after building ArchLucid.Api.Tests in Release. Owns the database for this invocation.
set -euo pipefail

if [[ ( $# != 1 && $# != 3 ) || -z "${1:-}" || -e "$1" ]]; then
  echo "Usage: $0 <new-results-directory> [--case <listed-test>]" >&2
  exit 2
fi

results_dir=$1
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
# A registry may publish an image config digest rather than a pullable manifest digest.
docker pull "$sql_tag"
image_manifest="$(docker image inspect --format '{{.Id}}{{range .RepoDigests}}{{println}}{{.}}{{end}}' "$sql_tag")"
image_id=${image_manifest%%$'\n'*}
if [[ ! "$image_id" =~ ^sha256:[[:xdigit:]]{64}$ ]] || ! grep -Eq "(^|@)$sql_digest$" <<< "$image_manifest"; then
  echo 'Disposable SQL image did not match the published digest.' >&2
  exit 1
fi
export MSSQL_SA_PASSWORD
MSSQL_SA_PASSWORD="$(python3 -c 'import secrets; print("Aa1!" + secrets.token_hex(20))')"
container_id=''
cleanup() {
  if [[ -n "$container_id" ]]; then
    docker rm -f "$container_id" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

container_id="$(docker run --detach --rm --publish 127.0.0.1::1433 \
  --env ACCEPT_EULA=Y --env MSSQL_PID=Developer --env MSSQL_SA_PASSWORD \
  --env MSSQL_MEMORY_LIMIT_MB=2048 "$image_id")"
export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"

sqlcmd() {
  docker exec --env SQLCMDPASSWORD "$container_id" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -l 3 -t 15 "$@"
}

ready=false
for attempt in {1..30}; do
  if sqlcmd -Q 'SET NOCOUNT ON; SELECT 1;' >/dev/null 2>&1; then
    ready=true
    break
  fi
  if [[ "$(docker inspect --format '{{.State.Running}}' "$container_id" 2>/dev/null)" != 'true' ]]; then
    echo 'Disposable SQL Server exited before accepting connections.' >&2
    exit 1
  fi
  sleep 2
done
if [[ "$ready" != true ]]; then
  echo 'Disposable SQL Server did not become ready.' >&2
  exit 1
fi

sqlcmd -Q "ALTER DATABASE model SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;"
port_binding="$(docker port "$container_id" 1433/tcp)"
if [[ ! "$port_binding" =~ ^127\.0\.0\.1:([0-9]+)$ ]]; then
  echo 'Disposable SQL Server did not publish a loopback port.' >&2
  exit 1
fi
export ARCHLUCID_API_TEST_SQL="Server=127.0.0.1,${BASH_REMATCH[1]};Database=master;User ID=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;Encrypt=True;Connect Timeout=8;Pooling=False"
export ARCHLUCID_SQL_TEST="$ARCHLUCID_API_TEST_SQL"
unset SQLCMDPASSWORD MSSQL_SA_PASSWORD

python3 scripts/ci/run_focused_api_sql.py "${runner_args[@]}" --use-prepared
