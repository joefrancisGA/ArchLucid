> **Scope:** Contributor-reference — operator primary-object hierarchy and nav/route collapse (TB-1026); not a buyer-facing trust claim.

# Operator primary-object hierarchy + nav/route collapse contract

**Status:** Active (V1)  
**Backlog:** **TB-1026** (this contract) · **TB-1027** (honesty CI anchors — open until shipped)  
**Audience:** Principal architects, product/nav authors, GTM copy owners, coding agents  
**Related:** [UI_GLOSSARY_V1.md](../go-to-market/UI_GLOSSARY_V1.md) · [POSITIONING.md](../go-to-market/POSITIONING.md) · [COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md](./COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**) · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-176**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-177](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#operator-primary-object-nav-collapse-m-177) · PA alias [OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_PA_ONE_PAGER.md](../go-to-market/OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_PA_ONE_PAGER.md) · Done **TB-738**–**TB-747**

---

## 1. Purpose

Name the operator’s **primary object**, the **canonical route spine**, and which nav/copy surfaces **collapse** that model — so day-one workflows and buyer language do not treat findings, decisions, or dual create/review products as the hireable unit.

---

## 2. Non-claims / non-goals (say first)

| Do **not** claim or do | Why |
|------------------------|-----|
| “Findings / decisions are the hireable unit of truth.” | Children of the architecture package (**TB-1003**). |
| “Create and review are two equal products.” | Lifecycle **verbs** on the package spine. |
| Wholesale rename of every “Reviews” UI label | Collapse patterns first; list noun **Reviews** can remain a work-unit label. |
| Delete `/governance/findings` | Allowed as cross-package register when package deep-links stay honest. |
| Change API `runId` | HTTP contracts stay; buyer copy uses review/package vocabulary. |
| Physical App Router moves | **TB-748**+ — out of scope for this contract. |

---

## 3. Object hierarchy

| Noun | Role | API / persistence |
|------|------|-------------------|
| **Architecture package** | **Primary product object** — committed golden manifest + evidence trail | Committed `GoldenManifestId` + `ManifestHash` (**TB-1003**) |
| **Review** | Lifecycle / list work unit (`ArchitectureRun`) | Route `/reviews/{runId}`; API still `runId` |
| Finding | Child signal | Nested under package / cross-package with package links |
| Decision / approval | Governance child | Not a substitute for finalized package |
| Evidence / exports | Package artifacts | Nested under package detail |

**Collapse risk:** substituting findings list, bare `run`, or dual create/review headlines for the package noun.

---

## 4. Canonical spine

| Step | Route / surface |
|------|-----------------|
| List | `/reviews` |
| Package detail | `/reviews/{runId}` (+ nested findings, signed-record, evidence) |
| Finalize / export | From package context — not from finding-as-home |

Operator first meaningful action should reach finalize + export on this spine (**TB-1030** / **M-181** complements).

---

## 5. Collapse surfaces (fix or disclose)

| Surface | Why it collapses the model | Honest alternative |
|---------|----------------------------|--------------------|
| `/governance/findings` as **default home** without package links | Finding-as-peer / unit of truth | Cross-package register + package deep links |
| Sidebar **Reviews** / **Runs** pitched as the product (no package subordination in buyer claims) | List noun over primary object | Keep Reviews as work-unit label; package noun in hub/help/positioning |
| Peer **Create architecture** + **Start review** as two products | Dual-product reading | Verbs on one package spine |
| Bare `run` / `/runs` in buyer copy | Eng jargon as product noun | Review / architecture package |
| Approval / decision UI without package breadcrumb | Decision chrome as the package | Parent package context always visible |

---

## 6. Allowed (not collapse)

| Pattern | Condition |
|---------|-----------|
| Risk register / cross-package findings | Clearly “across packages” + package deep links |
| List noun **Reviews** | Package noun appears in hub, help, and positioning |
| API `runId` in contracts / OpenAPI | Unchanged; not buyer headline |

---

## 7. CI anchors for **TB-1027** (shipped)

Mechanical gate: `scripts/ci/check_operator_primary_object_honesty.py` (wired in `scripts/ci/run_buyer_surface_strict_guards.py`).

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| Finding / decision as primary hireable object | Require §3 package primary |
| Create vs review as two equal products | Require §2 / §5 verb framing |
| Buyer “run” as list/home noun without review/package alias | Coordinate `review-terminology-guard` — do not duplicate full **TB-738** suite |
| Decision/approval alone = signed package | Require **TB-1003** + package parent |

Vitest: `archlucid-ui/src/lib/operator-primary-object-honesty.test.ts`.

---

## 8. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Mis-framing findings as the package does not create a tenancy bypass; it creates procurement / trust confusion. |
| **Scalability** | One spine reduces duplicate “product” surfaces operators must learn. |
| **Reliability** | Canonical routes reduce “where do I finalize?” dead-ends. |
| **Cost** | Docs + claim CI — no App Router migration required for this TB. |

---

## 9. One-line buyer answer

**The hireable unit is the architecture package; findings and decisions are children; create and review are verbs on the `/reviews` → `/reviews/{runId}` spine — not two equal products.**
