# ArchLucid Strategic Release and Market Readiness Assessment (v11)

**Pass date:** 2026-09-09, **22:40–23:10 UTC (v11)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v10 pass is superseded by this document and is **not** canonical. v10 is archived at [`../archive/assessments/LATEST_GPT55-2026-09-09-v10-superseded.md`](../archive/assessments/LATEST_GPT55-2026-09-09-v10-superseded.md).

## v11 pass note — ObservedFact merge is on trunk; OpenAPI fail-fast is green; 65-band citations live on `#2689`

This pass was requested as a **fresh** quality assessment after the v10 Composer pack was implemented. Scoring inspects:

- **`origin/master` HEAD `420205b38d`** (**AS-057** heuristic quote-overlap scorer, `#2687`).
- **Open PR `#2689`** (`cursor/qr-16-25-quality-roi-impl-97a4`) — QR-16–QR-25 leftovers that v10 still listed as open: ObservedFact leftover diagram rebind, ISO 27001 P1, snapshot freshness, bind IDOR/audit, product-shaped ARM/ARN on golden graphs, distribution re-record.

**Do not re-commission QR-16–QR-25.** Credit `#2689` in this scorecard so the next pack does not redo it. State **trunk vs PR** whenever a claim is merge-sensitive.

What is true on **trunk** (not in v10's HEAD `35f4898028`): **AS-050** merges a bound inventory snapshot as `ObservedFact` on execute (`#2672`). **AS-051** labels unbound architectures as an estate gap (`#2675`). **AS-056** ADR 0085 (semantic support is a Working band, not a commit gate). **AS-057** ships a heuristic quote-overlap scorer in Decisioning — **library only**; it is **not** on the finding wire or Working desk. Wave 78 robustness (`#2678`).

What `#2689` adds (implemented, **not merged** at inspection): leftover `diagram-node:*` rebind onto overlay ObservedFact; `ga-starter` ISO 27001 P1 exact-id slice; 7-day stale warn; bind/unbind `ExecuteAuthority` + foreign snapshot `SnapshotNotFound` + Required audit; product-shaped ARM/ARN/`resourceId` on golden graphs; recorded distribution with **65-band `No evidence` closed** for `security-baseline` / `identity-blast-radius` / `segmentation-semantics` / `data-flow-trust-boundary`.

**OpenAPI v1 fail-fast is green** on the newest inspected API-adjacent PRs (AS-057 run jobs; `#2689` fail-fast **success**). v10's "restore the snapshot first" lever is **closed as process**. Full `ci.yml` matrix is still last dispatched **2026-08-28** (failure). Live merge queue still `evaluate`. Gate 1 **UNKNOWN**. **G4 HOLD — 0 of 3**.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Grok 4.6 as a Cursor cloud agent, code-grounded desk review; **no live Azure OpenAI call was made during this pass**; no subagents were used for the assessment itself.

**Source materials inspected this pass:** `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/trust-center.md` (boundary), `docs/go-to-market/GTM_BACKLOG.md`, `docs/go-to-market/CLAIM_READINESS_STATUS.md`, `docs/library/TECH_BACKLOG.md` (open-count header + TB-883), `.cursor/rules/Assessment-Scope-V1_1.mdc`, `docs/quality/insight-density-engine-distribution.md` (trunk **and** `#2689`), `docs/quality/pp01-ga-starter-catalog-extension-scoping.md`, `docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`, `docs/architecture/ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md` (AS-054 / AS-058–AS-061 leftovers), `FindingSemanticSupportBandScorer.cs`, `FindingGraphEvidenceRefs.cs`, `DrRpoTopologyFindingEngine.cs`, `RequirementSkuTierFindingEngine.cs`, `DanglingDeclarationReferenceFindingEngine.cs`, `ga-starter-compliance.rules.json` (PCI stubs vs ISO P1), `.github/rulesets/golden-cohort-gate-merge-queue.json`, `gh run list` / `gh run view` on `ui-typecheck-on-push.yml` and `ci.yml`, `git log origin/master`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `git fetch origin master` + `git log origin/master -8 --oneline` | HEAD **`420205b38d`** AS-057 `#2687`. AS-050 `#2672`, AS-051 `#2675`, AS-056 `#2686`, v10 docs `#2684` on trunk. |
| 2 | `gh pr view 2689` | **OPEN**, MERGEABLE, 4 commits. QR-16 skipped (OpenAPI already listed inventory-binding). QR-21 skipped (AS-051 on master). |
| 3 | Distribution on **`origin/master`** | **26** engines. `security-baseline` 10/10 no evidence at **65**. Path engines at 72 almost entirely `No evidence`. |
| 4 | Distribution on **`#2689`** | **27** engines. 65-band no-evidence **0** for security-baseline / identity-blast / segmentation / data-flow. Leftover `No evidence`: `dangling-declaration-reference` (1), `dr-rpo-topology` (2), `requirement-sku-tier` (1), `declaration-premise-conflict` (1). `WouldDemoteAt65Count = 0`. |
| 5 | OpenAPI fail-fast | **Success** on AS-057 PR jobs and on `#2689`. Oldest cited red (AS-048 `34407627784`) is **superseded**. |
| 6 | `gh run list --workflow ci.yml --branch master --limit 8` | Still **failure/cancelled**; last full `workflow_dispatch` **2026-08-28** `33193938737`. |
| 7 | UI typecheck on master HEAD | **Success** `34410769119` (AS-057). |
| 8 | `CLAIM_READINESS_STATUS.md` | **G4 HOLD — 0 of 3**. G1/G2/G5/G6 PASS (mechanism). |
| 9 | `FindingSemanticSupportBandScorer` | Exists on master. **No** callers on finding DTO, OpenAPI, or Working desk. |
| 10 | `.github/rulesets/golden-cohort-gate-merge-queue.json` | Draft only (`enforcement: evaluate`). |
| 11 | `TECH_BACKLOG.md` header | **25** unique open TB rows (P0 0 · P1 2 · P2 15 · P3 8). **TB-883** still budget-blocked. |
| 12 | `DeclarationSignalPolicyKeyMap.IsThemeEnabled` | Still **exact-id**. PCI mapped keys `pci-007` / `pci-009` remain **catalog stubs**. |

**Verified counts this pass:** harness **43** engines; **26** emit on trunk corpus / **27** on `#2689`; **72** golden cases; **0** real-mode pilot runs; **0** live merge-queue rule; OpenAPI fail-fast **green** on newest inspected API PRs.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows plus owner-decision items. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**). **G-REAL-05** / **G-ASSURANCE-02** omitted from `(A)` (they do not reduce the headline).

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Merge `#2689`** (rebase onto `420205b38d` if GitHub asks) | Density table and ISO P1 are on the PR, not trunk. Next Composer pack assumes this land. | Partial — rebase/conflict | **Composer** |
| 2 | **Enable GitHub merge queue** on `master` using `.github/rulesets/golden-cohort-gate-merge-queue.json` | YAML + draft JSON shipped. Live ruleset still evaluates PR-branch SHAs. | Partial — JSON already drafted | **N/A — owner apply** |
| 3 | **Gate 1** — one observed end-to-end first review on staging (`archlucid pilot ship-gate-evidence --run-id <guid>`) | Only **UNKNOWN** numbered ship gate. Bound snapshot can now change execute — run it **with** a bind. | Partial | **Owner + Composer** (script already exists) |
| 4 | **G-REAL-06** — three real-mode pilot runs, **two pack configurations on the same input** (CIS-Azure vs SOC 2) | Largest commercial uncertainty. Pack-toggle artifact exists; live compare does not. | Partial | **N/A — owner execute** |
| 5 | **G-REAL-07** — proof packets + run-log rows | Depends on #4. | Partial | **Composer** |
| 6 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #5. | Partial | **Composer** |
| 7 | **TB-883 monthly AOAI cap + tenant cohort** | Approved with budget **TBD**. | Yes — plan is agent-draftable | **Composer** |
| 8 | **M-07** — polished operator screenshots | Unblocked on UI typecheck. Prefer a bound + ObservedFact screenshot. | Partial | **Composer** |
| 9 | **M-16** — demo video (run **G-REAL-09** first) | Depends on #8. | Partial | **Composer** |
| 10 | **G-COMMERCE-01 / M-94** — invoice/SOW commercial readiness | Independent of analysis. | No | N/A — human only |

