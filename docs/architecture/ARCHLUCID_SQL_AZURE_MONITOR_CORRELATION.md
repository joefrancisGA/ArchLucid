# Azure Monitor correlation for SQL capacity benchmarks

The scoped SQL repository benchmark now includes UTC start/end timestamps bracketing the timed query workload. `scripts/ci/correlate_sql_azure_monitor.py` consumes the benchmark JSON and a **manually exported** Azure Monitor resource metric JSON file with a UTC window that covers those timestamps. Example monitor input:

```json
{"schemaVersion":1,"scope":"SQL_SERVER_RESOURCE","metricName":"cpu_percent",
 "resourceId":"/subscriptions/EXAMPLE/resourceGroups/EXAMPLE/providers/Microsoft.Sql/servers/EXAMPLE/databases/EXAMPLE",
 "startUtc":"2026-10-28T12:00:00Z","endUtc":"2026-10-28T12:05:00Z",
 "observations":[{"timestampUtc":"2026-10-28T12:00:00Z","value":10},
                 {"timestampUtc":"2026-10-28T12:05:00Z","value":15}]}
```

Invoke `python3 scripts/ci/correlate_sql_azure_monitor.py --benchmark <benchmark.json> --monitor <monitor.json> --output <comparison.json>`. The results are **correlation-only**: the SQL test runs in a local SQL Server CI service, which is not an Azure SQL database. Do not pair a local SQL container benchmark with metrics from an unrelated Azure SQL resource and claim meaningful CPU calibration. An actual Azure SQL test run, approved access, matched resource identity, and time-synchronized metrics are required for a valid environmental comparison. Averaged monitor samples are not time-weighted, and a CPU percentage is not CPU-seconds. No Azure credentials, cloud metrics calls, resource changes, or automatic worker-sizing decisions are included.
