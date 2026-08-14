# Cold-start baseline register

**Purpose:** One row per captured deploy proves whether free CD levers (**TB-754**–**TB-758**) are enough before paid Azure changes (CPU, R2R, `min_replicas`, Redis, pre-migrate Jobs). Owner cost × latency matrix and per-lever go/no-go: [`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../../library/PERFORMANCE_COLD_START_AND_TRIMMING.md#paid-lever-decision-pack-tb-2124) (**TB-2124**).

**How to add a row:** Follow [`COLD_START_MEASUREMENT.md`](../../runbooks/COLD_START_MEASUREMENT.md). Copy the table template from an existing file, name it `<environment>-<yyyy-mm-dd>-<short-sha>.md`, and link it below.

## Recorded baselines

| Date | Environment | CD run / commit | File |
|------|-------------|-----------------|------|
| 2026-08-14 | staging (pending CD) | **TB-2146** Phase A+B capture + paid-lever reopen gate — run checklist after next staging CD | [`staging-2026-08-14-tb2146-pending.md`](staging-2026-08-14-tb2146-pending.md) |
| 2026-08-10 | dev (pending CD) | **TB-2162** STJ source-gen hot slices — remeasure Phase B on next deploy | [`dev-2026-08-10-tb2162-stj-source-gen-pending.md`](dev-2026-08-10-tb2162-stj-source-gen-pending.md) |
| 2026-08-10 | dev (pending CD) | **TB-2161** runtime knobs — remeasure on next deploy | [`dev-2026-08-10-tb2161-runtime-knobs-pending.md`](dev-2026-08-10-tb2161-runtime-knobs-pending.md) |
| 2026-07-16 | dev (representative ACA) | [GitHub run 29542895350](https://github.com/joefrancisGA/ArchLucid/actions/runs/29542895350) · `806b3a0` | [`dev-2026-07-16-806b3a0.md`](dev-2026-07-16-806b3a0.md) |

**Staging:** Use `scripts/ops/enable-cold-start-staging-baseline-checklist.ps1` and `scripts/ops/capture-cold-start-baseline.ps1` (**TB-2146**) on the next routine staging CD; append a dated row here and retire the pending scaffold when numbers are recorded. Dev is acceptable as an interim representative profile until staging is captured.
