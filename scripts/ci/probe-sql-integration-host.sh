#!/usr/bin/env bash
# Returns 0 when a SQL Server host is reachable for Api/Persistence integration tests.
# Honors ARCHLUCID_SQL_TEST / ARCHLUCID_API_TEST_SQL; otherwise probes the CI default service container.
set -euo pipefail

SA_PASSWORD="${SA_PASSWORD:-LocalTesting123!}"
SQL_SERVER="${SQL_SERVER:-127.0.0.1,1433}"

resolve_connection_string() {
  if [ -n "${ARCHLUCID_API_TEST_SQL:-}" ]; then
    printf '%s' "${ARCHLUCID_API_TEST_SQL}"
    return 0
  fi

  if [ -n "${ARCHLUCID_SQL_TEST:-}" ]; then
    printf '%s' "${ARCHLUCID_SQL_TEST}"
    return 0
  fi

  printf 'Server=%s;User Id=sa;Password=%s;TrustServerCertificate=True;Initial Catalog=master' \
    "${SQL_SERVER}" "${SA_PASSWORD}"
}

parse_sql_server_from_connection_string() {
  local connection_string="$1"
  local data_source=""

  if [[ "${connection_string}" =~ (^|;)Server=([^;]+) ]]; then
    data_source="${BASH_REMATCH[2]}"
  elif [[ "${connection_string}" =~ (^|;)Data\ Source=([^;]+) ]]; then
    data_source="${BASH_REMATCH[2]}"
  fi

  if [ -z "${data_source}" ]; then
    echo "::error::Could not parse Server/Data Source from SQL connection string." >&2
    return 1
  fi

  printf '%s' "${data_source}"
}

parse_sql_password_from_connection_string() {
  local connection_string="$1"

  if [[ "${connection_string}" =~ (^|;)Password=([^;]+) ]]; then
    printf '%s' "${BASH_REMATCH[2]}"
    return 0
  fi

  printf '%s' "${SA_PASSWORD}"
}

run_sqlcmd() {
  local server="$1"
  local password="$2"
  local query="$3"

  if [ -x "/opt/mssql-tools18/bin/sqlcmd" ]; then
    /opt/mssql-tools18/bin/sqlcmd \
      -S "${server}" -U sa -P "${password}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1
    return $?
  fi

  if command -v sqlcmd >/dev/null 2>&1; then
    sqlcmd \
      -S "${server}" -U sa -P "${password}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1
    return $?
  fi

  if command -v docker >/dev/null 2>&1; then
    docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
      mcr.microsoft.com/mssql/server:2022-latest \
      -S "${server}" -U sa -P "${password}" -C -b -h -1 -Q "${query}" >/dev/null 2>&1
    return $?
  fi

  return 127
}

connection_string="$(resolve_connection_string)"
server="$(parse_sql_server_from_connection_string "${connection_string}")"
password="$(parse_sql_password_from_connection_string "${connection_string}")"

if run_sqlcmd "${server}" "${password}" "SELECT 1"; then
  exit 0
fi

exit 1
