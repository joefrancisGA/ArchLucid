> **Scope:** Contributor-reference — v13 strategic release and market readiness assessment (clean-slate weighted pass). Not a buyer assurance attestation, CPA opinion, or live cohort proof.

# ArchLucid Strategic Release and Market Readiness Assessment (v13)

**Pass date:** 2026-09-10, **19:00–19:20 UTC**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. Prior rolling pass archived at [`../archive/assessments/LATEST_GPT55-2026-09-09-v11-superseded.md`](../archive/assessments/LATEST_GPT55-2026-09-09-v11-superseded.md).

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Grok 4.6 as a Cursor cloud agent, code-grounded desk review; **no live Azure OpenAI call**; no subagents for scoring.

**Inspected HEAD:** `origin/master` **`9231d1990f`** (`fix(securenow): show nav icon on remediation patterns page header`, `#2834`).

**Source materials inspected this pass:** `docs/library/REPO_DIGEST.md` (skim), `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/trust-center.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md` (SOC table), `docs/library/ARCHITECTURE_COMPONENTS.md`, `docs/library/SYSTEM_MAP.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`, `docs/go-to-market/GTM_BACKLOG.md` (open G-REAL / M-07 / M-39 / M-94), `docs/go-to-market/CLAIM_READINESS_STATUS.md`, `docs/library/TECH_BACKLOG.md` (open-count header + TB-883), `docs/quality/insight-density-engine-distribution.md`, `docs/architecture/ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md`, `FindingsMergeAndGateStage.cs`, `FindingSemanticSupportBandEmissionApplicator.cs`, `share-visible-architecture-inventory.ts`, `ga-starter-compliance.rules.json` (`pci-007` / `pci-009`), `.github/rulesets/golden-cohort-gate-merge-queue.json`, `AUDIT_COVERAGE_MATRIX.md` share rows vs OpenAPI.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `git fetch origin master` + `git log -20` | HEAD **`9231d1990f`**. Wave 22 share ACL (`#2802`/`#2799`/`#2809`), V12 follow-up `#2803`, robustness waves 104–110, SecureNow SA-01–SA-08 `#2813` on trunk. |
| 2 | `insight-density-engine-distribution.md` | **28** emitting engines; **0** `No evidence`; **0** `Would demote at 65`. Four engines still record **1** `No anchor`. |
| 3 | `FindingsMergeAndGateStage` | Calls `FindingSemanticSupportBandEmissionApplicator.Apply`. Chip inventory + desk guards present. |
| 4 | Hub / search | `filterDraftRegistryEntriesByShareVisibility` wired in `use-architecture-draft-list.ts` and `use-global-search-results.ts` (AS-094). |
| 5 | PCI P1 | `pci-007` / `pci-009` present in `ga-starter-compliance.rules.json` and bundled PCI pack. |
| 6 | `CLAIM_READINESS_STATUS.md` | **G4 HOLD — 0 of 3**. G1/G2/G5/G6 PASS (mechanism). G3 PASS with residuals. |
| 7 | `npm run typecheck` on HEAD | **FAIL** — TS2300 duplicate imports in seven UI modules (Wave merge corruption). Open follow-up **#2830**. |
| 8 | `assert_openapi_mutations_in_audit_matrix.py` | **FAIL** — share routes documented as `{actorOid}` vs OpenAPI `{targetActorOid}` / collection PUT. Open follow-up **#2829**. |
| 9 | Merge-queue ruleset | `enforcement: evaluate` (not live). |
| 10 | `TECH_BACKLOG.md` header | **25** unique open TB rows (P0 0 · P1 2 · P2 15 · P3 8). **TB-883** still Hold after G-REAL-06. |

