# Opt-in Azure SQL capacity execution

Build the standalone benchmark with `dotnet build tools/ArchLucid.AzureSqlCapacityBench/ArchLucid.AzureSqlCapacityBench.csproj -c Release`. It is not run by normal CI, deployment or production startup.

Set `ARCHLUCID_AZURE_SQL_TEST_CONNECTION` to a dedicated, authorized `*.database.windows.net` SQL test catalog named `ArchLucidCapacityTest_...`, with encryption mandatory and certificate validation enabled. Set `ARCHLUCID_AZURE_SQL_BENCH_OUTPUT` to a controlled local artifact path. Invoke the executable with the matching Azure SQL database ARM resource ID, catalog name, 100–10,000 rows, 3–100 iterations and `I_APPROVE_TEST_BENCHMARK`.

The runner checks its requested ARM resource format and catalog match, opens a connection, verifies `DB_NAME()`, creates a session-local `#ArchLucidCapacityRead` temporary table, seeds bounded synthetic data, and executes sequential indexed reads. It writes p50/p95 timings and UTC start/end in JSON; it never writes credentials. The test resource and permission isolation remain the operator's responsibility. A forged ARM ID matching a real connection name is not proof of Azure resource identity; use Azure IAM and an isolated resource.

**No live Azure Monitor retrieval is included.** The existing monitor correlator expects a different benchmark backend and cannot yet be used directly with this artifact without an explicit matching-backend and resource-identity update. Do not claim CPU calibration, product-repository throughput or production sizing from this session-scoped temporary-table benchmark. Azure resources may incur costs. Do not run against production, shared catalogues or unapproved subscriptions.
