# ArchLucid staging cold-start evidence — COLD-A1 / COLD-A2

This package makes deployment cold-start evidence **observable and fail-honest** without changing startup policy, schema, Azure resource sizing, replica count or deployment gates. It does not independently deploy staging.

## Structured API startup stages (COLD-A1)

`ArchLucid.Api/Program.cs` emits five structured `ArchLucidColdStartPhase` information events with `BuildCommitSha`, `RecordedUtc`, `Environment`, `Phase` and `DurationMs`. These use `Stopwatch`, not a wall-clock subtraction:

1. `builder-create` — `WebApplication.CreateBuilder`.
2. `service-registration` — configuration, authentication, hosting, observability and application service registrations.
3. `application-build` — `builder.Build`.
4. `persistence-bootstrap` — database migration/schema/bootstrap and optional demo seeding, reported in a `finally` block even if it throws.
5. `host-start` — between registering `ApplicationStarted` and the host signaling started.

The stage logs are associated with the **API process**, not ACA image pull, network routing, running-state checks or Azure revision provisioning. Structured events contain no connection strings, access tokens, tenant IDs or secrets. COLD-A3 now adds a per-process `ProcessBootId` and parseable `RecordedUnixMs`; the deployment workflow reads console logs only for the **specific newly deployed ACA revision** and automatically attempts to join those events to the staging artifact. The `host-start` event is absent if host startup fails before `ApplicationStarted`.

## Deployment/first-read evidence (COLD-A2)

Both staging paths now run the capture helper:

- `.github/workflows/cd-staging-on-merge.yml` on an **eligible** CI-successful master deployment or explicitly enabled manual target SHA.
- `.github/workflows/cd.yml` when manually deploying with `target=staging`.

The probe is placed **before existing authenticated product smoke and deployment-evidence steps**. It reads the exact API revision returned from `az containerapp update`, fetches its Azure revision metadata, polls `GET /health/ready`, then sends three authenticated `GET /api/auth/me` requests and finally checks `GET /version` for the expected commit. The API key comes from the existing staging secret as an environment variable and is **never written into logs, JSON outputs or GitHub artifacts**. The transient Azure revision metadata stays in `RUNNER_TEMP`, not an artifact.

The versioned artifact `staging-cold-start-<run-id>.json` records:
- Expected commit SHA, API revision identity and revision creation timestamp (if available).
- Container App update start time (captured immediately before API update).
- Timestamp of the **first observed Healthy** response, and the time since revision creation **only when timestamps are present and ordered**.
- First authenticated request duration and median of two subsequent requests, sampled by the CI runner.
- Version match and explicit status/reason, with missing values represented as `null` or `NOT_MEASURED`.
- **COLD-A3 correlated startup phases**, when and only when one revision-scoped replica produces an unambiguous complete set of the five phase events for the same deployed commit and process boot ID. Reports per-phase milliseconds, their sum and the revision-created-to-host-start-event interval. Missing/restarted/ambiguous processes are marked `INCONCLUSIVE` with no fabricated phase duration.

These are **external HTTP wall-clock** measurements. The elapsed time to the **first observed Healthy** is a post-deployment polling **upper bound**, not a precise readiness transition time. The `/api/auth/me` request is first **from this workflow**, not provably the first request received by any replica; other traffic or probes can warm the application. `GET /version` matching the SHA does not prove that every preceding request hit the same replica. The artifact therefore reports `OBSERVED_NOT_PROVEN_FRESH_REVISION`, never `PROVEN_COLD_START`.

When the staging-on-merge deployment workflow is skipped (e.g. `AUTO_DEPLOY_STAGING_MERGE` unset, CI ineligible), an **independent** `archlucid-staging-unmeasured.yml` workflow emits `NOT_DEPLOYED` without changing the original CD workflow's skipped conclusion. Failed or cancelled deployments produce `INCONCLUSIVE_DEPLOYMENT` rather than falsely claiming no deployment occurred. **Skipped CI or missing credentials must never be treated as a fast startup.** Missing revision metadata, missing timestamp, unavailable readiness, failed auth or SHA mismatch yield `INCONCLUSIVE`. The informational evidence capture cannot bypass any existing post-deploy release/rollback check.

## Offline tests and operator instructions

Run from repo root:

```sh
python3 -m unittest scripts.ci.test_capture_archlucid_staging_cold_start -v
```

This verifies credential omission, no false cold claims, revision identity, missing timestamps, HTTP failure behavior, and staging workflow ordering. GitHub Actions `ArchLucid staging cold-start evidence contracts` runs the same tests for relevant PRs.

To obtain a **current** staging baseline, an owner must first run a real, approved staging CD deployment with the existing Azure environment and secrets. Read the `staging-cold-start-<run-id>` artifact and revision-scoped `ArchLucidColdStartPhase` logs, then append a dated baseline under `docs/operations/cold-start-baselines/` including the exact run URL, SHA and any inconclusive conditions. Do **not** replace pending historical staging records with synthetic values.

Do not approve a CPU upgrade, ReadyToRun, image split, pre-migration job or min-replica change solely from this package. The historical dev ~66-second Phase A remains the only dated phase-A repository baseline reviewed here; fresh staging results and logs are prerequisites for optimization hypotheses.

## COLD-A3: automatic process/phase correlation

After first-read capture, both staging CD paths call `scripts/ci/join_archlucid_staging_phase_logs.py`. The script enumerates replica names in the exact revision using `az containerapp replica list`, then reads up to 300 console log messages from each one with `az containerapp logs show --revision --replica --container --type console --follow false` (up to eight replicas). **All raw logs remain in process memory**, including errors; only validated numeric phase timings and non-secret process/revision identity are appended to the existing JSON artifact. The console-log collector times out each Azure CLI invocation and never causes staging deployment to be approved or rolled back.

Correlation is strict: the report must have a matched public `/version` SHA and valid revision timestamps, the log events must match that SHA and revision time window, and **exactly one** process boot ID must provide each of the five phases with consistent chronological order. When multiple replicas or restarted instances provide competing startup sequences, the result is `MULTIPLE_STARTUP_PROCESSES_AMBIGUOUS` rather than a cherry-picked speedup. Incomplete log retrieval, missing events, or monitoring permissions become explicit inconclusive reasons. Joining durations does **not** make the overall cold start a verified SLA measurement: image pull, scheduling, and uninstrumented time remain outside the five .NET phases.

Offline tests: `python3 -m unittest scripts.ci.test_join_archlucid_staging_phase_logs -v`. No new Azure permissions, resource changes, always-on infrastructure, cost increases, or private customer evidence is required.
