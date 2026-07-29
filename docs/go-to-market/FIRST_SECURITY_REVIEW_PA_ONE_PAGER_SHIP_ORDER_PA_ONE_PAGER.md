> **Reviewed:** 2026-07-28

> **Scope:** Ship-order for PA one-pagers before the first buyer security review (GTM **M-193** / engineering **TB-1120**). Not itself a control attestation.

# First security review — PA one-pager ship order

**Audience:** Founder preparing a controlled-pilot security conversation; PA diligence.

**Claim:** “Ready for first buyer security review” means the **must** handouts below exist and talk-tracks match shipped controls — not that CPA SOC 2 or a published third-party pen test exists (**G-REAL-05** / **G-ASSURANCE-02** remain owner programs; tech **TB-135**/**TB-136** Done tracking only).

---

## Ship order

| Priority | Artifact | Status intent |
| --- | --- | --- |
| Already | Isolation (**M-114**) | Done — packet `#isolation-one-pager-m-114` |
| **Must** | Tenant identity decide-once (**M-151**) | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151) (`TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md` alias) |
| **Must** | Audit Required vs informational (**M-118**) | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118`](BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-audit-trail-m-118) (`SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md` alias) |
| **Should** (if AI trust in scope) | Model-failed vs quality-rejected (**M-124**) | [`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md`](MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md) |
| Defer (FinOps / second pass) | Process vs provider LLM idempotency (**M-171**) | Not a first-review must |
| Agenda-dependent | Prompt injection (**M-115**), retrieval tenancy (**M-153**), inbound webhooks (**M-126**) | Bring if those topics are on the agenda |

---

## Live script

Use [`BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113`](BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113). Does **not** replace **G-REAL-06** / **G-REAL-07**.

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Security review ready = SOC 2 / 3P pen tested” | Self-attested pack + these handouts; CPA/3P are separate owner rows |
| “All PA one-pagers must ship before first conversation” | Must = **M-151** + **M-118** (+ **M-114**); others agenda-driven |

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#minimum-pilot-trust-packet-m-191`](BUYER_SECURITY_PROCUREMENT_PACKET.md#minimum-pilot-trust-packet-m-191) (`MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_PA_ONE_PAGER.md` alias) · [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
