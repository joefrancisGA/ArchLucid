# Cold-start baseline — runtime knobs enabled (pending CD remeasure)

**Date:** 2026-08-10  
**Environment:** dev (next routine CD)  
**Commit:** pending capture after **TB-2161** merge  
**Change:** `ArchLucid.Host.Runtime.props` — Server GC + `GCConserveMemory=1`, Tiered PGO, invariant globalization; Dockerfile drops `icu-libs`.

## Expected hypothesis (not yet measured)

| Phase | Prior dev baseline | Expected direction |
|-------|-------------------|--------------------|
| **A — revision → `/health/ready`** | **~66 s** ([`dev-2026-07-16-806b3a0.md`](dev-2026-07-16-806b3a0.md)) | **−50 to −150 ms** from invariant globalization / smaller image pull; Server GC neutral to slightly faster under concurrent warm-up |
| **B — `/api/auth/me` after ready** | *Not captured* | Tiered PGO may improve after steady-state warm-up; capture on same deploy |

## Rollback

Remove `ArchLucid.Host.Runtime.props` import from host `.csproj` files and restore `icu-libs` + `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false` in `ArchLucid.Api/Dockerfile`.

## Owner decision

**Keep** unless Phase **A** regresses past **120 s** investigate gate or API working set exceeds **1.0 Gi** OOM threshold after Server GC.