**Shipped this cycle — do not re-open:** QR-01–QR-15; AS-042; AS-046–AS-051; AS-056–AS-057; AS-019 / AS-035 / AS-045; DX-51–DX-76; ADR 0070; PP-01 Option B + HIPAA P1; Azure extractor **soft** first-review prompt; pack-toggle quality artifact. **On `#2689` (do not re-author):** QR-17 leftover rebind, QR-20 ISO P1, QR-22 freshness, QR-23 IDOR/audit, QR-18/19/25 ARM goldens, QR-24 distribution.

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 81.64%**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

**The headline is not ship-blocked by a numbered gate.** Gate 5 remains **PASS** (UI typecheck green on HEAD `34410769119`). OpenAPI fail-fast is **green** on the newest inspected API PRs.

**What is true.** Decisioning Suite=Core compiles. Diagrams compile into the graph. Inventory can be **attached** and, on execute, **merged as ObservedFact**. Typed-engine findings are scored and demotable. Real-mode judge / generator / prose-assumption run by default under spend caps. Pack-toggle is recorded. HIPAA P1 and (on `#2689`) ISO 27001 P1 declaration keys can fire. 65-band goldens on `#2689` carry ARM/ARN the density gate already knows how to accept.

**What is not.** No architect outside the repository has run a real-mode review. `#2689` is not on trunk. Four leftover engines still record `No evidence` at 67–82. The AS-057 scorer does not appear on the finding wire. Full `ci.yml` matrix still unmeasured-green. PCI mapped encryption/transit ids are still catalog stubs.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 76 | 13 | 9.36 | **312** |
| 2 | Differentiability / Defensibility vs Frontier AI | 87 | 13 | 11.31 | 169 |
| 3 | Governed Review Integrity | 89 | 13 | 11.57 | 143 |
| 4 | Correctness & Evidence Integrity | 82 | 12 | 9.84 | **216** |
| 5 | AI / Agent Readiness | 78 | 10 | 7.80 | 220 |
| 6 | Time-to-Value | 81 | 10 | 8.10 | 190 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 82 | 8 | 6.56 | 144 |
| 9 | Runtime & First-Review Reliability | 77 | 7 | 5.39 | 161 |
| 10 | Adoption Friction | 87 | 5 | 4.35 | 65 |
| | **(A) Headline readiness** | | **100** | **81.64%** | |

