# Azure SQL capacity benchmark and Monitor correlation — v2

The offline `scripts/ci/correlate_sql_azure_monitor.py` tool accepts both `SQL_SECURITY_EVIDENCE_PATH_REPOSITORY` (older local SQL test evidence) and `AZURE_SQL_TEMP_TABLE_TEST_ONLY` (the opt-in Azure SQL benchmark executor).

For an Azure SQL artifact it **requires an exact case-insensitive equality** between `azureSqlResourceId` in the benchmark artifact and `resourceId` in the manually exported Azure Monitor data. The Monitor envelope must cover the benchmark's UTC start/end interval, contain ordered valid nonnegative measurements, and include at least one actual sample inside the measured workload interval. Missing, mismatched, or invalid evidence fails closed.

This is **identity string matching, not Azure resource attestation**; monitor artifacts must come from the actual approved Azure SQL database and the supplied resource ID must be verified using Azure IAM/monitoring access. CPU percentage and cached SQL worker CPU are different quantities. The output is labeled `CORRELATED_NOT_QUERY_CPU_CALIBRATION` and must not drive worker sizing or production autoscaling without stronger isolated measurements. This does not run any Azure query or create cloud resources.

Validate locally with `python3 -m unittest scripts.ci.test_correlate_sql_azure_monitor`. Then compare artifacts with `python3 scripts/ci/correlate_sql_azure_monitor.py --benchmark <azure-sql-artifact.json> --monitor <same-resource-monitor-export.json> --output <correlation.json>`.