**Verified counts:** harness **43** engines; **28** emit on the recorded corpus; **72** golden cases; **0** G4 proof-packet rows; **0** observed staging Gate 1 run this pass; Operator UI typecheck **red** on HEAD.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows plus owner-decision items. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**). **G-REAL-05** / **G-ASSURANCE-02** omitted from `(A)` (they do not reduce the headline).

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Merge `#2830`** (duplicate-import typecheck) then confirm `npm run typecheck` on `master` | Gate 5 is **FAIL** on HEAD; this is the only numbered ship-gate failure | Partial — PR already opened | **Composer** |
| 2 | **Merge `#2829`** (audit-matrix share path templates) | Unblocks pre-corset OpenAPI-mutation guard; depends on nothing except merge | Yes — PR already opened | **Composer** |
| 3 | **Gate 1** — one observed end-to-end first review on staging with a **bound** snapshot (`archlucid pilot ship-gate-evidence --run-id <guid>`) | Only remaining **UNKNOWN** numbered ship gate after Gate 5 is restored | Partial | **Owner + Composer** (script exists) |
| 4 | **Enable GitHub merge queue** using `.github/rulesets/golden-cohort-gate-merge-queue.json` | YAML + draft JSON shipped; live ruleset still `evaluate` | Partial — JSON drafted | **N/A — owner apply** |
| 5 | **G-REAL-06** — three real-mode pilot runs, **two pack configurations on the same input** (CIS-Azure vs SOC 2) | Largest commercial uncertainty; pack-toggle artifact exists; live compare does not | Partial | **N/A — owner execute** |
| 6 | **G-REAL-07** — proof packets + run-log rows | Depends on #5 | Partial | **Composer** |
| 7 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #6 | Partial | **Composer** |
| 8 | **TB-883 monthly AOAI cap + tenant cohort** | Approved with budget **TBD**; Hold until after G-REAL-06 | Yes — plan is agent-draftable | **Composer** |
| 9 | **M-07** — polished operator screenshots | Unblocked only after Gate 5 green; prefer bound + ObservedFact + support-band chip | Partial | **Composer** |
| 10 | **M-16** — demo video | Depends on #9 | Partial | **Composer** |
| 11 | **G-COMMERCE-01 / M-94** — invoice/SOW commercial readiness | Independent of analysis | No | **N/A — human only** |

**Shipped this cycle — do not re-open:** Wave 22 architecture spine including **AS-094** hub/search share filter; AS-089/090/091 RestrictToShares + IDOR; semantic support band on the finding wire and Working desk; leftover 65/67-band `EvidenceRefs` on the recorded corpus; PCI P1 `pci-007`/`pci-009`; ObservedFact execute merge; pack-toggle quality artifact; HIPAA P1; ISO 27001 P1; V12 disposition 409 mapping.

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 83.44%**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

**Ship is blocked.** Gate 5 is **FAIL** on this HEAD (`npm run typecheck` TS2300). Weighted `(A)` is **not** a V1-ship clearance until typecheck is green.

**What is true.** Decisioning Suite=Core compiles. Diagrams compile into the graph. Bound inventory merges as ObservedFact on execute. Typed-engine findings are scored and demotable. Semantic support band is on the finding wire and Working desk. RestrictToShares is opt-in with API + hub + search enforcement. Real-mode judge / generator / prose-assumption run by default under spend caps. Pack-toggle is recorded. HIPAA P1 and ISO 27001 P1 and PCI P1 declaration keys can fire. Recorded density table shows **0** `No evidence` across 28 emitting engines.

**What is not.** Operator UI does not typecheck on `master`. Audit-matrix share rows drift from OpenAPI. No architect outside the repository has run a real-mode review with a bound snapshot. G4 is **0 of 3**. Full `ci.yml` matrix remains unmeasured-green. Live merge queue is not applied. **TB-883** remains budget-blocked.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 82 | 13 | 10.66 | **234** |
| 2 | Differentiability / Defensibility vs Frontier AI | 88 | 13 | 11.44 | 156 |
| 3 | Governed Review Integrity | 92 | 13 | 11.96 | 104 |
| 4 | Correctness & Evidence Integrity | 85 | 12 | 10.20 | **180** |
| 5 | AI / Agent Readiness | 81 | 10 | 8.10 | 190 |
| 6 | Time-to-Value | 82 | 10 | 8.20 | 180 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | **216** |
| 8 | Sponsor / Operator Comprehension | 86 | 8 | 6.88 | 112 |
| 9 | Runtime & First-Review Reliability | 68 | 7 | 4.76 | **224** |
| 10 | Adoption Friction | 88 | 5 | 4.40 | 60 |
| | **(A) Headline readiness** | | **100** | **83.44%** | |

Sum(score × weight) = 1066 + 1144 + 1196 + 1020 + 810 + 820 + 684 + 688 + 476 + 440 = **8344** → **(A) = 83.44%**.

**Ranked by weighted deficiency:** Insight Density (234) · Runtime (224) · Proof-of-ROI (216) · AI/Agent Readiness (190) · Correctness (180) · Time-to-Value (180) · Differentiability (156) · Comprehension (112) · Governed Review Integrity (104) · Adoption Friction (60).

