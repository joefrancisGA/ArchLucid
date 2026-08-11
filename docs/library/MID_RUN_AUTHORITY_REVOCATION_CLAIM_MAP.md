> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Mid-run authority revocation — role downgrade / API key revoke

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1537**, 2026-08-10). GTM **M-282** / **M-283**. Pair honesty CI **TB-1538** / **M-282**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#mid-run-authority-revocation-m-283`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#mid-run-authority-revocation-m-283) (GTM **M-283**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-282**).

**Verdict (one line):** Authority for **new HTTP** calls stops at the next authz boundary; **in-flight** sync execute/commit and **already-queued** Worker/outbox/ITSM/webhook work continue under **tenant scope**, not a live principal — API keys fail closed on the **next request** after config reload (no validation cache); **Entra JWT roles ride until token expiry** (AuthVersion is ArchLucid-issued only); SCIM `Active=false` alone is **not** structural role strip.

---

## 1. When authority stops (trace)

| Surface | When it stops | Structural or eventual? |
|---------|---------------|-------------------------|
| New `POST …/execute` / `…/commit` / other `[Authorize]` APIs | Next request after policy/handler sees downgrade | **Structural** (per-request) |
| In-flight sync execute/commit (already inside action) | Does **not** stop mid-pipeline | **Eventual** (request completion / crash) |
| Authority / retrieval / post-commit Worker outbox | Never re-checks initiator; ambient `ScopeContext` | **Eventual** (queue drain) |
| Native ITSM create job already `202` enqueued | No principal re-check at worker | **Eventual** |
| IntegrationEventOutbox → SB / webhooks already queued | Delivery uses connector/HMAC, not architect | **Eventual** |
| API key removed / expired in config | Next `X-Api-Key` authenticate (`IOptionsMonitor` live read) | **Structural** after reload (+ dual-key Append window) |
| ArchLucid-issued JWT + AuthVersion rotate | Next Bearer validate fails | **Structural** |
| Entra workforce JWT role downgrade | Until IdP issues new token / `exp` (+ ~5m skew) | **Eventual** |
| SCIM Manual role override | Next claims transform | **Structural** on next auth (after SCIM lands) |
| SCIM `Active=false` only (no `DirectoryRemovedUtc`) | JWT roles largely unchanged | **Eventual** / weak |
| SCIM deactivate → `DirectoryRemovedUtc` | Project-role fallback denied; tenant JWT roles may remain | **Mixed** |
| UI `/me` proxy cache (~60s) + sessionStorage | Nav/UI lag | **Eventual** (server still enforces) |

---

## 2. Machines (do not conflate)

| Machine | Authz model |
|---------|-------------|
| **A — HTTP host boundary** | `TenantOrProjectCapabilityAuthorizationHandler` + JWT/SCIM claims per request |
| **B — In-flight sync execute/commit** | Authorized once at entry; no mid-run principal cancel |
| **C — Worker ambient scope** | INV-001 job scope from outbox/payload — **not** actor-scoped |
| **D — BackgroundJobs ITSM** | Enqueue-time `ExecuteAuthority` only |
| **E — Integration outbox / webhooks** | Tenant connector identity |

---

## 3. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Revoke instantly stops in-flight LLM execute” | Stops **new** HTTP; in-flight continues |
| “SCIM disable instantly kills Entra JWT roles” | `Active=false` alone does not; Entra roles until new token |
| “Queued webhooks/ITSM re-check architect before delivery” | Tenant-scoped at-least-once; no principal re-check |
| “API keys are cached for N minutes after revoke” | Live `IOptionsMonitor` read — opposite overclaim |
| “AuthVersion covers Entra tokens” | ArchLucid-issued JWT path only |

---

## 4. Related owners (do not conflate delivery with actor revoke)

| ID | Role |
|----|------|
| INV-001 / ADR 0037 | Decide-once scope; jobs use ambient scope |
| Open **TB-999** / **M-150** | Single-derivation honesty |
| Done **TB-1523** / **M-277** | Mid-run crash — in-flight sync continues until request end; see [`CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md`](CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md) |
| Open **TB-1530** / **M-280** | ITSM/outbox delivery is tenant-scoped at-least-once — **no** principal re-check at worker; see [`ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md`](ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md) |
| ADR 0059 | SPA Bearer / AuthVersion residual |
| Done **TB-1537** / **M-282** | This revocation claim map |
| Open **TB-1538** / **M-282** | Honesty CI follow-on |
| Done **TB-1570** / **M-294** | Compromised API key spend until revoke — [`PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md`](PAYING_TENANT_LLM_SPEND_STORM_AND_BILLING_DISPUTE_CLAIM_MAP.md) |

---

## 5. Optional follow-ons (not required to close honesty pin)

1. Document SCIM PATCH `active=false` vs Deactivate/`DirectoryRemovedUtc` gap.  
2. Gate custom permission transform on directory-removed / Active.  
3. Optional Entra CAE / introspection (customer IdP) — not claimed as shipped.  
4. Cancel-token cooperative abort for long execute (product gap; do not sell as present).
