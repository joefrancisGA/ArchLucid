> **Scope:** Private-beta access-path assessment snapshot (2026-09-14). Follows [`private_beta_access_prompt_07152026.md`](private_beta_access_prompt_07152026.md). Refresh when re-running live proofs.

# Private-beta access-path assessment — 2026-09-14

**Verdict: PARTIALLY PROVEN (harness + specs; first trunk JwtBearer CI witness still pending)**

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

## Trunk CI (updated 2026-09-14 ~22:35 UTC)

| Check | Status | Notes |
| --- | --- | --- |
| `Operator UI: typecheck (blocking)` | **shipped** | #3254 — green on `#3255` push (run `34904181565`) |
| `CI: beta-readiness wiring guards` | **shipped** | #3255 AO-38 fix — green on run `34904181565` |
| `Operator UI: jwt-bearer production build` | **shipped** | Green on run `34904181565` |
| `.NET: push corset` | **fix pending** | Failed run `34904181565` (integration payload + extractor ZIP count); fix in progress |
| `Operator UI: private-beta access-path (JwtBearer)` | **in-progress** | Run `34904181412` on `#3255` merge; **0 historical green** on recent `master` |

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

1. Land push-corset fix + witness **`private-beta-access-on-push` green** on `master`.
2. Owner: run `scripts/release-smoke.ps1` / `./scripts/release-smoke.sh` for Gate 1 UNKNOWN.
3. Owner: first Real proof toward **G-REAL-06**.

---

## Out of scope (per prompt)

Polish, marketing, new features, GTM cohort rows M-90/M-44/M-91/M-92.
