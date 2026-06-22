#!/usr/bin/env bash
# Poll SQL Server from the GHA runner until login succeeds and master is ONLINE.
# Used by .github/actions/wait-for-sqlserver and optional CI scripts.
set -euo pipefail

SA_PASSWORD="${SA_PASSWORD:-LocalTesting123!}"
SERVER="${SQL_SERVER:-127.0.0.1,1433}"
MAX_ATTEMPTS="${SQL_WAIT_MAX_ATTEMPTS:-90}"
SLEEP_SECONDS="${SQL_WAIT_SLEEP_SECONDS:-2}"

run_sqlcmd() {
  local query="$1"

  if [ -x "/opt/mssql-tools18/bin/sqlcmd" ]; then
    /opt/mssql-tools18/bin/sqlcmd \
      -S "${SERVER}" -U sa -P "${SA_PASSWORD}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1

    return $?
  fi

  if command -v sqlcmd >/dev/null 2>&1; then
    sqlcmd \
      -S "${SERVER}" -U sa -P "${SA_PASSWORD}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1

    return $?
  fi

  docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
    mcr.microsoft.com/mssql/server:2022-latest \
    -S "${SERVER}" -U sa -P "${SA_PASSWORD}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1
}

is_sql_ready() {
  run_sqlcmd "SELECT 1" \
    && run_sqlcmd "SELECT 1 FROM sys.databases WHERE name = N'master' AND state_desc = N'ONLINE'"
}

dump_mssql_service_logs() {
  echo "--- Docker containers (mssql) ---"
  docker ps -a --filter "ancestor=mcr.microsoft.com/mssql/server:2022-latest" || true

  local container_id=""
  container_id="$(docker ps -aq --filter "ancestor=mcr.microsoft.com/mssql/server:2022-latest" | head -n 1 || true)"

  if [ -n "${container_id}" ]; then
    echo "--- docker logs ${container_id} (last 200 lines) ---"
    docker logs "${container_id}" 2>&1 | tail -n 200 || true
  else
    echo "No MSSQL service container found via docker ps."
  fi
}

attempt=1

while [ "${attempt}" -le "${MAX_ATTEMPTS}" ]; do
  if is_sql_ready; then
    echo "SQL Server ready on ${SERVER} (attempt ${attempt}/${MAX_ATTEMPTS})."
    exit 0
  fi

  echo "[${attempt}/${MAX_ATTEMPTS}] waiting for SQL Server on ${SERVER}..."
  attempt=$((attempt + 1))
  sleep "${SLEEP_SECONDS}"
done

echo "::error::SQL Server on ${SERVER} did not become ready after ${MAX_ATTEMPTS} attempts."
dump_mssql_service_logs
exit 1
