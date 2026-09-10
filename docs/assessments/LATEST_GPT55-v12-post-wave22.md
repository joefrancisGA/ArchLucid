# ArchLucid Strategic Release and Market Readiness Assessment (v12 — post wave 22)

**Pass date:** 2026-09-10. **Computed fresh** against branch `cursor/as-prompt-queue-close-97a4` (9 commits ahead of `origin/master` `2d14bb66fe`). v11 remains archived context at [`LATEST_GPT55.md`](LATEST_GPT55.md) (2026-09-09, trunk `420205b38d`).

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). Code-grounded desk review; no live Azure OpenAI call; no subagents for scoring.

## v12 pass note — wave 22 mechanism landed on branch; density table clean; support band on wire; one share leak remains

This pass re-scores after **architecture-spine wave 22 (AS-001–AS-100)** on branch `cursor/as-prompt-queue-close-97a4`, not trunk alone.

**Shipped on this branch (not yet on `origin/master`):**

- ADR 0084–0087: diagrams + bound inventory on decide path; semantic support band; Career/Rehearsal doors; optional RestrictToShares.
- Share ACL stack AS-087–AS-099: SQL, API (grant/revoke/restrict), list/get 404 for hidden packages, audit, OpenAPI, Working desk panel.
- Semantic support band **on the finding wire**: `FindingSemanticSupportBandEmissionApplicator` in `FindingsMergeAndGateStage`; OpenAPI `semanticSupportBand`; `FindingSemanticSupportBandChip` on decision-grade surfaces (AS-061/072).
- Leftover 67-band `EvidenceRefs` closed: `insight-density-engine-distribution.md` shows **0** `No evidence` / `WouldDemoteAt65Count = 0` across 28 emitting engines.
- PCI P1 slice (`pci-007`, `pci-009`) and QR-26/27 citation pattern on `CollectWithProductShapedGraphNodeFallback`.

**Still open (highest leverage):**

| Gap | Tracking | Blocks headline? |
|-----|----------|------------------|
| **AS-094** — Architectures hub + global search use draft inventory, not share-filtered architecture list | Wave 22 residual | Security / GRI — restricted titles can leak in hub cards |
| **Gate 1 UNKNOWN** — no observed staging first review with bind | Owner + `ship-gate-evidence` | Validation, not mechanism |
| **G-REAL-06** — zero real-mode pilots | GTM owner | Market proof |
| **Full `ci.yml` matrix stale-red** (last dispatch 2026-08-28) | QR-35 / process | Runtime confidence |
| **Wave 22 not merged to `master`** | PR #2758 | Trunk score lags branch |
| **Live merge queue not applied** | Owner | Process |
| **Wave 23 concurrent desk / work-lease** | ADR 0084 follow-up | Livelihood UX, not V1 gate |

**Do not re-commission:** QR-01–QR-34 bodies, AS-001–AS-093, DX-01–DX-76, GTM M-90/M-44/M-91/M-92, TB-135/TB-136, G-REAL-06 host Mode flip.

---

## Executed this pass (runtime evidence)

| # | Observation | Result |
|---|-------------|--------|
| 1 | `git fetch origin master` + branch delta | Branch **9** commits ahead; wave 22 + share stack |
| 2 | `insight-density-engine-distribution.md` | **28** engines; **0** `No evidence`; **0** `Would demote at 65` |
| 3 | `FindingsMergeAndGateStage.cs` | Calls `FindingSemanticSupportBandDefaultsApplicator` + `EmissionApplicator` |
| 4 | OpenAPI / TS types | `FindingSemanticSupportBand` enum present on finding schema |
| 5 | UI | `FindingSemanticSupportBandChip` on dense table + quick decision surfaces |
| 6 | Share API | `ListArchitectures` passes `actorOid`; restricted → omitted / get → 404 |
| 7 | Hub data path | `useArchitectureDraftListQuery` → `listDraftRequests` — **no share filter** |
| 8 | AS-054 ratchet | `ArchitectureSpineAs054ForbiddenCollectorArchitectureTests` exists |
| 9 | PCI P1 | `ga-starter-compliance.rules.json` + `BundledPolicyPackDeclarationThemeTests` cover `pci-007`/`pci-009` |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 83.91% (wave 22 branch mechanism)**

