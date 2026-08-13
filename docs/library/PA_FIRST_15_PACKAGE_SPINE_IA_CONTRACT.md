> **Scope:** Contributor-reference — PA first-15 completion and package-spine IA unlock (TB-1030); not a buyer-facing trust claim.

# PA first-15 completion + narration-free package-spine IA unlock contract

**Status:** Active (V1)  
**Backlog:** **TB-1030** (this contract) · **TB-1031** (honesty CI anchors — open until shipped)  
**Audience:** Principal architects, product/nav authors, GTM copy owners, coding agents  
**Related:** [CANONICAL_FIRST_RUN_PATH.md § expert lane](./CANONICAL_FIRST_RUN_PATH.md#expert-principal-architect-15-minute-lane) · [FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md](./FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md) (alias) · [OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md](./OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md) (**TB-1026**) · [MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md](./MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md) (**TB-1028**) · [FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-180**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-181](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pa-first-15-package-spine-ia-m-181) · PA alias [PA_FIRST_15_PACKAGE_SPINE_IA_PA_ONE_PAGER.md](../go-to-market/PA_FIRST_15_PACKAGE_SPINE_IA_PA_ONE_PAGER.md) · Done **TB-739**

---

## 1. Purpose

Name what a principal architect must complete in **≤15 minutes without founder narration**, which **IA unlock** makes that path product-led, and which residuals still force narration — so GTM and UI authors do not invent cohort proof or Operate-first demos.

---

## 2. Non-claims / non-goals (say first)

| Do **not** claim or do | Why |
|------------------------|-----|
| “15 minutes without founder narration” / “product-led first value” / “no SE required” as **proven** | Live cohort is GTM **M-44** (V1.1) — not shipped by this contract. |
| “Won’t dismiss” without cohort evidence | Dismissal measurement is **M-44** / **M-48**. |
| Success = finishing Operate / Graph / Compare / Governance tour | Success is **decision signal** on the package spine. |
| Reopen **M-44** / **M-47** / **M-48** as engineering V1 gaps | Human-led validation stays GTM V1.1. |
| Force Azure extractor or Graph into the first 15 minutes | Expert lane assumes brief + upload when that suffices. |
| CPA SOC 2 or published third-party pen-test | Out of scope; do not imply. |

---

## 3. Must-complete set (≤15 min, unaided)

| Step | Route / action | Success signal |
|------|----------------|----------------|
| 1 | `/reviews/new` — brief ready; decline feature tours | Review request admitted |
| 2 | Minimal intake (MUST fields only) | `runId` captured |
| 3 | Execute; **stay** on `/reviews/{runId}` | Findings list visible |
| 4 | Minute-12 checkpoint (below) | Pass → continue; fail → **stop** |
| 5 | Finalize / Commit | `goldenManifestId` present |
| 6 | Locate sponsor export / architecture package **unaided** | Sendable artifact path found without leaving package spine |

**Canonical narrative depth:** [CANONICAL_FIRST_RUN_PATH.md § expert lane](./CANONICAL_FIRST_RUN_PATH.md#expert-principal-architect-15-minute-lane). This contract owns the **IA unlock + claim boundary**; the expert lane owns minute-by-minute ceremony.

---

## 4. Success = decision signal

| Success | Not success |
|---------|-------------|
| At least one **non-obvious** finding with a defendable **evidence trail**, then commit + unaided export | Completing every UI surface |
| PA would raise the finding in a real architecture review | Operate tour completion |
| Stop at minute 12 with a dismissal code when value is absent | Ceremony without value |

**PA Q10 see list:** non-obvious finding + evidence → commit → unaided export.

---

## 5. Minute-12 checkpoint (mandatory)

At **minute 12**, both must be true:

1. At least one finding is **non-obvious** (not already concluded from the brief alone).
2. That finding links to an **evidence trail** defendable to a sponsor.

| Result | Action |
|--------|--------|
| YES to both | Continue to Finalize + export |
| NO to either | **Stop** — do not commit; record dismissal codes per [FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) |

---

## 6. IA unlock (package spine)

| Required co-location on `/reviews/{runId}` | Forbidden as **first-click** requirement |
|-------------------------------------------|------------------------------------------|
| Findings (or equivalent decision signals) | Operate routes |
| ReadyForCommit / Finalize | Graph / Compare / Replay |
| Sponsor-export / architecture-package affordance | Governance / policy-pack configuration as first click |

**Supporting ships (not substitutes for spine):**

| Ship | Role |
|------|------|
| Done **TB-739** | Home sample/review **Recommended first** |
| Done **TB-1026** | Architecture package as primary object; `/reviews` spine |
| Done **TB-1028** | Marketing land one universe (Claims `/see-it` Option A) |

---

## 7. Explicit skips (first 15 minutes)

| Skip | Why |
|------|-----|
| Operate: Graph, Compare, Replay | Not required for first value signal |
| Governance / policy-pack configuration | After commit |
| ROI scorecard / procurement pack | Post-handoff |
| Azure extractor when brief + upload suffices | Expert evidence-only path |
| Full V1 scope / integration catalog | Assumes provisioned platform |

---

## 8. Narration-forcing residuals (product, not cohort)

| Residual | Honest pin |
|----------|------------|
| Export discovery still buried (e.g. H5 / deep chrome) | Do not claim “unaided export” until affordance is co-located or disclosed |
| Peer **Create** pitched as equal product | Package-spine verbs (**TB-1026**) |
| Contoso `/demo/preview` ≠ Claims `/see-it` dual universe | Done **TB-1028** — do not reintroduce |
| Missing async readiness cue | Open **TB-1013** — disclose when execute is not instant |
| Founder narration still required in practice | Measure via **M-44**; do not claim “no SE required” without it |

---

## 9. CI anchors for **TB-1031** (shipped)

Mechanical gate: `scripts/ci/check_first_15_package_spine_honesty.py` (wired in `scripts/ci/run_buyer_surface_strict_guards.py`).

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| “15 minutes without narration” / “product-led” / “no SE” without spine caveats | Require §6 Finalize + export on `/reviews/{runId}` + §5 minute-12 |
| Absent **M-44** as proof the path is product-led | Require §2 non-claims |
| First value routed through Graph / Compare / Governance before commit | Require §6 / §7 skips |
| Dual-universe marketing land as the expert first click | Require Done **TB-1028** / Claims Option A |

**Named UI spine regression (for TB-1031 / Playwright/Vitest):**

1. Committed or ReadyForCommit run-detail exposes Finalize + sponsor-export (or equivalent buyer “evidence package”) **without** navigating Operate.
2. FIRST_15 skip routes (Graph, Compare, Replay, governance config) are **not** required primary CTAs on the package spine for that session.

Vitest: `archlucid-ui/src/lib/first-15-package-spine-honesty.test.ts`.

---

## 10. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Expert lane does not weaken tenancy or mode labeling; commit still seals package truth (**TB-1003**). |
| **Scalability** | Narration-free path reduces SE load; does not claim load-tested AOAI capacity. |
| **Reliability** | Minute-12 stop prevents ceremony without value; async gaps (**TB-1013**) must be disclosed. |
| **Cost** | Docs + named regression only; live cohort cost stays GTM **M-44**. |

---

## 11. One-line buyer / PA answer

**In the first 15 minutes, stay on `/reviews/{runId}`: hit the minute-12 non-obvious+evidence checkpoint, Finalize, and locate sponsor export unaided — Operate/Graph/Compare are not required first clicks; absent M-44 cohort results do not prove the path is product-led.**