Sum(score × weight) = 988 + 1131 + 1157 + 984 + 780 + 810 + 684 + 656 + 539 + 435 = **8164** → **(A) = 81.64%**.

**Ranked by weighted deficiency:** Insight Density (312) · AI/Agent Readiness (220) · Correctness (216) · Proof-of-ROI (216) · Time-to-Value (190) · Differentiability (169) · Runtime (161) · Comprehension (144) · Governed Review Integrity (143) · Adoption Friction (65).

**Total remaining deficiency signal: 1,836.**

**Scoring rationale.**

| Quality | Score | Why exactly this much |
|---|---:|---|
| Decision-Changing Insight Density | **76** | New information source on trunk: bound snapshots merge as ObservedFact. `#2689` closes 65-band `No evidence` for the engines that used to sit at the demotion threshold. Not higher: **zero real-mode runs**; leftover 67-band engines still uncited; `WouldDemoteAt65Count = 0`; frontier delta still synthetic. |
| Differentiability / Defensibility | **87** | Pack-toggle artifact + HIPAA P1 + ISO P1 (on `#2689`). Exact-id gating is real. Not higher: PCI `pci-007`/`pci-009` still stubs; live two-pack compare unrun. |
| Governed Review Integrity | **89** | Policy → evidence → finding → decision → audit rubric plus bind Required audit/IDOR on `#2689`. Holding: support band not on the wire; live merge queue not applied; G4 0/3. |
| Correctness & Evidence Integrity | **82** | Orchestrator / Kind B closed. OpenAPI fail-fast green. 65-band refs on `#2689` pass `HasConcreteEvidenceCitation`. Not 86: leftover engines emit `Trace.Notes` instead of `EvidenceRefs`; `#2689` not on trunk; AS-054 collector-fork ratchet missing. |
| AI / Agent Readiness | **78** | Real-mode defaults include prose-assumption extraction. Generated clients no longer blocked by a red snapshot. Not higher: TB-883 budget-blocked; semantic scorer unused on the wire; eval corpus still synthetic. |
| Time-to-Value | **81** | Declaration-only path findings, mermaid/vsdx ingest, Azure-soft ZIP prompt, Working attach, **execute merge**, estate-gap honesty, freshness warn. **Gate 1 UNKNOWN.** |
| Proof-of-ROI Readiness | **76** | Mechanism complete (disposition-aware sponsor summary, Simulator-forbid, pack-toggle). **0 of 3** G4 rows. Unchanged by engineering this cycle. |
| Sponsor / Operator Comprehension | **82** | Pack-toggle artifact + attach + estate gap + freshness. Semantic band not visible. Narrative still rests on synthetic output. |
| Runtime & First-Review Reliability | **77** | Push corset / OpenAPI fail-fast green on newest API PRs. Full `ci.yml` matrix stale-red; live merge queue absent; Gate 1 unobserved. |
| Adoption Friction | **87** | Soft Azure ZIP prompt + desk attach + freshness + HIPAA/ISO catalog slices. Extractor hosted-pull still not a hard first-review default. |

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 73/100.** ObservedFact merge and ARM-cited path findings exist; none has changed a decision a real architect made.

