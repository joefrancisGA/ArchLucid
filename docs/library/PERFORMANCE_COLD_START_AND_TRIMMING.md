> **Scope:** Contributor-reference — Cold start, profiling, and trimming (API) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Cold start, profiling, and trimming (API)

**Objective:** Reduce first-request latency and deployment size where safe.

**Assumptions:** Default shipping remains **non-trimmed** until each feature area is audited for reflection/DI edge cases.

## Profiling

- Capture **Startup** and **first request** with `dotnet-trace` (`.NET Runtime` + `ASP.NET Core` providers) or your APM vendor.
- Watch **JIT**, **R2R** (if enabled), **SQL migration** (`DatabaseMigrator.Run`), and **first OpenAI/embedding** calls — these dominate cold paths more than minor assembly savings.

## CD cold-start measurement (operators)

After deploy, split **revision → `/health/ready`** from **first authenticated business call** (`/api/auth/me` when **TB-758** is configured). Record baselines before proposing paid levers (`min_replicas`, R2R, CPU bump).

- **Runbook:** [`docs/runbooks/COLD_START_MEASUREMENT.md`](../runbooks/COLD_START_MEASUREMENT.md) (**TB-759**)
- **Baseline register:** [`docs/operations/cold-start-baselines/`](../operations/cold-start-baselines/README.md)

## Trimming (optional)

- `PublishTrimmed` and `TrimMode` can shrink containers but break **reflection-based** registration (some serializers, certain DI conveniences). Enable only after testing a **published** build end-to-end (health, migrations, OpenAPI, one replay path).
- Prefer **tiered publishing**: trimmed image for **stateless read-only** roles only if split in the future; keep the main API untrimmed until validated.

## Container layers

- Multi-stage Dockerfiles (`ArchLucid.Api/Dockerfile`) already separate restore/publish/runtime — layer cache hits matter more than trimming for most teams.

## See also

- Sustained throughput and p50/p95/p99 baselines: `docs/LOAD_TEST_BASELINE.md` (k6 against Compose `full-stack`, plus scaling thresholds).
- **Free-cost CD cold-start ops cluster (no Azure SKU bump):** **TB-754**–**TB-759** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) — post-deploy retries, canary+bake, avoid no-op revisions, UI warm-up tolerance, synthetic smoke path, [measurement runbook](../runbooks/COLD_START_MEASUREMENT.md).
