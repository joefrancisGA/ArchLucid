> **Scope:** Private-beta access-path assessment snapshot (2026-09-14). Follows [`private_beta_access_prompt_07152026.md`](private_beta_access_prompt_07152026.md). Refresh when re-running live proofs.

# Private-beta access-path assessment — 2026-09-14

**Verdict: PARTIALLY PROVEN (harness + specs; trunk push corset green; first JwtBearer CI witness pending completion)**

**Auth mode focus:** JwtBearer (CI mint + session injection). Full Entra OIDC browser redirect not witnessed in this pass.

---

## Six proofs

| # | Proof | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Receive and use invitation | **PROVEN (harness)** | `POST /v1/admin/users/invite`, `live-api-invite-flow.spec.ts`, TB-927 Done |
| 2 | Authenticate successfully | **PROVEN (CI harness)** | JwtBearer mint in `private-beta-access-on-push.yml`; not full IdP redirect |
| 3 | Correct tenant/workspace | **PROVEN (tests)** | Scope headers + `live-api-private-beta-access.spec.ts` |
| 4 | Reach core workflows | **PROVEN (tests)** | Operator paths to `/reviews/new`, first-review guide |
| 5 | First meaningful action | **PROVEN (tests)** | Create run → visible in `/reviews` (core-pilot + private-beta specs) |
| 6 | Recover from expected failures | **PROVEN (tests)** | Expired/revoked/accepted invite, `/403`, session expiry, callback error — `live-api-private-beta-access.spec.ts`; deep links + branded 404 — `live-api-private-beta-wave-3.spec.ts` |

---

## Trunk CI (updated 2026-09-14 ~22:45 UTC)

| Check | Status | Notes |
| --- | --- | --- |
| `Operator UI: typecheck (blocking)` | **green** | Run `34904897218` on `#3256` merge |
| `CI: beta-readiness wiring guards` | **green** | Same run |
| `Operator UI: jwt-bearer production build` | **green** | Same run |
| `.NET: push corset` | **green** | #3256 — career posture payload + extractor ZIP count fix; run `34904897218` |
| `Operator UI: private-beta access-path (JwtBearer)` | **in-progress** | Run `34904897194` on `#3256` merge — refresh when complete |

---

## Recovery-case coverage audit

| Case | Spec |
| --- | --- |
| Expired invite | `live-api-private-beta-access.spec.ts` |
| Revoked / accepted invite | same |
| Wrong tenant / no role → `/403` | same |
| Session expiry + deep link | same + wave-3 |
| OIDC callback error | same |
| Dead run deep link → branded 404 | `live-api-private-beta-wave-3.spec.ts` (added round-2) |
| Signed-out deep link `returnUrl` | wave-3 matrix |

---

## P0 operational (not access-path logic)

1. Witness **`private-beta-access-on-push` green** on `master` (run `34904897194` or later).
2. Owner: run `scripts/release-smoke.ps1` / `./scripts/release-smoke.sh` for Gate 1 UNKNOWN.
3. Owner: first Real proof toward **G-REAL-06**.

---

## Out of scope (per prompt)

Polish, marketing, new features, GTM cohort rows M-90/M-44/M-91/M-92.