**Frontier-AI Survival Probability (12 months): 60–75%, moderate confidence.** Reference class: governed-workflow tools whose analysis layer is model-agnostic. Upward: diagrams, bound IaC, and live estate share evidence ids the model does not author. Downward: still no live bake-off; `#2689` not on trunk; support band invisible.

**30-Day Voluntary Usage Probability: 40–55%, low-moderate confidence.** A principal architect can now attach inventory and see execute change. They still have no reason to return until a first review shows them something they did not know **on their estate**.

**Sponsor Purchase Probability: 30–45%, low confidence.** **Zero G-REAL-06 pilots still dominates.**

**Reconciliation with §2.** Headline **81.64%** sits ~9 points above Decision Advantage (73). Read it as “the remaining cheap engineering is leftover citations + putting the unused support-band scorer on the wire, then **stop and run one real review**.”

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. Bind now changes execute — include a snapshot. | Staging `ship-gate-evidence` (human task #3). |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + DX-70. Leftover 67-band rows remain uncited — honesty, not a hallucination hole. | Upgrade after Gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline; Simulator-forbid. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | `Operator UI: typecheck (blocking)` success on `34410769119`. | Keep green through `#2689` merge. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037 unchanged. Bind IDOR/audit on `#2689`. | As Gate 1. |

**No numbered gate FAILs.** Attached process risk: **full `ci.yml` matrix not green in the inspected window**; PR-lane reds on docs link integrity / pre-corset guards / Azure extractor Pester are **not** the OpenAPI snapshot.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 81.64% (v11). Gate 5 PASS; Gate 1 UNKNOWN.**

ArchLucid is a governed architecture-review system with a **43**-engine golden harness, tenant-filtered compliance packs spanning CIS (Azure/AWS/GCP), SOC 2, GDPR, HIPAA (P1), ISO 27001 (P1 on `#2689`), PCI and ZTA (PCI encryption/transit still thin), sealed manifests, database-per-tenant isolation, and first-party Jira / ServiceNow / Confluence / Slack / Teams connectors. Diagrams compile (mermaid + vsdx goldens). Inventory snapshots can be attached **and merged on execute** as ObservedFact. Typed-engine findings are scored and demotable (ADR 0070). In Real mode the LLM judge, insight generator, and prose-assumption extractor run by default under spend caps.

**What this pass did not buy.** No architect outside the repository has run a real-mode review. Four leftover engines still have no citation the density gate accepts. The semantic support scorer exists and nobody can see it. PCI still advertises keys that cannot fire.

**(B) Procurement / market realism (weight 0 in `(A)`).** Honest trust posture: self-assessment, templates, owner pen test; no CPA SOC 2 and no published third-party pen test. Sales-led motion; live commerce is V1.1 owner-only.

**Commercial picture.** Compelling as a demo of governed, policy-driven, evidence-linked findings **including live estate when bound**; unproven as a decision-changer because no G4 row exists.

**Enterprise picture.** Trust mechanisms ahead of proof. Hesitation will be “show me one real run,” not architecture.

**Engineering picture.** Product invariants are robust. Newest API fail-fast is green. Process still evaluates PR-branch SHAs. Full matrix is a month stale.

**Frontier-AI picture.** Becoming more valuable **in mechanism** as diagrams, IaC, and bound inventory share evidence ids the model does not author — **if** one real run ever shows it.

---

## 6. Deferred Scope Uncertainty

V1.1: CloudEvents webhooks, MCP membrane, multi-region, commerce un-hold. V2: CPA SOC 2 / third-party pen-test *publication*, automated tenant-erasure, Redis-as-default, DTF / Container Apps Jobs. Graph-RAG community summarization remains behind `EnableCommunitySummarization=false`; **TB-883** ablation is owner-approved and budget-blocked.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 76 · weight 13 · contribution 9.36 · deficiency 312

**What is true.** ADR 0070 scores typed engines. 43 harness engines; 27 emit on the `#2689` recorded corpus. Path engines fire on Azure/AWS/GCP IaC. Case-71 vsdx and case-72 exist. AS-042 emits at 92. Prior sealed graph can load on Working execute. **Bound inventory is a graph overlay**, not a desk write.

**What is not.** Proof. `WouldDemoteAt65Count = 0`. Four leftover engines still fail `HasConcreteEvidenceCitation` (`dr-rpo-topology` collects refs without product-shaped fallback; `requirement-sku-tier` / dangling / premise-conflict emit notes, not `EvidenceRefs`).

**Classification:** V1 mechanism largely complete; **validation required**. **Affects outcomes 1, 3, 5.**

### 7.2 AI / Agent Readiness — 78 · weight 10 · contribution 7.80 · deficiency 220

Real-mode effective-on for judge, generator, ranking priors, prose-assumption extraction. OpenAPI green unblocks generated clients. Synthetic eval; TB-883 blocked; AS-057 scorer unused.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.3 Correctness & Evidence Integrity — 82 · weight 12 · contribution 9.84 · deficiency 216

Orchestrator / Kind B closed. DX-70 still rejects heading fragments. OpenAPI fail-fast green. 65-band ARM on `#2689`. Leftover engines skip `EvidenceRefs`. AS-054 ratchet not shipped.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.4 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Mechanism complete; G4 HOLD 0/3. Pack-toggle artifact is not a G4 row. **Affects outcomes 3, 4.**

### 7.5 Time-to-Value — 81 · weight 10 · contribution 8.10 · deficiency 190

Declaration-only reviews yield path findings. Mermaid/vsdx can enter the graph. Azure ZIP soft prompt exists. Desk attach, execute merge, estate gap, freshness. Gate 1 UNKNOWN.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.6 Differentiability / Defensibility vs Frontier AI — 87 · weight 13 · contribution 11.31 · deficiency 169

Pack-filtered declaration findings differ on a fixed graph. HIPAA P1 + ISO P1. PCI remainder still stubby at mapped encryption/transit ids.

**Classification:** V1 mechanism; demo residual. **Affects outcomes 1, 2, 5.**

### 7.7 Runtime & First-Review Reliability — 77 · weight 7 · contribution 5.39 · deficiency 161

merge_group exists; live queue does not. Newest OpenAPI job green. Full matrix stale-red. **Affects outcomes 2, 3.**

### 7.8 Sponsor / Operator Comprehension — 82 · weight 8 · contribution 6.56 · deficiency 144

Help/operator polish + pack-toggle + attach + estate gap + freshness. Support band not on the desk. No sponsor has read a real-mode summary.

**Classification:** V1 residual. **Affects outcomes 2, 4.**

### 7.9 Governed Review Integrity — 89 · weight 13 · contribution 11.57 · deficiency 143

Product rubric strong. Bind writes have AS-055 audit/IDOR on `#2689`. Semantic band ADR exists; wire does not. Repo gate still weaker than the review gate until merge queue is applied.

**Classification:** V1 residual. **Affects outcomes 2, 4, 5.**

### 7.10 Adoption Friction — 87 · weight 5 · contribution 4.35 · deficiency 65

Soft extractor prompt + attach + freshness. Hosted-pull default still not hard. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **Insight density is still mechanism-rich and proof-free.** Zero real-mode runs; synthetic frontier fixtures; leftover 67-band `No evidence`. **Largest weighted deficiency (312). Validation + small citation leftover.**
2. **AS-057 scorer is dark.** Quote-overlap band exists in Decisioning and never reaches OpenAPI / Working / export. **Design. Cheapest remaining GRI/Comprehension lever.**
3. **Leftover engines skip `EvidenceRefs`.** `requirement-sku-tier` and dangling put `evidence:graph-node:` in `Trace.Notes` only; `dr-rpo-topology` uses `CollectFromNodeIds` without product-shaped fallback. **Design. Same pattern as QR-18.**
4. **`#2689` is not on trunk.** Trunk distribution still shows ten `security-baseline` findings at 65 with no evidence. **Process — merge.**
5. **Zero G-REAL-06 pilots.** Pack-toggle artifact does not substitute. **Market.**
6. **Gate 1 remains UNKNOWN.** Bind now changes execute — the unknown is more expensive to leave. **Validation.**
7. **Live merge queue is not applied.** `merge_group` YAML + draft JSON shipped; GitHub still evaluates PR-branch SHAs. **Owner.**
8. **PCI mapped encryption/transit ids are catalog stubs** (`pci-007`, `pci-009`). ISO/HIPAA P1 shipped; PCI pack still advertises silent keys. **Design.**
9. **Full `ci.yml` matrix has not been green in the inspected window.** Last full dispatch 2026-08-28. PR-lane reds: docs link integrity, pre-corset guards, Azure extractor Pester. **Process.**
10. **TB-883 Graph-RAG ablation remains budget-blocked.** **Owner.**

**Removed because genuinely present this cycle:** empty orchestrator `Findings`; Kind B heading-fragment fixture; OpenAPI fail-fast red after AS-048; attach-without-merge; unlabeled boxes minting resources; HIPAA fully silent; missing Working attach; AS-051 green-field fiction (on trunk).

---

## 9. Frontier-AI Analysis

| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | **Commodity now** | Any frontier model with pasted standards. |
| Declaration-derived path findings from IaC | **Durable → more valuable** | Graph the model does not author. |
| Diagram-compiled topology + bound IaC evidence ids | **More valuable** | Engines cite shapes and ARM nodes. |
| Bound live-estate ObservedFact | **More valuable (now shipped)** | Live inventory the model did not hallucinate — on execute, not only attach. |
| Policy-pack-driven theme enablement | **Durable** | Customer policy state is not in the model's context unless pasted every time. |
| Semantic support band (ADR 0085) | **More valuable if wired** | A cited falsehood currently looks Decision-grade on the desk. |
| Sealed manifest + audit | **Durable** | Organizational, not analytical. |

**Hard-to-reproduce-via-prompting:** policy state, tenant-filtered vocabulary, sealed evidence, declaration gating, diagram→graph compile, ObservedFact overlay, audit. **Easy soon:** any single finding's prose.

**Leverage bet:** better models raise judge/generator/prose-assumption quality at ~zero ArchLucid engineering cost while deterministic engines, compiled diagrams, and bound inventory guarantee the floor. Unproven.

**Displacement timeline:** one model release commoditizes finding prose; none commoditizes the customer's pack version, the sealed record, or a bound snapshot the model did not author.

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable **in mechanism**, and not at all **in evidence**. Survival probability is in §3.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes.** Pack-toggle artifact + `PolicyFilteredDeclarationGoldenCorpusTests`.
2. **Trace input → evidence → policy → recommendation → decision → audit?** Yes for typed-engine and declaration findings when citations resolve. Bound snapshot is now on that trace when attached. Support band is not.
3. **Would frontier-AI-alone reproduce it consistently?** Not the traceability, tenant-filtered vocabulary, sealed manifest, or ObservedFact overlay.
4. **AI-generated vs governed infrastructure?** Prose is AI; edges, policy keys, manifests, audit, diagram compile, ObservedFact merge are infrastructure.
5. **Proof the moat is real:** G-REAL-06 with two packs on one upload **and** a bound snapshot. Artifact exists; live run does not.
6. **Fastest validation:** G-REAL-06 run 1–2 with two packs, one of them bound.
7. **Demo behavior that makes it obvious:** side-by-side CIS-Azure vs SOC 2 on the same upload, then the same review **with** a bound snapshot.

---

## 11. Principal Architect Dismissal Test

"I need this" trigger: upload AWS Terraform and get a named blast-radius + CIS-AWS rule without connecting an account — exists. "I attached inventory and execute changed" is now the second trigger — **on `#2689` + AS-050**, not yet shown to anyone outside the repo.

Most likely dismissal trigger: **"Show me a real run."** Likelihood **0.55–0.70**. Second trigger used to be attach-without-merge; that path is closed on trunk.

Would they believe it beats "Claude + a good prompt + my standards pasted in"? **On mechanism, yes; on evidence, not yet.**

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that 43 harness engines and a 65-band-closed table constitute density gains. They constitute *coverage and honesty*. Decision-changing still needs a human.

**Looks differentiated, is commodity:** finding prose.

**Looks ordinary, may be the moat:** `DeclarationSignalPolicyKeyMap` + mermaid/vsdx→graph compile + ObservedFact overlay.

**Months-burning distraction:** DX-77; another engine coverage pack; AS-076+ Career/Rehearsal chrome before Gate 1; wiring a second Azure collector.

**Six-month freeze prescription:** merge `#2689`; put leftover `EvidenceRefs` on 67-band engines; put the unused support-band scorer on the wire; apply merge queue; run Gate 1 **with a bind**; run G-REAL-06 with two packs; stop re-scoring.

**Most dangerous attractive distraction:** starting AS-076–AS-100 (Career vs Rehearsal / sharing) before one real bound review exists.

**Most boring real moat:** sealed manifest + pack version on the audit row.

---

## 13. Competitive Reality Check & Moat Assessment

Current moat: policy-state-driven declaration gating, sealed evidence, governed workflow, diagram compile, ObservedFact overlay. Potential moat: path findings + diagram citations + live estate that improve with model quality. Weakest moat assumption: buyers will believe the mechanism without a run. Illusory moat: engine count. Boring-but-durable: audit + manifest. What makes it obvious: live two-pack compare plus a bound snapshot that actually changes findings.

---

## 14. Adoption & Monetization

**30-day usage:** strongest positive — declaration-only path findings plus mermaid/vsdx ingest plus attach **that execute honors**; strongest negative — nothing shown to a real architect. **Sponsor purchase:** blocker is G4 HOLD. **Why buy instead of more frontier licenses:** the license does not know the pack version, cannot seal evidence, and cannot tell you what changed since last quarter **or** what the live estate actually contains.

**Top monetization blockers:** (1) no real-mode proof row; (2) Gate 1 unobserved; (3) `#2689` not on trunk; (4) G-COMMERCE-01; (5) no sponsor has read a real ROI summary; (6) PCI/ZTA packs still silent on mapped encryption keys.

**Top enterprise adoption blockers:** (1) live inventory opt-in (soft prompt only); (2) extractor permission story per cloud; (3) procurement trust posture `(B)`; (4) no pilot references; (5) operator onboarding without founder; (6) merge-queue not live (internal credibility).

---

## 15. Most Important Truth

**Execute can now see a bound estate — and still nobody outside this repository has run a real review against one.**

QR-16–QR-25 closed the v10 OpenAPI / merge / ARM / ISO / freshness / IDOR pack (on `#2689`). Density does not move from 76 to “excellent” with another engine. **Merge the PR, cite the leftover 67-band engines, put the unused support band on the wire, then run one real review with two packs.**

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** DX-77; AS-076–AS-100 Career/Rehearsal chrome; Graph-RAG community default flip before TB-883 has a budget; prefix-family `IsThemeEnabled` (PP-01 already rejected it); re-implementing AS-049 / AS-050 / AS-051 / QR-16–QR-25; regenerating OpenAPI with no DTO change.

**Diminishing returns:** more engines without `EvidenceRefs` on the four leftover 67-band rows; UI polish on routes no pilot has seen; more claim-honesty guards while G4 is 0/3.

**Founder behaviors that delay validation:** commissioning another density generation pack; treating a green PR fail-fast as a green full `ci.yml` matrix; treating `#2689`'s distribution table as trunk.

**Enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region.

---

## 17. Top Improvement Opportunities

**Shipped this cycle — do not re-open:** QR-01–QR-25 (QR-16–25 on `#2689`); AS-042; AS-046–AS-051; AS-056–AS-057.

### Tier 1 — Must Fix / Must Validate

**1. Merge `#2689` onto `master`.**
Tier 1 · Why: trunk still records 65-band no-evidence. · Affected: Density, Correctness, Diff. · Evidence: `gh pr view 2689` OPEN. · Design 1 / Market 0 · **V1.** Owner merge (Composer rebase if asked).

**2. Enable merge queue (owner) — YAML already shipped.**
Tier 1 · **Owner.** Draft JSON in `.github/rulesets/golden-cohort-gate-merge-queue.json`. · Design 6 / Market 0.

**3. Execute Gate 1 with a bound snapshot, then G-REAL-06 with two pack configurations.**
Tier 1 · **Validation.** Market 9 / Design 2.

### Tier 2 — High Leverage (Composer prompts QR-26–QR-35)

**4. Leftover 67-band citations** (`dr-rpo-topology`, `requirement-sku-tier`) — product-shaped fallback + ARM on those goldens. **QR-26.**

**5. Dangling + premise-conflict `EvidenceRefs`** (today only `Trace.Notes`). **QR-27.**

**6. Support band enum on the finding wire + OpenAPI (AS-059).** Scorer already exists. **QR-28.**

**7. Working desk shows the band (AS-061).** **QR-29.**

**8. AS-054 CI ratchet — no second Azure collector types.** **QR-30.**

**9. Next `ga-starter` PCI DSS P1 exact-id slice** (`pci-007` / `pci-009` stubs). Do not redo ISO. **QR-31.**

**10. AS-066 ratchet: support band must not fuse into the density gate.** **QR-32.**

**11. AS-058 consume Lane B support-ratio when present (honesty “async, may lag”).** **QR-33.**

**12. Re-record distribution after 26–27.** **QR-34.**

**13. Full `ci.yml` matrix triage on one trunk SHA after `#2689` lands.** **QR-35.**

Cursor prompts for items 4–13: [`../architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md) (**QR-26–QR-35**).

### Tier 3 — Hold

TB-883 ablation (budget-blocked); frontier capture with real transcripts (after G-REAL-06); AS-076+ Career/Rehearsal; prefix-family theme enablement; AS-086+ RestrictToShares; DX-77; ZTA remainder after PCI; Option A ~144-rule catalog.

---

## 18. Prompt Batching Guidance

**First — owner / Composer:** merge `#2689`. Do not re-implement QR-16–QR-25.

**Second — Composer, can parallel after merge:** QR-26 (67-band citations) and QR-30 (AS-054 ratchet). **Composer-safe.**

**Third — Composer:** QR-27 (dangling + premise-conflict refs) then QR-34 (re-record). QR-31 (PCI P1) parallel with 26–27.

**Fourth — Composer:** QR-28 (AS-059 wire + OpenAPI regen — DTO **does** change). Then QR-29 (desk). Then QR-32 (no-fuse ratchet) and QR-33 (Lane B honesty).

**Fifth:** QR-35 full-matrix triage **after** emission/golden churn settles. Owner: apply merge queue; Gate 1 with bind; G-REAL-06.

---

## 19. Model Usage Guidance

Composer for QR-26/QR-27 (golden graph properties + `EvidenceRefs`), QR-30/QR-32 (architecture tests), QR-31 (catalog rows following HIPAA/ISO pattern), QR-34 (record markdown). Composer for QR-28 if following existing Finding DTO + OpenAPI regen script; stronger reasoning if DTO versioning is ambiguous. Composer or stronger for QR-29 desk band. QR-35 is triage, not a rewrite. Owner for merge queue, Gate 1, G-REAL-06. No assessment re-run until `#2689` is on trunk and QR-26–QR-28 are green.

Workspace model allowlist: **Composer 2.5 slow** (`composer-2.5`) unless the user authorizes another slug.

---

## 20. Pending Questions For Later

**Blocks V1:** merge `#2689`; merge-queue apply; Gate 1; G-REAL-06; G-COMMERCE-01.

**Requires founder decision:** (a) apply merge queue now; (b) TB-883 monthly cap; (c) whether Azure hosted-pull should become a hard first-review gate (soft prompt already shipped).

**Requires customer validation:** everything in §7.1's "what is not."

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v11 is the pass where attach became true (ObservedFact on execute) and the 65-band honesty hole closed on a still-open PR. The unused AS-057 scorer is the opposite of taste — a career band that cannot be seen. The useful next move is small: **merge `#2689`, cite the four leftover engines, put the band on the wire, then run one real bound review.**
