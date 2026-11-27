# Focused API SQL checks

Run these cases on a disposable SQL Server, never against a shared development or production catalog. Use the same SQL build and settings for every revision in a comparison. The recommended fixture for this lane is SQL Server 2022 CU22 for Ubuntu 22.04, pinned by digest.

Pull `mcr.microsoft.com/mssql/server:2022-CU22-ubuntu-22.04` and verify the published digest `sha256:db9a8fe3098b7e8bbde41106bdc7caee942e97124e5fdb71b872ca208de3092d` before starting it. The smoke wrapper supports a match against either the image ID or a registry manifest digest and starts the verified image by ID.

1. Start a fresh container with no published ports beyond a loopback mapping. Use Developer Edition and a throwaway password.
2. Set `READ_COMMITTED_SNAPSHOT ON` on the disposable server's `model` catalog before the API fixture creates user databases. This keeps migration startup from waiting for exclusive access to the test catalog. Do not change isolation settings on a reused server.
3. Set `ARCHLUCID_API_TEST_SQL` to the disposable server. Point it at `master`. The factory creates and removes a unique catalog for each case. Do not put the connection string in diagnostics.
4. Build `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj` in Release on the checked-out revision, then run:

   ```sh
   python3 scripts/ci/run_focused_api_sql.py --results-dir /tmp/archlucid-sql-results
   ```

   Use `--case` to select one fully qualified test name. Repeat it for more than one case. Use a new results directory for each run.

5. Stop the container and discard its volumes even when a test times out. This completes cleanup when the watchdog terminates a process before the test fixture can drop its catalog.

The runner launches each case independently and keeps its raw log and TRX local to the runner. `summary.json` records the checked-out commit and every selected test, in order. The disposable wrapper writes the selection before SQL setup. The runner then atomically checkpoints each launch and result. `not-started` means a case was selected but did not reach its launch checkpoint. `running` means the launch was recorded but no final outcome was saved. Both are included in `unreported`. A returned test process with missing or ambiguous results is `interrupted`, and explicit skips are not passes. If the entire CI job is stopped before artifact upload, the case selection is also printed before SQL starts. Run on a clean checkout when producing review evidence. Use this lane before broader release runs. No comprehensive workflow is needed for a one-case comparison.

On `SIGINT` or `SIGTERM`, the wrapper forwards the signal and waits for the runner before removing the disposable container. The runner stops the active test process tree, saves that case as `interrupted` with reason `cancelled`, and does not launch later cases. Exit codes are 130 for interrupt and 143 for terminate. A forced kill that cannot be handled still leaves the last complete checkpoint available on disk.

## Three-case PR check

The **Focused API SQL cases** job builds the API test project and normally runs finalize and replay, the persisted-inventory negative case, and the same-catalog audit fixture. It runs on its own hosted runner, checks out the exact PR head, and uses a new container with the pinned image. It publishes only `summary.json` and does not replace any required CI checks. The inventory negative case reports a fixed stage name and, where available, a bounded expected and actual result. No raw test output or response bodies are published.

For the same smoke run locally, build the API test project in Release first, then run:

```sh
bash scripts/ci/run_disposable_api_sql_smoke.sh /tmp/archlucid-api-sql-smoke
```

For an isolated retry, append `--case` and one exact name from `scripts/ci/focused-api-sql-cases.txt`. The wrapper requires Docker, .NET, and Python 3. It checks SQL readiness and attempts container removal even when a case fails.

The wrapper also uses GNU `timeout` (or `gtimeout`). Fixture setup shares a 180-second deadline across the pull, start, readiness, and SQL configuration commands. Container removal has its own 15-second deadline, with up to two extra seconds to force-stop a stuck Docker client. To tune the budgets for a local fixture, set `ARCHLUCID_FOCUSED_SQL_SETUP_SECONDS` and `ARCHLUCID_FOCUSED_SQL_CLEANUP_SECONDS`. A timeout adds the phase to `fixture_timeouts` in the summary without changing test outcomes. A setup timeout leaves the selected cases `not-started`. A cleanup timeout makes an otherwise successful invocation exit 124 and preserves any earlier failure or cancellation status. A cleanup timeout does not confirm the container was removed.

If Docker removal returns an error without timing out, the wrapper uses the remaining cleanup budget to check for the same container by ID, or its generated name if start did not return an ID. The lookup includes stopped containers. A successful lookup with no matches records `fixture_cleanup: already-absent` and leaves the original exit status alone. If the target is still present or its state cannot be verified, the wrapper records `still-present` or `unverified` and fails an otherwise successful invocation. Test results are retained in all cases, and raw Docker output is not included in the summary.