**Total remaining deficiency signal: 1,656.**

**Scoring rationale.**

| Quality | Score | Why exactly this much |
|---|---:|---|
| Decision-Changing Insight Density | **82** | Recorded corpus: 28 engines, 0 `No evidence`, 0 demote-at-65. ObservedFact overlay, path engines, diagram omission at 92. Not higher: **zero real-mode runs**; four leftover `No anchor` cells; frontier delta still synthetic. |
| Differentiability / Defensibility | **88** | Pack-toggle artifact + HIPAA/ISO/PCI P1 exact-id slices + RestrictToShares. Not higher: live two-pack compare unrun; PCI still a starter slice, not a full DSS program. |
| Governed Review Integrity | **92** | Policy → evidence → finding → decision → audit plus share ACL on list/get/hub/search. Holding: audit-matrix path templates stale vs OpenAPI; G4 0/3; live merge queue not applied. |
| Correctness & Evidence Integrity | **85** | Emission gate + DX-70 + product-shaped citations on recorded engines. Not 88: HEAD typecheck FAIL; audit-matrix share drift; leftover `No anchor`. |
| AI / Agent Readiness | **81** | Real-mode defaults include prose-assumption extraction; support band on the wire. Not higher: TB-883 budget-blocked; eval corpus still synthetic. |
| Time-to-Value | **82** | Declaration-only path findings, mermaid/vsdx ingest, Azure-soft ZIP prompt, Working attach, execute merge, estate-gap honesty, share panel. **Gate 1 UNKNOWN.** |
| Proof-of-ROI Readiness | **76** | Mechanism complete (disposition-aware sponsor summary, Simulator-forbid, pack-toggle). **0 of 3** G4 rows. Unchanged by engineering this cycle. |
| Sponsor / Operator Comprehension | **86** | Support-band chip + share help + estate-gap and freshness honesty. Narrative still rests on synthetic output. |
| Runtime & First-Review Reliability | **68** | **Typecheck FAIL on HEAD** (Gate 5). Audit-matrix guard FAIL. Full `ci.yml` matrix stale; live merge queue absent; Gate 1 unobserved. |
| Adoption Friction | **88** | Soft Azure ZIP prompt + desk attach + opt-in RestrictToShares. Extractor hosted-pull still not a hard first-review default. |

---

## 3. Diagnostic Scores (non-headline — must be reconciled with §2)

These do **not** feed `(A)`.

**Decision Advantage Score: 76/100.** Mechanism for estate overlay, band honesty, and share scope exists on trunk. None of it has changed a decision a real architect made on their estate.

**Frontier-AI Survival Probability (12 months): 60–74%, moderate confidence.** Reference class: governed-workflow tools whose analysis layer is model-agnostic. Upward: diagrams, bound IaC, live estate, and policy packs share evidence ids the model does not author. Downward: still no live bake-off; HEAD currently fails typecheck; zero G4 rows.

**30-Day Voluntary Usage Probability: 38–54%, low-moderate confidence.** A principal architect can attach inventory, see execute change, and see a support band. They will not return until a first review shows them something they did not know **on their estate**, and they cannot even complete a clean demo path while typecheck is red.

**Sponsor Purchase Probability: 28–44%, low confidence.** **Zero G-REAL-06 pilots still dominates.** Typecheck FAIL is a demo-risk overlay, not the commercial bottleneck.

