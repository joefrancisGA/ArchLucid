> **Scope:** Pending cold-start remeasure note for TB-2161 Host.Runtime knobs on next CD — not a measured baseline and not buyer-facing.

# Cold-start baseline — runtime knobs enabled (pending CD remeasure)

**Date:** 2026-08-10  
**Environment:** dev (next routine CD)  
**Commit:** pending capture after **TB-2161** merge  
**Change:** `ArchLucid.Host.Runtime.props` — Server GC + `GCConserveMemory=1`, Tiered PGO; **invariant globalization declined** (SqlClient incompatible); Dockerfile keeps `icu-libs`.

## Expected hypothesis (not yet measured)

| Phase | Prior dev baseline | Expected direction |
|-------|-------------------|--------------------|
| **A — revision → `/health/ready`** | **~66 s** ([`dev-2026-07-16-806b3a0.md`](dev-2026-07-16-806b3a0.md)) | Server GC neutral to slightly faster under concurrent warm-up (no invariant-globalization image shrink) |
| **B — `/api/auth/me` after ready** | *Not captured* | Tiered PGO may improve after steady-state warm-up; capture on same deploy |

## Rollback

Remove `ArchLucid.Host.Runtime.props` import from host `.csproj` files (Server GC / Tiered PGO / `GCConserveMemory`). ICU + non-invariant globalization must stay for SqlClient.

## Owner decision

**Keep Server GC + Tiered PGO** unless Phase **A** regresses past **120 s** investigate gate or API working set exceeds **1.0 Gi** OOM threshold after Server GC. **Invariant globalization declined** 2026-08-10 — blocks SQL bootstrap.
