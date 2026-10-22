> **Scope:** Contributor-reference — first security review PA one-pager ship order (TB-1120); must/should/defer matrix; not a buyer assurance claim.

# First security review PA one-pager ship order (TB-1120)

**Audience:** Contributors, founders preparing controlled-pilot security conversations, and GTM claim reviewers.  
**Not** a control attestation — this contract pins **which handouts must exist** before claiming first-review readiness.

**Status:** Shipped contract for **TB-1120** / GTM **M-192** / **M-193**. Honesty CI: **TB-1121** (`scripts/ci/check_security_review_ready_without_musts_honesty.py`).

**Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#first-security-review-ship-order-m-193`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#first-security-review-ship-order-m-193).  
**Path-stable alias:** [`FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_PA_ONE_PAGER.md`](../go-to-market/FIRST_SECURITY_REVIEW_PA_ONE_PAGER_SHIP_ORDER_PA_ONE_PAGER.md).

---

## Decision in one line

“Ready for first buyer security review” means **M-114** (Done) + **must** **M-151** + **M-118** exist and talk-tracks match shipped controls — **not** CPA SOC 2, published third-party pen test, or every PA one-pager (**G-REAL-05** / **G-ASSURANCE-02** remain owner programs).

---

## Ship order

| Priority | Artifact | Status intent |
| --- | --- | --- |
| Already | Isolation (**M-114**) | Done — buyer packet isolation one-pager |
| **Must** | Tenant identity decide-once (**M-151**) | Required before first security review |
| **Must** | Audit Required vs informational (**M-118**) | Required before first security review |
| **Should** (if AI trust in scope) | Model-failed vs quality-rejected (**M-124**) | Agenda-driven |
| Defer (FinOps / second pass) | Process vs provider LLM idempotency (**M-171**) | **Not** a first-review must |
| Agenda-dependent | Prompt injection (**M-115**), retrieval tenancy (**M-153**), inbound webhooks (**M-126**) | Bring if on the agenda |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Security review ready = SOC 2 / 3P pen tested” | Self-attested pack + must handouts; CPA/3P are separate owner rows |
| “Ready for first security review” with only **M-114** | Must include **M-151** + **M-118** (and cite this contract / **TB-1120**) |
| “All PA one-pagers must ship before first conversation” | Must = **M-151** + **M-118** (+ **M-114**); others agenda-driven |
| **M-171** / FinOps idempotency as first-review gate | Defer from first security review — FinOps / second pass |

---

## CI anchors for **TB-1121**

Targets enforced by `scripts/ci/check_security_review_ready_without_musts_honesty.py` (**TB-1121**):

| Anchor class | Example dishonest stub | Safe rewrite |
|--------------|------------------------|--------------|
| Ready without musts | “Ready for first security review” citing only **M-114** | Name **M-151** + **M-118** + **TB-1120** / ship-order section |
| FinOps as first gate | “First security review requires **M-171** / process idempotency” | Defer **M-171** — FinOps / second pass |
| CPA/3P as review bar | “Security review ready = SOC 2 certified” | Self-attested pack + must handouts; **G-REAL-05** / **G-ASSURANCE-02** |
| Missing ship-order cite | “First security review ready” without **TB-1120** / M-193 anchor | Cite buyer packet ship-order or this contract |

Wire: buyer-doc scan in `scripts/ci/check_security_review_ready_without_musts_honesty.py` + `run_buyer_surface_strict_guards.py` (**TB-1121**). Pairs GTM **M-192**.

---

## Related

- GTM **M-192** / **M-193** · Done **M-114** (isolation one-pager)
- Engineering **TB-1121** (honesty CI) · **TB-1112** / **TB-1113** (pilot trust packet — separate bar)
- Does **not** reopen Done **TB-135** / **TB-136** (CPA/3P owner homes **G-REAL-05** / **G-ASSURANCE-02**)