**Reconciliation with §2.** Headline **83.44%** sits ~7 points above Decision Advantage (76). Read `(A)` as “mechanism is mostly closed; remaining cheap engineering is merge hygiene, then **stop and run one real review**.” The Gate 5 FAIL is why this number must not be treated as ship-cleared.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed this pass. Bind now changes execute — include a snapshot. | Staging `ship-gate-evidence` (human task #3). |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + recorded 0 `No evidence`. Leftover `No anchor` is honesty, not a hallucination hole. | Upgrade after Gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline; Simulator-forbid. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** | `npm run typecheck` on HEAD `9231d1990f` reports TS2300 duplicate imports in seven modules. | Merge **#2830**; re-run typecheck. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037 unchanged. Share ACL + AS-091 IDOR tests on trunk. Hub/search filter shipped (AS-094). | As Gate 1. |

**Numbered gate FAIL: Gate 5.** `(A)` is computed above; **V1 ship is blocked** until typecheck is green.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 83.44%. Gate 5 FAIL; Gate 1 UNKNOWN.**

ArchLucid is a governed architecture-review system: a **43**-engine golden harness with **28** engines emitting on the recorded corpus, tenant-filtered compliance packs spanning CIS (Azure/AWS/GCP), SOC 2, GDPR, HIPAA (P1), ISO 27001 (P1), PCI (P1 encryption/transit keys), and ZTA, sealed manifests, database-per-tenant isolation, and first-party Jira / ServiceNow / Confluence / Slack / Teams connectors. Diagrams compile (mermaid + vsdx). Inventory snapshots can be attached **and merged on execute** as ObservedFact. Typed-engine findings are scored and demotable. Semantic support is visible on Working decision-grade surfaces. Sensitive packages can opt into RestrictToShares with list, get, hub, and search enforcement. In Real mode the LLM judge, insight generator, and prose-assumption extractor run by default under spend caps.

**What this pass did not buy.** The operator UI currently **does not typecheck** on `master`. No architect outside the repository has completed a bound first review. G4 remains empty. Full CI matrix is unmeasured.

**(B) Procurement / market realism (weight 0 in `(A)`).** Honest trust posture: self-assessment, templates, owner-conducted pen-style testing; **no CPA SOC 2** and **no published third-party pen test**. Sales-led motion; live commerce is V1.1 owner-only.

**Commercial picture.** Compelling as a demo of governed, policy-driven, evidence-linked findings **including live estate when bound** — after typecheck is restored. Unproven as a decision-changer because no G4 row exists.

**Enterprise picture.** Trust mechanisms ahead of proof. Hesitation will be “show me one real run,” plus “does the workspace even build today?”

**Engineering picture.** Product invariants are robust. Process currently evaluates PR-branch SHAs. HEAD has merge-corruption typecheck debt and an audit-matrix template mismatch.

**Frontier-AI picture.** Becoming more valuable **in mechanism** as diagrams, IaC, bound inventory, and customer packs share evidence ids the model does not author — **if** one real run ever shows it, and **if** the workspace compiles.

---

## 6. Deferred Scope Uncertainty

V1.1: CloudEvents webhooks, MCP membrane, multi-region, commerce un-hold. V2: CPA SOC 2 / third-party pen-test *publication*, automated tenant-erasure, Redis-as-default, DTF / Container Apps Jobs. Graph-RAG community summarization remains behind `EnableCommunitySummarization=false`; **TB-883** ablation is owner-approved and budget-blocked. None of these reduce `(A)`.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Decision-Changing Insight Density — 82 · weight 13 · contribution 10.66 · deficiency 234

**Outcomes:** 1 (insight), 4 (differentiation), 5 (survivability).

**What is true.** ADR 0070 scores typed engines. 43 harness engines; 28 emit on the recorded corpus. Path engines fire on Azure/AWS/GCP IaC. Diagram-declaration-omission emits at 92. Bound inventory is a graph overlay merged on execute. Recorded table: **0** `No evidence`, **0** `Would demote at 65`.

**What is not.** Proof on a customer estate. Four engines still record a `No anchor` cell. `WouldDemoteAt65Count = 0` on goldens is a corpus property, not a live-estate property.

**Tradeoffs.** More engines without Gate 1 inflates the table without changing a decision.

**Recommendations.** Do not add engines. Run Gate 1 with bind. Classification: **validation first**.

### 7.2 Runtime & First-Review Reliability — 68 · weight 7 · contribution 4.76 · deficiency 224

**Outcomes:** 3 (30-day usage), ship gate 5.

**What is true.** Core unit corset has been green on recent V12 follow-up work (1415 tests). Robustness waves 104–110 continue sealed-manifest guards.

**What is not.** HEAD typecheck FAIL. Audit-matrix guard FAIL. Full `ci.yml` last measured-green window is stale. Merge queue `evaluate`. Gate 1 unobserved.

**Tradeoffs.** Shipping more Wave robustness while typecheck is red is process theater.

**Recommendations.** Merge **#2830** then **#2829**. Classification: **V1**.

### 7.3 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

**Outcomes:** 4 (sponsor purchase).

**What is true.** `GET /v1/roi/sponsor-summary` is disposition-aware; Simulator-derived dollars are forbidden on sponsor surfaces; pack-toggle quality artifact exists.

**What is not.** G4 **0 of 3**. No two-pack live compare. TB-603 AWS/GCP structured retail-price grounding remains the residual cost-honesty gap (illustrative framing, not a missing ROI endpoint).

**Recommendations.** G-REAL-06 then G-REAL-07. Classification: **validation first / blocked on user input**.

### 7.4 AI / Agent Readiness — 81 · weight 10 · contribution 8.10 · deficiency 190

**Outcomes:** 1, 5.

**What is true.** Platform-provisioned Azure OpenAI on hosted SaaS; simulator for CI; Application-layer orchestration; Graph-RAG bounded multi-hop (TB-597); single-pass query expansion (TB-598). Support band on the wire.

**What is not.** TB-883 ablation Hold. No live-model bake-off. Support-band LLM judge remains default-off (AS-074).

**Recommendations.** Do not turn the judge on before Gate 1. Classification: **V1 Hold (TB-883)**.

### 7.5 Correctness & Evidence Integrity — 85 · weight 12 · contribution 10.20 · deficiency 180

**Outcomes:** 1, 2 (governed repeatability).

**What is true.** Citation contract, emission gate, product-shaped ARM/ARN fallbacks on leftover engines, bind IDOR tests.

**What is not.** Duplicate UI imports on HEAD. Audit matrix documents the wrong share templates.

**Recommendations.** Merge hygiene PRs. Classification: **V1**.

### 7.6 Time-to-Value — 82 · weight 10 · contribution 8.20 · deficiency 180

**Outcomes:** 3.

**What is true.** Guided intake, ZIP-first extractor, attach + execute merge, Career/Rehearsal doors, share panel.

**What is not.** Gate 1 UNKNOWN. Typecheck FAIL delays any first-review demo.

**Recommendations.** Restore typecheck, then one bound staging run. Classification: **V1 + validation**.

### 7.7 Differentiability / Defensibility vs Frontier AI — 88 · weight 13 · contribution 11.44 · deficiency 156

**Rubric: High, approaching Excellent on mechanism.** Changing packs changes findings in the recorded pack-toggle artifact. Live customer-pack A/B is unrun.

**Recommendations.** G-REAL-06 two-pack compare. Classification: **validation first**.

### 7.8 Sponsor / Operator Comprehension — 86 · weight 8 · contribution 6.88 · deficiency 112

**What is true.** Support-band chip, estate-gap honesty, freshness warn, share help.

**What is not.** Screenshots (M-07) and demo video (M-16) not started. Buyer still needs a human to explain synthetic vs real.

**Classification:** **validation / owner output** (do not re-open TB-141/142 as engineering).

### 7.9 Governed Review Integrity — 92 · weight 13 · contribution 11.96 · deficiency 104

**What is true.** Packs are first-class; pre-commit gate; approval workflow; audit catalog; share ACL.

**What is not.** Audit-matrix template drift; G4 empty; merge queue not live.

**Classification:** **V1 hygiene + validation**.

### 7.10 Adoption Friction — 88 · weight 5 · contribution 4.40 · deficiency 60

**What is true.** Hosted SaaS LLM is platform-provisioned. ZIP-first cloud ingest. ITSM native-create still defaults false (TB-599) — disclose, do not treat as missing V1 connector.

**Classification:** **V1 residual, not a blocker**.

---

## 8. Top 10 Weaknesses (ranked, most serious first)

| # | Weakness | Why it matters | Design vs market | V1 blocker? | Fastest path |
|---|----------|----------------|------------------|-------------|--------------|
| 1 | Operator UI typecheck FAIL on HEAD | Demo path cannot be claimed working | Design (merge hygiene) | **Yes — Gate 5** | Merge #2830 |
| 2 | Zero real-mode bound first reviews (Gate 1 UNKNOWN) | All density/ROI claims are synthetic | Market | Ship-gate UNKNOWN | Staging `ship-gate-evidence` |
| 3 | G4 0/3 proof packets | Sponsor purchase stays a story | Market | Stage 1 GTM, not `(A)` engineering | G-REAL-06/07 |
| 4 | Audit-matrix share path drift | Pre-corset guard fails; mutating routes look unaudited | Design | Process, not numbered gate | Merge #2829 |
| 5 | Full `ci.yml` matrix unmeasured-green | Runtime confidence is PR-lane, not trunk-matrix | Design/process | No | Owner dispatch |
| 6 | Live merge queue not applied | SHA evaluation still PR-branch | Process | No | Owner apply ruleset |
| 7 | Leftover `No anchor` cells | Four engines still fail the stricter density predicate | Design (small) | No | After Gate 1, only if live runs show it |
| 8 | TB-883 Graph-RAG ablation unfunded | RAG-V2 depth caveat stays unmeasured | Design blocked on budget | No | After G-REAL-06 |
| 9 | ITSM native-create default false | Outbound path is extra config | Design (honest default) | No | Disclose; TB-599 |
| 10 | AWS/GCP cost retail-price grounding (TB-603) | Cost findings can still read illustrative | Design residual | No | After a real multi-cloud cost review |

---

## 9. Frontier-AI Analysis

**Commodity vs Durable**

| Capability | 12-month fate | Why |
|------------|---------------|-----|
| Generic architecture critique | Commodity | Frontier models already do this from a good prompt |
| Policy-pack-driven findings | Durable | Requires customer pack state + exact-id gating |
| Evidence → finding → disposition → audit | Durable | Workflow + append-only catalog, not eloquence |
| Bound inventory ObservedFact overlay | More valuable as models improve | Better models on *the same* estate ids |
| Semantic support band | Durable-if-honest | Stops false confidence; models will still overclaim without it |
| RestrictToShares | Durable | Org ACL is not a prompt |
| Sponsor ROI dollars | Durable only with Real-mode evidence | Simulator-forbid is the honesty seam |

**Hard-to-reproduce-via-prompting:** tenant isolation, sealed manifests, pack-toggle recorded deltas, share ACL, required audit events, disposition CAS/409.

**Leverage / upside:** better base models improve findings, policy mappings, and critic quality at ~zero ArchLucid engine cost **if** packs, evidence, and audit stay the product.

**Displacement timeline:** one model release can commoditize *unbound* prose review. It cannot commoditize pack state + sealed evidence + org workflow in one release.

**Verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable **only on the governed-package bet**, and only after Gate 5 is restored and one real bound run exists. Survival probability is in §3 — do not retell the number here.

---

## 10. Policy-Aware Governance Test

1. Packs are first-class objects; pack-toggle artifact shows content changes findings. Live customer A/B is unrun.
2. Major typed findings can trace input → evidence → policy/standard → recommendation → disposition → audit. Support band is now on that chain.
3. A skilled architect with frontier AI can reproduce a *critique*, not the *same governed package* consistently across two architects and two pack configurations.
4. AI-generated analysis is the engine; packs, evidence graph, commit, and audit are the product.
5. Proof of moat: two pack configurations on one real input, different findings, same evidence ids, sponsor report labels the mode.
6. Fastest validation: G-REAL-06 CIS-Azure vs SOC 2 on one bound estate.
7. Demo that makes the moat obvious: attach inventory → execute → show ObservedFact finding → flip pack → show delta → show audit + support band.

---

## 11. Principal Architect Dismissal Test

They say **“I did not think of that”** when a bound snapshot contradicts the brief (ObservedFact / inventory reconciliation / path engines) with a citation they can open.

They return if recurrence, dispositions, and ITSM correlation save them from re-prompting every week.

Immediate dismissal: broken typecheck, “review package” jargon, Simulator ROI dollars, RestrictToShares that still leaks titles (AS-094 is closed — do not re-open), or a demo that cannot finish create → commit.

**Would they believe ArchLucid is materially better than “Claude + a good prompt + my company standards pasted in”?** Mechanism: **yes, if** packs are theirs and evidence is theirs. Today: **not yet**, because they have not seen it on their estate, and the workspace currently fails typecheck.

**Most likely dismissal trigger today:** “I cannot even get a clean first-review demo — the UI does not typecheck” (**high** while Gate 5 is FAIL), then “this is synthetic goldens, not my estate” (**high** until Gate 1).

---

## 12. Founder Delusion Check

**Weakest evidence / strongest assumption:** “28 engines at 100 median on goldens means decision-changing insight.” Goldens are not customers.

**Looks differentiated, actually commodity:** fluent finding prose.

**Looks ordinary, may be the moat:** RestrictToShares + sealed manifest + required audit + pack-toggle.

**Burn months without moving the five outcomes:** more robustness waves, more SecureNow SA prompts, more engine packs.

**If features froze six months:** restore typecheck, run Gate 1, run G-REAL-06.

**Most dangerous attractive distraction:** another Wave N robustness batch while Gate 5 is red.

**Most boring real moat:** append-only audit + pack-aware findings + share ACL that actually hides titles.

---

## 13. Competitive Reality Check & Moat Assessment

Vs a skilled architect using frontier AI: they already critique diagrams and paste CIS controls. ArchLucid is substantially faster at *repeatable, pack-aware, evidence-linked, auditable* packages **once** identity, ingest, and execute work. That resists prompting. Critique quality is commodity within 12 months. Packs + evidence + workflow get more valuable as models improve.

**Current moat:** governed package machinery (packs, evidence graph, commit, audit, share). **Potential future moat:** customer pack libraries + estate overlays. **Weakest moat assumption:** that goldens imply live insight. **Durable assumption:** customer-specific packs + sealed evidence. **Illusory moat:** engine count. **Boring-but-durable:** database-per-tenant + required audit. **What would make it obvious:** two-pack live compare on one bound estate, exported, with mode labels.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive: attach → execute → “the graph changed.” Strongest negative: typecheck FAIL + no estate “I did not know that.” Return reason: recurrence + dispositions. Stop reason: first review feels like a chatbot with extra login.

**Sponsor Purchase.** Driver: disposition-aware ROI + sealed package. Blocker: G4 empty. Minimum proof for a paid pilot: **one** Real-mode bound run with pack-toggle delta and a packet. Objection: “no SOC 2 report” — `(B)` only. **Why buy instead of more frontier-AI licenses?** Governance, packs, evidence, audit, repeatability, sponsor reporting — not better prose.

**Top 6 monetization blockers:** (1) no G4 row (2) Gate 1 unobserved (3) typecheck FAIL (4) invoice/SOW readiness G-COMMERCE-01 (5) CPA SOC 2 expectation — `(B)` (6) no design partner — `(B)` / V1.1. Do not treat absent live Stripe as a V1 blocker.

**Top 6 enterprise adoption blockers:** (1) identity/Entra setup (2) ZIP-first vs hosted-pull confusion (3) ITSM native default false (4) RestrictToShares opt-in discovery (5) Simulator vs Real labeling (6) procurement SOC/pen-test — `(B)`.

---

## 15. Most Important Truth

**The product’s remaining cheap work is merge hygiene; the expensive remaining work is one real bound review — and today the workspace does not even typecheck.**

Mechanism for insight, packs, shares, and support-band honesty is on trunk. `(A)` at 83.44% describes that mechanism. It is not permission to ship, sell Stage 1, or commission another engine pack.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** more robustness waves; more SecureNow SA prompt packs; Graph-RAG community summarization default-on.

**Diminishing returns:** golden-corpus engine count; sealed-manifest guard duplication; OpenAPI snapshot churn without product change.

**Founder behaviors that delay validation:** merging Wave PRs while typecheck is red; treating `(A)` as a ship gate; asking for another assessment instead of Gate 1.

**Enterprise-important, may not improve V1 adoption:** CPA SOC 2 kickoff (G-REAL-05 — `(B)`); third-party pen-test publication; MCP membrane.

---

## 17. Top Improvement Opportunities

Verify-before-listing applied. Shipped work is not re-listed. GTM **M-90/M-44/M-91/M-92** excluded. TB-135/TB-136 not reopened.

Because Gate 5 **FAIL**s, this section **leads with engineering that restores the ship gate**, then validation.

### Tier 1 – Must Fix

**1. Restore Operator UI typecheck (merge #2830)**  
**Tier:** 1 · **Why:** Gate 5 FAIL. **Impact:** Unblocks demo and Gate 1. **Qualities:** Runtime, Time-to-Value, Adoption. **Evidence:** local `npm run typecheck` TS2300 on HEAD. **Actionability:** high — PR open. **Design 9 / Market 1.** **Classification:** V1.  
Do not re-author the import dedupe; merge the PR.

**2. Align audit-matrix share routes (merge #2829)**  
**Tier:** 1 · **Why:** Pre-corset OpenAPI mutation guard FAIL. **Impact:** Restores audit-documentation honesty for AS-094 paths. **Qualities:** GRI, Correctness. **Evidence:** `assert_openapi_mutations_in_audit_matrix.py` on HEAD. **Actionability:** high. **Design 8 / Market 0.** **Classification:** V1.

**3. Gate 1 — observed bound first review**  
**Tier:** 1 · **Why:** Only UNKNOWN numbered ship gate after typecheck. **Impact:** Converts mechanism into observed reliability. **Qualities:** Runtime, Time-to-Value, Insight Density. **Evidence:** no `ship-gate-evidence` run this pass. **Actionability:** owner + existing script. **Design 3 / Market 8.** **Classification:** validation first.

### Tier 2 – High Leverage

**4. G-REAL-06 two-pack real-mode pilots**  
**Tier:** 2 · **Why:** Packs-as-moat is unproven live. **Impact:** Sponsor purchase and defensibility. **Qualities:** Differentiability, Proof-of-ROI, Insight Density. **Market 10 / Design 2.** **Classification:** validation first / blocked on user input.

**5. Apply live merge-queue ruleset**  
**Tier:** 2 · **Why:** Process still evaluates PR SHAs. **Qualities:** Runtime. **Design 6 / Market 0.** **Classification:** V1 process.

**6. M-07 screenshots after Gate 5 green**  
**Tier:** 2 · **Why:** Owner-output GTM; do not score `(A)` down for absence, but it unblocks demos. **Classification:** V1.1 owner output (TB-142 home).

### Tier 3 – Hold For Reassessment

**7. TB-883 Graph-RAG ablation** — Hold until after G-REAL-06 and a budget number.  
**8. TB-603 AWS/GCP retail-price grounding** — Hold until a real multi-cloud cost review exists.  
**9. Further typed engines** — Do not add until a live run shows a missing theme.

Paste-ready quality-ROI pack (post-v13, one prompt per chat): [`../architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md) · index [`.cursor/prompts/v13-quality-roi-00-index.md`](../../.cursor/prompts/v13-quality-roi-00-index.md). Deltas in that pack are **expected scoring effects**, not a rescore of this pass. **#2829** is already on trunk — skip V13-02 if the audit-matrix assert is green. **#2830** remains the Gate 5 merge (V13-01).

---

## 18. Prompt Batching Guidance

**First batch (V13-01, V13-02):** land #2830 (typecheck); skip #2829 if `assert_openapi_mutations_in_audit_matrix.py` exits 0 — **safe-for-Composer**.  
**Second batch (V13-03):** four leftover No-anchor golden citations — **safe-for-Composer**; do not invent ARM/ARN.  
**Third batch (V13-04):** `ci.yml` matrix triage on a SHA that already has 01+02 — **safe-for-Composer**; do not disable checks.  
**Owner (V13-05):** Gate 1 `archlucid pilot ship-gate-evidence --run-id <guid>` — Composer verifies the CLI; owner runs the tenant.  
Do not commission Wave 111+ or SecureNow SA packs as quality-ROI. Full paste files: [`../architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md).

---

## 19. Model Usage Guidance

**Composer-safe:** import dedupe, audit-matrix path strings, snapshot refresh, screenshot capture scripts.  
**Strong-model-recommended:** this assessment class of work; policy-moat evaluation; evidence-graph semantics.  
Default remaining engineering on this workspace’s allowlist: **Composer 2.5 slow** (`composer-2.5`). Do not use fast-tier or non-allowlisted models without an `ok`/`yes` override.

---

## 20. Pending Questions For Later

**Blocks V1:** Gate 5 typecheck (open PRs). Gate 1 observed run.  
**Blocks V1.1:** live commerce un-hold; MCP; CloudEvents.  
**Requires customer validation:** G-REAL-06; two-pack compare; 30-day usage.  
**Requires founder decision:** merge-queue apply; TB-883 budget; G-COMMERCE-01.

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The codebase shows serious principal-architect judgment: sealed manifests, pack exact-id gating, ObservedFact overlay, support-band honesty, and in-tenant share ACL are tasteful enterprise seams, not chatbot chrome. The same author signal is currently undermined by shipping overlapping Wave merges that leave duplicate imports on `master`. That is process taste, not product taste — and it is what a skeptical principal architect will trip on first.

---

# Central question

> Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?

**On mechanism: yes, it is built to.** Packs, evidence, commit, audit, shares, and support-band honesty are on trunk. **On observed decisions and repeat use: not yet.** Gate 5 is FAIL, Gate 1 is UNKNOWN, and G4 is empty. Restore the workspace, run one bound Real-mode review, then stop coding until that review changes a decision.
