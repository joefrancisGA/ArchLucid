# Cold-start baseline register

**Purpose:** One row per captured deploy proves whether free CD levers (**TB-754**–**TB-758**) are enough before paid Azure changes (CPU, R2R, `min_replicas`, Redis, pre-migrate Jobs).

**How to add a row:** Follow [`COLD_START_MEASUREMENT.md`](../../runbooks/COLD_START_MEASUREMENT.md). Copy the table template from an existing file, name it `<environment>-<yyyy-mm-dd>-<short-sha>.md`, and link it below.

## Recorded baselines

| Date | Environment | CD run / commit | File |
|------|-------------|-----------------|------|
| 2026-07-16 | dev (representative ACA) | [GitHub run 29542895350](https://github.com/joefrancisGA/ArchLucid/actions/runs/29542895350) · `806b3a0` | [`dev-2026-07-16-806b3a0.md`](dev-2026-07-16-806b3a0.md) |

**Staging:** Capture the next routine staging CD using the same template; append a row here. Dev is acceptable as an interim representative profile until staging is recorded.
