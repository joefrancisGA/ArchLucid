#!/usr/bin/env bash
# Create and verify a SQL Server catalog on GHA Docker SQL service containers.
# Requires scripts/ci/wait-for-sqlserver.sh (or equivalent) to have run first.
set -euo pipefail

DB_NAME="${1:?usage: ensure-ci-sql-catalog.sh <database_name>}"

SA_PASSWORD="${SA_PASSWORD:-LocalTesting123!}"
SQL_SERVER="${SQL_SERVER:-127.0.0.1,1433}"
MAX_ATTEMPTS="${SQL_CATALOG_ENSURE_MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SQL_CATALOG_ENSURE_SLEEP_SECONDS:-2}"

run_sqlcmd() {
  local query="$1"
  shift

  if [ -x "/opt/mssql-tools18/bin/sqlcmd" ]; then
    /opt/mssql-tools18/bin/sqlcmd \
      -S "${SQL_SERVER}" -U sa -P "${SA_PASSWORD}" -C "$@" \
      -Q "${query}"

    return $?
  fi

  if command -v sqlcmd >/dev/null 2>&1; then
    sqlcmd \
      -S "${SQL_SERVER}" -U sa -P "${SA_PASSWORD}" -C "$@" \
      -Q "${query}"

    return $?
  fi

  docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
    mcr.microsoft.com/mssql/server:2022-latest \
    -S "${SQL_SERVER}" -U sa -P "${SA_PASSWORD}" -C "$@" \
    -Q "${query}"
}

query_catalog_exists() {
  run_sqlcmd "SET NOCOUNT ON; SELECT name FROM sys.databases WHERE name = N'${DB_NAME}';" \
    -h -1 -W 2>/dev/null || true
}

attempt=1

while [ "${attempt}" -le "${MAX_ATTEMPTS}" ]; do
  if run_sqlcmd "IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'${DB_NAME}') CREATE DATABASE [${DB_NAME}];" >/dev/null 2>&1; then
    RAW="$(query_catalog_exists)"

    if printf '%s\n' "${RAW}" | grep -q "${DB_NAME}"; then
      echo "SQL catalog '${DB_NAME}' is ready on ${SQL_SERVER} (attempt ${attempt}/${MAX_ATTEMPTS})."
      exit 0
    fi
  fi

  echo "[${attempt}/${MAX_ATTEMPTS}] waiting to create or verify SQL catalog '${DB_NAME}' on ${SQL_SERVER}..."
  attempt=$((attempt + 1))
  sleep "${SLEEP_SECONDS}"
done

echo "::error::Expected SQL catalog '${DB_NAME}' on ${SQL_SERVER} but verification failed after ${MAX_ATTEMPTS} attempts."
RAW="$(query_catalog_exists)"
printf '%s\n' "${RAW}"
exit 1
