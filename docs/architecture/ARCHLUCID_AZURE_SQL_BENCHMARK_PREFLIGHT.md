# Azure SQL benchmark preflight (opt-in)

`scripts/ops/azure_sql_capacity_preflight.py` verifies an explicitly provided Azure SQL database resource ID and test database name beginning with `ArchLucidCapacityTest_`, plus a matching catalog in `ARCHLUCID_AZURE_SQL_TEST_CONNECTION`. TLS validation cannot be intentionally disabled. The caller must explicitly provide `--approval I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES`. Secrets are passed only through the environment and never written to output artifacts.

Example:

```sh
python3 scripts/ops/azure_sql_capacity_preflight.py \
  --resource-id "/subscriptions/REPLACE/resourceGroups/REPLACE/providers/Microsoft.Sql/servers/REPLACE/databases/ArchLucidCapacityTest_Bench" \
  --database ArchLucidCapacityTest_Bench \
  --approval I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES \
  --output artifacts/capacity/azure-sql-preflight.json
```

**Preflight only:** this command intentionally does not connect, create, seed or modify an Azure database, verify Azure IAM or compare Azure Monitor samples. A test-only identity, resource isolation, firewall/private endpoint rules, cost approval, SQL schema migration and explicit operator execution remain prerequisites. The existing local SQL repository tests should not be pointed at a shared or production Azure SQL database because they perform fixture creation and migrations. Do not treat successful preflight as approval to run them.

Actual Azure SQL calibration requires executing safely bounded workloads on a truly isolated database and collecting contemporaneous metrics from the *same* Azure resource, with verified resource ID and timestamps. No calibration claims are produced here.