**Trunk-only estimate (without wave 22 merge): ~81.8%** — v11 plus partial QR merges; do not treat trunk as current for spine claims.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`.

**What is true on the branch.** Diagrams compile; inventory binds and merges on execute; typed engines cite product-shaped evidence on goldens; semantic support band is visible on Working and export paths; sensitive packages can opt into RestrictToShares with API enforcement on list/get; Career/Rehearsal honesty and Rehearsal Ready suppression shipped.

**What is not.** No architect outside the repository has completed Gate 1 with a bound snapshot. Hub/search can still show restricted package titles via the draft list path. Wave 22 is not on `master`. Full CI matrix is unmeasured-green on trunk.

---

## 2. Scorecard (wave 22 branch)

| # | Quality | Score | Weight | Weighted | Deficiency signal |
|---|---------|------:|-------:|---------:|------------------:|
| 1 | Decision-Changing Insight Density | 82 | 13 | 10.66 | **234** |
| 2 | Differentiability / Defensibility vs Frontier AI | 88 | 13 | 11.44 | 156 |
| 3 | Governed Review Integrity | 92 | 13 | 11.96 | **104** |
| 4 | Correctness & Evidence Integrity | 86 | 12 | 10.32 | **168** |
| 5 | AI / Agent Readiness | 81 | 10 | 8.10 | 190 |
| 6 | Time-to-Value | 82 | 10 | 8.20 | 180 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 86 | 8 | 6.88 | 112 |
| 9 | Runtime & First-Review Reliability | 77 | 7 | 5.39 | 161 |
| 10 | Adoption Friction | 88 | 5 | 4.40 | 60 |
| | **(A) Headline readiness** | | **100** | **83.91%** | |

Sum = 8391 → **83.91%**. Total deficiency signal = **1,381** (down from v11 **1,836**).

**Ranked by weighted deficiency:** Insight Density (234) · Proof-of-ROI (216) · AI/Agent (190) · Time-to-Value (180) · Correctness (168) · Runtime (161) · Differentiability (156) · Comprehension (112) · GRI (104) · Adoption (60).

### Delta vs v11 (81.64%)

| Quality | v11 | v12 | Δ | Driver |
|---------|----:|----:|--:|--------|
| Insight Density | 76 | 82 | +6 | 0 `No evidence`; citations on all recorded engines |
| GRI | 89 | 92 | +3 | Share ACL + band on wire; AS-094 leak prevents +1 more |
| Correctness | 82 | 86 | +4 | Evidence refs + bind/share IDOR tests |
| Comprehension | 82 | 86 | +4 | Band chip + share help |
| Differentiability | 87 | 88 | +1 | PCI P1 slice |
| AI Readiness | 78 | 81 | +3 | OpenAPI band field for agents |
| Time-to-Value | 81 | 82 | +1 | Share panel completes sensitive-package path |
| Adoption | 87 | 88 | +1 | Opt-in restrict reduces whole-workspace exposure |
| Proof-of-ROI | 76 | 76 | 0 | Still G4 0/3 |
| Runtime | 77 | 77 | 0 | `ci.yml` still stale |

**Reconciliation.** +2.27 points on `(A)` is almost entirely **mechanism closure** (wave 22 + QR leftovers on branch). The next +2–3 points require **validation** (Gate 1, one G-REAL-06 row), not another engine pack.

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 76/100** (+3 vs v11). Mechanism for estate overlay, band honesty, and share scope exists; still no external architect decision changed.

**Frontier-AI Survival Probability (12 months): 62–76%, moderate confidence.** Upward: band visible; share scope; clean citation table. Downward: zero live pilots; hub leak undermines share story in demo.

**30-Day Voluntary Usage Probability: 42–58%, low-moderate.** Attach + execute + band + restrict is a complete desk story; return usage still needs one real “did not know that” moment.

**Sponsor Purchase Probability: 30–45%, low confidence.** Unchanged — G4 HOLD dominates.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Notes |
|---|------|---------|-------|
| 1 | First review end-to-end | **UNKNOWN** | Run with bound snapshot on staging |
| 2 | No hallucinated citations | **PASS (mechanism)** | Emission gate + clean distribution |
| 3 | Sponsor summary coherent | **PASS (mechanism)** | Band stamp on exports |
| 4 | Export works | **PASS (mechanism)** | |
| 5 | Workspace stable | **PASS** | Typecheck green on recent PRs |
| 6 | Auth + tenant isolation | **PASS (mechanism)** | Share ACL adds in-tenant scope; AS-094 hub gap is IDOR-style leak, not cross-tenant |

**No numbered gate FAILs.** AS-094 is a **pre-merge security fix**, not a numbered gate, but it blocks honest RestrictToShares demos.

---

## 5. Top weaknesses (post wave 22)

1. **Zero real-mode proof** — G4 0/3; largest commercial uncertainty unchanged.
2. **Gate 1 UNKNOWN** — bind path exists; nobody ran `ship-gate-evidence` on staging with it.
3. **AS-094 hub/search leak** — API is correct; hub uses unfiltered draft list.
4. **Wave 22 not on trunk** — buyers and CI scorecards still read old mechanism.
5. **Full `ci.yml` matrix stale** — Runtime 77 capped until triaged.
6. **Live merge queue not applied** — draft JSON only.
7. **Wave 23 concurrent desk** — livelihood collision without presence (deferred by design).

**Removed from v11 top-10 (closed on branch):** AS-057 scorer dark; leftover 67-band `No evidence`; `#2689` citation pack (merged into branch corpus); PCI stubs; attach-without-merge; unlabeled Ready in Rehearsal.

---

## 6. Stop doing (v12)

- Another insight-density **engine** pack or DX-77.
- Re-running AS-001–AS-093 or QR-26–QR-34 bodies.
- Career/Rehearsal chrome before Gate 1.
- Treating branch distribution as trunk until wave 22 merges.
- Wave 23 concurrent desk before AS-094 closes.

---

## 7. Highest token-ROI next work

See [`../architecture/V12_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V12_QUALITY_ROI_COMPOSER_PROMPTS.md) and [`.cursor/prompts/v12-quality-roi-00-index.md`](../../.cursor/prompts/v12-quality-roi-00-index.md).

| Priority | Prompt | Why best ROI |
|----------|--------|--------------|
| 1 | **V12-01 / AS-094** | Small diff; closes share ACL story; security + GRI |
| 2 | **V12-02** | Merge/rebase wave 22 PR — unlocks trunk score without re-implementation |
| 3 | **V12-03 / QR-35** | Runtime 77; triage existing reds only |
| 4 | **Owner** | Gate 1 with bind; G-REAL-06 two-pack compare |
| 5 | **Wave 23** | Concurrent desk — high product value, **low** token ROI per point |

---

## 8. Most important truth

**The architecture-spine ontology gap is largely closed on branch — and the product still has no external proof row.**

The cheapest remaining engineering is **AS-094** (one hub/search filter path), then **merge wave 22**, then **stop coding and run Gate 1 with a bound snapshot**.
