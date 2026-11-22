#!/usr/bin/env bash
set -euo pipefail

: "${FND010_SQL_PASSWORD:?Set FND010_SQL_PASSWORD}"
export FND010_SQL_CONNECTION="Server=127.0.0.1,1433;Database=master;User Id=sa;Password=${FND010_SQL_PASSWORD};Encrypt=True;TrustServerCertificate=True;Connection Timeout=5"

python3 scripts/ci/fnd010_sql_journal_verify.py
