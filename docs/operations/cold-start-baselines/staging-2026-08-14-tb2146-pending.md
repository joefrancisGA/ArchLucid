# Cold-start baseline — staging (pending CD capture)

**Date:** 2026-08-14  
**Environment:** staging (next routine CD)  
**Commit:** pending capture after **TB-2146** enablement pack  
**Change:** Staging baseline row + Phase **B** median capture workflow; paid-lever reopen gate per **TB-2124** matrix.

## Expected capture workflow (not yet measured on staging)

| Phase | Dev baseline | Staging gate | Capture method |
|-------|--------------|--------------|----------------|
| **A — revision → ready** | ~**66 s** platform ([`dev-2026-07-16-806b3a0.md`](dev-2026-07-16-806b3a0.md)) | **≤ 90 s** platform (≤ **120 s** investigate) | CD log + ACA revision timestamps (**TB-754**/**TB-755**) |
| **B — `/api/auth/me` after ready** | *Not captured* | **median < 1.0 s** | `scripts/ops/capture-cold-start-baseline.ps1` (3 samples) |
| **C — deployment-evidence** | Pass attempt **1** | Pass attempt **1–2** | Post-deploy validation log |

## Paid-lever reopen triggers (**TB-2146**)

| Symptom | Threshold | Levers to reconsider (owner sign-off) |
|---------|-----------|---------------------------------------|
| Phase **A** slow | Platform **> 120 s** | `min_replicas`, pre-migrate Job (V1.1+), SQL/connectivity fixes |
| Phase **B** slow | Median **≥ 2.0 s** | ReadyToRun, CPU bump, `min_replicas` (cost note required) |
| Within gates | Phase **B** **< 1.0 s**, Phase **A** ≤ **90 s** | Paid levers remain **no-go** until new evidence |

## Owner decision

Run [`enable-cold-start-staging-baseline-checklist.ps1`](../../../scripts/ops/enable-cold-start-staging-baseline-checklist.ps1) after the next staging CD; replace this pending file with a dated `staging-<yyyy-mm-dd>-<sha>.md` row.
