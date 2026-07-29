> **Reviewed:** 2026-07-28
>
> **Scope:** Buyer-safe audit-trail posture for controlled pilots (GTM **M-118**). Not an assurance attestation.

# Security reviewer audit trail (one-pager)

**Audience:** Security reviewers, principal architects, and GRC teams.

**Verdict:** Required governance, finalize, identity, and export events must leave a durable trail or the governed action fails. Informational telemetry is best-effort; no claim is made that every event shares the business transaction.

## Statement / meaning

| Statement | Meaning |
| --- | --- |
| Required event | A governance-sensitive action is fail-closed when its required audit write cannot be recorded. |
| Informational event | Cost, projection, and funnel telemetry can be incomplete without changing the governed decision. |
| Durable trail | A reviewer can trace a disposition through its audit event and correlation context. |
| Not same transaction | Audit and business writes can still have a dual-write gap; they are not yet one database transaction. |

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Every audit event is transactional.” | Required events are fail-closed; informational telemetry is best-effort. |
| “Append-only means immutable external storage.” | The product maintains an application audit trail; this is not WORM storage or a PKI-signed ledger. |
| “A successful action proves every downstream event was written.” | Verify the required event for the action and retain the identified residual. |

## Reviewer check

1. Perform or inspect a governance disposition and locate the corresponding audit event.
2. Confirm the event identifies the actor, action, time, and applicable correlation/run context.
3. Ask whether the action would be rejected if its required audit write fails.
4. Do not extrapolate this check to cost or funnel telemetry.

## Posture

| Concern | Posture |
| --- | --- |
| Security | Required governance trail is fail-closed, supporting accountable review. |
| Scalability | Informational telemetry can degrade independently of governance decisions. |
| Reliability | The action/audit dual-write window remains until same-transaction work ships. |
| Cost | Uses product audit storage; no external immutable-ledger service is implied. |

## Honest residuals

- **TB-953** is Done: `LogOrThrow` establishes the required-event fail-closed path.
- **TB-954**–**TB-956** remain open for classification, completeness, and same-transaction closure.
- Do not claim a same-transaction audit/business write until **TB-956** is Done.

**Related:** [M-114 isolation one-pager](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) · [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).
> **Reviewed:** 2026-07-28

> **Scope:** Buyer-safe handout on Required vs informational audit (GTM **M-118**). **Must** before first security review per **M-192** / **TB-1120**. Complements **M-114**.

# Audit trail — Required vs informational (security reviewer one-pager)

**Audience:** Security reviewers and principal architects verifying governance dispositions leave a durable trail.

**Claim:** **Required** governance / finalize / identity / export events use fail-closed durable audit write (**TB-953** Done — `LogOrThrow`). Cost, projection, and funnel telemetry may remain **informational / best-effort** (**TB-001** posture). Not every audit event is same-transaction with the domain write until **TB-956**.

---

## Statement / meaning

| Statement | Meaning |
| --- | --- |
| Required = fail-closed | Indefensible paths (approve/reject/waive, finalize/promote, identity/role, export attest) must leave a durable `AuditEvents` row or the operation fails |
| Informational = best-effort | Cost/projection/funnel-style events may use retry-then-swallow; losing them is undesirable, not a governance integrity break |
| Append-only trail | Corrections append; do not promise an editable audit log (**M-160**) |
| Dual-write residual | Domain success with missing Required row is the defect class **TB-954**/**TB-955** harden; same-TX / outbox for hottest paths is **TB-956** |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Every audit event is transactional” | Required set is fail-closed durable; informational may be best-effort |
| “Approve always left a trail even before TB-953” | Pre-migration `TryLogAsync` swallow risk — **TB-953** closed that for Required paths |
| “Same database transaction as the disposition today” | Durable write + retry; same-TX / transactional outbox is **TB-956** (open) |

---

## Reviewer check

1. Perform (or witness) a governance disposition on a pilot host; confirm an `AuditEvents` row for that action type.
2. Ask for the Required vs informational split (INV-003 / **TB-953** tip) — do not accept “all telemetry is equally durable.”
3. For export/attest paths, confirm failure if the Required audit write cannot complete.

---

## Posture

| Concern | Posture |
| --- | --- |
| Security | Fail-closed on indefensible events; least privilege on who can dispose |
| Scalability | Append-only log; probe/alert for orphans (**TB-955**) |
| Reliability | Required abandon is pageable; informational loss does not block product path |
| Cost | Extra write latency on Required paths; no external SIEM required for this V1 claim |

---

## Residuals (honest)

- **TB-954** Required type registry + arch test; **TB-955** abandon alert / orphan probe; **TB-956** same-TX (open).
- Finding disposition race ≠ approval-request CAS — **M-140** / **M-141**.
- Claim honesty bullets: **M-117**.

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115`](BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115) (`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` alias) · [`TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md`](TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md) · [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
