> **Scope:** Private-beta access-path assessment snapshot (2026-09-14 22:22 UTC). Follows [`private_beta_access_prompt_07152026.md`](private_beta_access_prompt_07152026.md). Refresh this file when re-running live proofs.

# Private-beta access-path assessment — 2026-09-14

**Verdict: PARTIALLY PROVEN (code + CI wiring; live Playwright witness pending stable trunk run)**

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
| 6 | Recover from expected failures | **PROVEN (tests)** | Expired/revoked/accepted invite, `/403`, session expiry, callback error — `live-api-private-beta-access.spec.ts`; deep links — `live-api-private-beta-wave-3.spec.ts` |

---

## Trunk CI (2026-09-14)

| Check | Status | Notes |
| --- | --- | --- |
| `Operator UI: typecheck (blocking)` | **shipped** | #3254 merged |
| `CI: beta-readiness wiring guards` | **open → fixed in branch** | AO-38 marker missing in `working-share-href.test.ts` |
| `Operator UI: private-beta access-path (JwtBearer)` | **in-progress** | 0/N recent green on `master` before typecheck fix; re-run after AO-38 |

---

## Recovery-case coverage audit

| Case | Spec |
| --- | --- |
| Expired invite | `live-api-private-beta-access.spec.ts` |
| Revoked / accepted invite | same |
| Wrong tenant / no role → `/403` | same |
| Session expiry + deep link | same + wave-3 |
| OIDC callback error | same |
| Dead deep link (partial) | wave-3 `returnUrl` matrix; branded 404 elsewhere |

**Gap:** No dedicated private-beta spec for generic 404 branded recovery — lower priority than invite/auth P0s.

---

## P0 operational (not access-path logic)

1. Land AO-38 + stable `private-beta-access-on-push` green on `master`.
2. Owner: run `release-smoke.ps1` for Gate 1 UNKNOWN.
3. Owner: first Real proof toward **G-REAL-06**.

---

## Out of scope (per prompt)

Polish, marketing, new features, GTM cohort rows M-90/M-44/M-91/M-92.
