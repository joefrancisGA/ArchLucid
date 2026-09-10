# ArchLucid Strategic Release and Market Readiness Assessment (v10)

**Pass date:** 2026-09-09, **21:40–21:50 UTC (v10)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v9 pass is superseded by this document and is **not** canonical. v9 is archived at [`../archive/assessments/LATEST_GPT55-2026-09-09-v9-superseded.md`](../archive/assessments/LATEST_GPT55-2026-09-09-v9-superseded.md).

## v10 pass note — QR-06–QR-15 closed on trunk; attach exists; execute still ignores the snapshot

This pass was requested as a **fresh** quality assessment after the v9 Composer pack landed. `origin/master` HEAD is **`35f4898028`** (**AS-049** Working-desk inventory attach, `#2668`). **QR-01–QR-15 are all on `master`**, including QR-15 diagram evidence on bound TF/ARM nodes (`#2679`). The v9 Suite=Core orchestrator / Kind B red is **closed**. `LatestGoldenCorpusCaseNumber` is **72**. Pack-toggle is a CI-guarded artifact. HIPAA P1 ga-starter slice shipped. Azure extractor first-review **soft** prompt shipped.

What replaced the old red: the newest **completed** push-adjacent run ([34407627784](https://github.com/joefrancisGA/ArchLucid/actions/runs/34407627784), AS-048) **failed** `.NET: OpenAPI v1 contract snapshot (fail-fast)` while gitleaks, beta-readiness, UI typecheck, jwt-bearer, and **`.NET: push corset` succeeded**. AS-049's typecheck run was still **queued** at inspection.

**AS-050 is not on `master`.** Architectures can attach a snapshot (API + desk) and execute still does not merge those nodes as `ObservedFact`. That is the remaining inventory-bind density lever. Gate 1 is still **UNKNOWN**. **G4 HOLD — 0 of 3**.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Grok 4.6 as a Cursor cloud agent, code-grounded desk review; **no live Azure OpenAI call was made during this pass**; no subagents were used for the assessment itself.

**Source materials inspected this pass:** `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/trust-center.md` (boundary), `docs/go-to-market/GTM_BACKLOG.md`, `docs/go-to-market/CLAIM_READINESS_STATUS.md`, `docs/library/TECH_BACKLOG.md` (open-count header + TB-883), `.cursor/rules/Assessment-Scope-V1_1.mdc`, `docs/quality/insight-density-engine-distribution.md`, `docs/quality/policy-pack-toggle-compare.md`, `docs/quality/pp01-ga-starter-catalog-extension-scoping.md`, `docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`, `docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`, `GoldenCorpusHarnessEngineRegistration.cs` (`LatestGoldenCorpusCaseNumber = 72`), `ArchitectureInventoryBindingService.cs`, `GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation`, `.github/workflows/ci.yml` (`merge_group`), `.github/rulesets/golden-cohort-gate-merge-queue.json`, `gh run list` / `gh run view` on `ui-typecheck-on-push.yml` and `ci.yml`, `git log origin/master`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `git fetch origin master` + `git log origin/master -25 --oneline` | HEAD **`35f4898028`** AS-049 `#2668`. QR-06–QR-15 all present. AS-042, AS-046–AS-048 also on trunk. |
| 2 | `gh pr view 2679` | QR-15 **merged** 2026-09-09T21:41:15Z. |
| 3 | `GoldenCorpusHarnessEngineRegistration.cs` on `origin/master` | `LatestGoldenCorpusCaseNumber = 72`. Harness registers **43** engine ids. |
| 4 | `docs/quality/insight-density-engine-distribution.md` | **26** engines emit across case-01..case-72. `security-baseline` 10 findings at 65, **No evidence = 10**. `identity-blast-radius` 5/5 no evidence. `data-flow-trust-boundary` 3/4 no evidence (max 100). `diagram-declaration-omission` at 92. `WouldDemoteAt65Count = 0`. |
| 5 | `gh run view 34407627784` | OpenAPI snapshot **FAIL**. Push corset **SUCCESS**. UI typecheck **SUCCESS**. |
| 6 | `gh run list --workflow ci.yml --branch master --limit 6` | Still **failure/cancelled**; last full `workflow_dispatch` **2026-08-28** `33193938737`. |
| 7 | `CLAIM_READINESS_STATUS.md` | **G4 HOLD — 0 of 3**. G1/G2/G5/G6 PASS (mechanism). |
| 8 | `ArchitectureInventoryBindingService` + execute path | Attach/detach + SQL + Working desk exist. **No execute merge of bound snapshot as ObservedFact (AS-050).** |
| 9 | `DeclarationSignalPolicyKeyMap.IsThemeEnabled` | Still **exact-id**. Prefix family rejected (PP-01). |
| 10 | `.github/rulesets/golden-cohort-gate-merge-queue.json` | Draft only (`enforcement: evaluate`). **Live ruleset still has no `merge_queue` rule.** |
| 11 | `TECH_BACKLOG.md` header | **25** unique open TB rows (P0 0 · P1 2 · P2 15 · P3 8). **TB-883** still budget-blocked. |
| 12 | `docs/quality/policy-pack-toggle-compare.md` | Present (QR-11). HIPAA P1 slice shipped (QR-12). ISO remainder still open in the scoping doc. |

**Verified counts this pass:** harness **43** engines; **26** emit on the recorded corpus; **72** golden cases; **0** real-mode pilot runs; **0** live merge-queue rule; OpenAPI fail-fast **red** on the newest completed attach-API push.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows plus owner-decision items. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**). **G-REAL-05** / **G-ASSURANCE-02** omitted from `(A)` (they do not reduce the headline).

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Enable GitHub merge queue** on `master` using `.github/rulesets/golden-cohort-gate-merge-queue.json` (or UI equivalent) | YAML + draft JSON shipped. Live ruleset still evaluates PR-branch SHAs. Today's OpenAPI miss after AS-048 is the same two-PR class. | Partial — JSON already drafted | **N/A — owner apply** |
| 2 | **Gate 1** — one observed end-to-end first review on staging (`archlucid pilot ship-gate-evidence --run-id <guid>`) | Only **UNKNOWN** numbered ship gate. | Partial | **Owner + Opus** |
| 3 | **G-REAL-06** — three real-mode pilot runs, **two pack configurations on the same input** (CIS-Azure vs SOC 2) | Largest commercial uncertainty; the only way density moves from mechanism to proof. Pack-toggle artifact exists; live compare does not. | Partial | **Opus** |
| 4 | **G-REAL-07** — proof packets + run-log rows | Depends on #3. | Partial | **Composer** |
| 5 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #4. | Partial | **Composer** |
| 6 | **TB-883 monthly AOAI cap + tenant cohort** | Approved with budget **TBD**. | Yes — plan is agent-draftable | **Composer** |
| 7 | **M-07** — polished operator screenshots | Unblocked on UI typecheck. | Partial | **Composer** |
| 8 | **M-16** — demo video (run **G-REAL-09** first) | Depends on #7. | Partial | **Composer** |
| 9 | **G-COMMERCE-01 / M-94** — invoice/SOW commercial readiness | Independent of analysis. | No | N/A — human only |

**Shipped this cycle — do not re-open:** QR-01–QR-15; AS-042; AS-046–AS-049; AS-019 / AS-035 / AS-045 (unlabeled / vsdx / R5); DX-51–DX-76; ADR 0070; PP-01 Option B catalog slice + HIPAA P1; Azure extractor **soft** first-review prompt; pack-toggle quality artifact; prose-assumption Real-mode default-on.

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 78.97%**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

**The headline is not ship-blocked by a numbered gate.** Gate 5 remains **PASS** (UI typecheck green on the newest completed attach-API run). The attached process risk is **OpenAPI snapshot drift** after AS-048 — not empty `Findings`.

**What is true on trunk.** Decisioning Suite=Core compiles and the orchestrator emits. Diagrams compile into the graph. Inventory can be **attached**. Typed-engine findings are scored and demotable. Real-mode judge / generator / prose-assumption run by default under spend caps. Pack-toggle is recorded. HIPAA P1 declaration keys can fire.

**What is not.** No architect outside the repository has run a real-mode review. Attaching a snapshot does not change the decide graph. Ten `security-baseline` findings still sit at the demotion threshold with no citation that `HasConcreteEvidenceCitation` accepts. Path engines still score 72 with almost no evidence. Full `ci.yml` matrix still unmeasured-green. OpenAPI fail-fast is red on the newest completed API push.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 72 | 13 | 9.36 | **364** |
| 2 | Differentiability / Defensibility vs Frontier AI | 85 | 13 | 11.05 | 195 |
| 3 | Governed Review Integrity | 87 | 13 | 11.31 | 169 |
| 4 | Correctness & Evidence Integrity | 78 | 12 | 9.36 | **264** |
| 5 | AI / Agent Readiness | 76 | 10 | 7.60 | 240 |
| 6 | Time-to-Value | 77 | 10 | 7.70 | 230 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 79 | 8 | 6.32 | 168 |
| 9 | Runtime & First-Review Reliability | 74 | 7 | 5.18 | 182 |
| 10 | Adoption Friction | 85 | 5 | 4.25 | 75 |
| | **(A) Headline readiness** | | **100** | **78.97%** | |

Sum(score × weight) = 936 + 1105 + 1131 + 936 + 760 + 770 + 684 + 632 + 518 + 425 = **7897** → **(A) = 78.97%**.

**Ranked by weighted deficiency:** Insight Density (364) · Correctness (264) · AI/Agent Readiness (240) · Time-to-Value (230) · Proof-of-ROI (216) · Differentiability (195) · Runtime (182) · Governed Review Integrity (169) · Comprehension (168) · Adoption Friction (75).

**Total remaining deficiency signal: 2,103.**

**Scoring rationale.**

| Quality | Score | Why exactly this much |
|---|---:|---|
| Decision-Changing Insight Density | **72** | Mechanism is richer than a year ago: 43 harness engines, case-72, AS-042 contradiction engine, prior-graph Working default, mermaid/vsdx goldens, QR-08/QR-09 collectors. Not higher: **zero real-mode runs**; `security-baseline` 10/10 no evidence at 65; `identity-blast-radius` 5/5 no evidence; bound inventory **does not merge on execute**; frontier delta still synthetic. |
| Differentiability / Defensibility | **85** | Pack-toggle is a checked-in artifact; HIPAA P1 fires; declaration gating is exact-id and real. Not higher: ISO remainder still silent; live two-pack compare unrun; `IsThemeEnabled` remains exact-id (prefix enablement correctly rejected). |
| Governed Review Integrity | **87** | Policy → evidence → finding → decision → audit rubric is strong; IsolatedRun + prior-graph default exist. Holding: live merge queue not applied; G4 0/3. |
| Correctness & Evidence Integrity | **78** | Orchestrator / Kind B closed. Citation contract (DX-70) intact. QR-15 stamps diagram evidence onto bound IaC nodes. Not 82: OpenAPI snapshot red after AS-048; 65-band refs still fail `HasConcreteEvidenceCitation` on the recorded corpus; AS-050 missing so attach is a write that execute ignores. |
| AI / Agent Readiness | **76** | Real-mode defaults include prose-assumption extraction. Eval corpus still synthetic; TB-883 budget-blocked; OpenAPI drift hurts generated clients. |
| Time-to-Value | **77** | Declaration-only path findings, mermaid/vsdx ingest, Azure-soft ZIP prompt, Working attach control. **Gate 1 UNKNOWN.** Execute still treats unbound and bound the same. |
| Proof-of-ROI Readiness | **76** | Mechanism complete (disposition-aware sponsor summary, Simulator-forbid, pack-toggle artifact). **0 of 3** G4 rows. |
| Sponsor / Operator Comprehension | **79** | Pack-toggle buyer artifact + attach control + HIPAA honesty. Narrative still rests on synthetic output. |
| Runtime & First-Review Reliability | **74** | Push corset green on Decisioning; OpenAPI fail-fast red; full `ci.yml` matrix stale-red; live merge queue absent; Gate 1 unobserved. |
| Adoption Friction | **85** | Soft Azure ZIP prompt + desk attach + HIPAA catalog slice. Extractor hosted-pull still not a hard first-review default; vsdx operator path exists. |

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 69/100.** Graph-derived path findings and a contradiction engine exist; none has changed a decision a real architect made. Attach-without-merge does not add decision advantage.

**Frontier-AI Survival Probability (12 months): 58–73%, moderate confidence.** Reference class: governed-workflow tools whose analysis layer is model-agnostic. Upward: diagrams and bound IaC now share evidence ids. Downward: still no live bake-off; inventory attach is cosmetic until AS-050.

**30-Day Voluntary Usage Probability: 37–52%, low-moderate confidence.** A principal architect still has no reason to return until a first review shows them something they did not know — including live estate facts from a bound snapshot.

**Sponsor Purchase Probability: 28–43%, low confidence.** **Zero G-REAL-06 pilots still dominates.**

**Reconciliation with §2.** Headline **78.97%** sits ~10 points above Decision Advantage (69). Read it as “the mechanism is mostly built, the proof is absent, and the remaining cheap engineering is contract snapshot + execute-merge, not another engine pack.”

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` (human task #2). |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + DX-70 line-anchor tightening. 65-band corpus rows remain uncited — honesty, not a hallucination hole. | Upgrade after Gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline; Simulator-forbid. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | `Operator UI: typecheck (blocking)` success on 34407627784. | Keep green through AS-049. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard unchanged. AS-055 IDOR tests for bind still open. | As Gate 1; Composer can add bind IDOR (QR-23). |

**No numbered gate FAILs.** Attached process risk: **OpenAPI v1 snapshot red** on the newest completed trunk API push.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 78.97% (v10). Gate 5 PASS; Gate 1 UNKNOWN.**

ArchLucid is a governed architecture-review system with a **43**-engine golden harness, tenant-filtered compliance packs spanning CIS (Azure/AWS/GCP), SOC 2, GDPR, HIPAA (P1 slice), ISO 27001 (remainder still thin), PCI and ZTA, sealed manifests, database-per-tenant isolation, and first-party Jira / ServiceNow / Confluence / Slack / Teams connectors. Diagrams compile (mermaid + vsdx goldens). Inventory snapshots can be attached on the Working desk. Typed-engine findings are scored and demotable (ADR 0070). In Real mode the LLM judge, insight generator, and prose-assumption extractor run by default under spend caps.

**What v10 did not buy.** No architect outside the repository has run a real-mode review. Binding a snapshot does not change findings. Ten of the recorded 65-band findings still have no citation the density gate accepts. And every push that touches the API currently fights an OpenAPI snapshot the attach DTO already invalidated.

**(B) Procurement / market realism (weight 0 in `(A)`).** Honest trust posture: self-assessment, templates, owner pen test; no CPA SOC 2 and no published third-party pen test. Sales-led motion; live commerce is V1.1 owner-only.

**Commercial picture.** Compelling as a demo of governed, policy-driven, evidence-linked findings; unproven as a decision-changer because no G4 row exists.

**Enterprise picture.** Trust mechanisms ahead of proof. Hesitation will be “show me one real run, including live estate,” not architecture.

**Engineering picture.** Product invariants are robust. Trunk Decisioning is green. Process still evaluates PR-branch SHAs. The contract snapshot lagged the attach API.

**Frontier-AI picture.** Becoming more valuable **in mechanism** as diagrams and IaC share evidence ids the model does not author — **if** execute ever merges a bound snapshot and a real run ever shows it.

---

## 6. Deferred Scope Uncertainty

V1.1: CloudEvents webhooks, MCP membrane, multi-region, commerce un-hold. V2: CPA SOC 2 / third-party pen-test *publication*, automated tenant-erasure, Redis-as-default, DTF / Container Apps Jobs. Graph-RAG community summarization remains behind `EnableCommunitySummarization=false`; **TB-883** ablation is owner-approved and budget-blocked.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 72 · weight 13 · contribution 9.36 · deficiency 364

**What is true.** ADR 0070 scores typed engines. 43 harness engines; 26 emit on the recorded corpus. Path engines fire on Azure/AWS/GCP IaC. Case-71 vsdx and case-72 exist. AS-042 emits at 92. Prior sealed graph can load on Working execute.

**What is not.** Proof. `WouldDemoteAt65Count = 0`. Ten `security-baseline` findings survive on a +5 severity bonus with no concrete citation. Path engines at 72 are almost entirely `No evidence`. Bound inventory is a desk write, not a graph overlay.

**Classification:** V1 mechanism largely complete; **validation required**. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 78 · weight 12 · contribution 9.36 · deficiency 264

Orchestrator / Kind B closed. DX-70 still rejects heading fragments. QR-15 copies `SourceEvidenceItemId` onto bound IaC nodes. OpenAPI snapshot is red after AS-048. Collectors emit `graph-node:` fallbacks that `HasConcreteEvidenceCitation` rejects unless the node id is product-shaped ARM/ARN/`projects/`.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 AI / Agent Readiness — 76 · weight 10 · contribution 7.60 · deficiency 240

Real-mode effective-on for judge, generator, ranking priors, prose-assumption extraction. Synthetic eval; TB-883 blocked; generated-client drift from OpenAPI red.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.4 Time-to-Value — 77 · weight 10 · contribution 7.70 · deficiency 230

Declaration-only reviews yield path findings. Mermaid/vsdx can enter the graph. Azure ZIP soft prompt exists. Desk attach exists. Gate 1 UNKNOWN. Bound execute is still an unbound review.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.5 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Mechanism complete; G4 HOLD 0/3. Pack-toggle artifact is not a G4 row. **Affects outcomes 3, 4.**

### 7.6 Differentiability / Defensibility vs Frontier AI — 85 · weight 13 · contribution 11.05 · deficiency 195

Pack-filtered declaration findings differ on a fixed graph; the compare is now a quality artifact. HIPAA P1 shipped. ISO 27001 remainder still thin.

**Classification:** V1 mechanism; demo residual. **Affects outcomes 1, 2, 5.**

### 7.7 Runtime & First-Review Reliability — 74 · weight 7 · contribution 5.18 · deficiency 182

merge_group exists; live queue does not. Newest completed OpenAPI job red. Full matrix stale-red. **Affects outcomes 2, 3.**

### 7.8 Governed Review Integrity — 87 · weight 13 · contribution 11.31 · deficiency 169

Product rubric strong. Bind writes lack the AS-055 audit/IDOR ratchet. Repo gate still weaker than the review gate until merge queue is applied. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 79 · weight 8 · contribution 6.32 · deficiency 168

Help/operator polish + pack-toggle artifact + attach control. No sponsor has read a real-mode summary. Unbound still risks looking like a green field (AS-051). **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 85 · weight 5 · contribution 4.25 · deficiency 75

Soft extractor prompt + attach control. Hosted-pull default still not hard. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **OpenAPI v1 contract snapshot is red after AS-048.** Newest completed push: fail-fast job failed; Decisioning corset was green. Technical buyers who generate clients cannot re-prove the attach DTO. **Process + correctness; cheapest Composer fix.**
2. **Bound inventory does not merge on execute (AS-050).** Attach/detach + desk control shipped; decide path still treats the architecture as declaration/diagram-only. **Largest remaining density product lever.**
3. **Insight density is still mechanism-rich and proof-free.** Zero real-mode runs; synthetic frontier fixtures; `WouldDemoteAt65Count = 0`; 10/10 `security-baseline` at threshold with no evidence. **Largest weighted deficiency (364). Validation.**
4. **65-band citations fail `HasConcreteEvidenceCitation`.** QR-08 collectors emit refs the recorded corpus nodes cannot satisfy (no ARM/ARN/`diagram:` that resolve). Honesty PRs did not move the product score. **Design.**
5. **Path engines at 72 are almost entirely uncited** (`identity-blast-radius` 5/5, `segmentation-semantics` 3/3, `data-flow-trust-boundary` 3/4). **Design.**
6. **Live merge queue is not applied.** `merge_group` YAML + draft JSON shipped; GitHub still evaluates PR-branch SHAs. **Owner.**
7. **Gate 1 remains UNKNOWN.** **Validation.**
8. **Zero G-REAL-06 pilots.** Pack-toggle artifact does not substitute. **Market.**
9. **Unbound architecture can still look like a green field (AS-051)** and bind writes lack IDOR/audit ratchet (AS-055). **Design.**
10. **Full `ci.yml` matrix has not been green in the inspected window.** Last full dispatch 2026-08-28. **Process.**

**Removed because genuinely present on trunk this cycle:** empty orchestrator `Findings`; Kind B heading-fragment fixture; missing `merge_group` YAML; QR-05 unmerged; distribution stuck at case-69; missing pack-toggle artifact; HIPAA fully silent; no Working attach control; unlabeled boxes minting resources; mermaid-only golden gap (case-71 vsdx exists).

---

## 9. Frontier-AI Analysis

| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | **Commodity now** | Any frontier model with pasted standards. |
| Declaration-derived path findings from IaC | **Durable → more valuable** | Graph the model does not author. |
| Diagram-compiled topology + bound IaC evidence ids | **More valuable** | Engines can cite shapes and ARM nodes; a better model improves prose on a kernel it still cannot invent. |
| Bound live-estate ObservedFact (AS-050) | **More valuable if shipped** | Live inventory the model did not hallucinate. Currently attach-only. |
| Policy-pack-driven theme enablement | **Durable** | Customer policy state is not in the model's context unless pasted every time. |
| Sealed manifest + audit | **Durable** | Organizational, not analytical. |

**Hard-to-reproduce-via-prompting:** policy state, tenant-filtered vocabulary, sealed evidence, declaration gating, diagram→graph compile, (future) ObservedFact overlay, audit. **Easy soon:** any single finding's prose.

**Leverage bet:** better models raise judge/generator/prose-assumption quality at ~zero ArchLucid engineering cost while deterministic engines and compiled diagrams guarantee the floor. Unproven.

**Displacement timeline:** one model release commoditizes finding prose; none commoditizes the customer's pack version, the sealed record, or a bound snapshot the model did not author.

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable **in mechanism**, and not at all **in evidence**. Survival probability is in §3.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes.** Pack-toggle artifact + `PolicyFilteredDeclarationGoldenCorpusTests`.
2. **Trace input → evidence → policy → recommendation → decision → audit?** Yes for typed-engine and declaration findings when citations resolve. Heading-fragment `doc:` refs no longer count (DX-70) — correct. Bound snapshot is not yet on that trace.
3. **Would frontier-AI-alone reproduce it consistently?** Not the traceability, tenant-filtered vocabulary, or sealed manifest.
4. **AI-generated vs governed infrastructure?** Prose is AI; edges, policy keys, manifests, audit, diagram compile are infrastructure.
5. **Proof the moat is real:** G-REAL-06 with two packs on one upload. Artifact exists; live run does not.
6. **Fastest validation:** G-REAL-06 run 1–2 with two packs.
7. **Demo behavior that makes it obvious:** side-by-side CIS-Azure vs SOC 2 on the same upload, then the same review **with** a bound snapshot after AS-050.

---

## 11. Principal Architect Dismissal Test

"I need this" trigger: upload AWS Terraform and get a named blast-radius + CIS-AWS rule without connecting an account — exists. "I did not think of that" is still unmeasured.

Most likely dismissal trigger: **"Show me a real run."** Likelihood **0.6–0.75**. Second trigger: **"I attached inventory and nothing changed."** After AS-049 that path is visible.

Would they believe it beats "Claude + a good prompt + my standards pasted in"? **On mechanism, plausibly yes; on evidence, not yet.**

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that 43 harness engines and a case-72 table constitute density gains. They constitute *coverage*. AS-050 is the missing information source.

**Looks differentiated, is commodity:** finding prose.

**Looks ordinary, may be the moat:** `DeclarationSignalPolicyKeyMap` + mermaid/vsdx→graph compile + (future) ObservedFact overlay.

**Months-burning distraction:** DX-77; another engine coverage pack; AS-076+ Career/Rehearsal chrome before Gate 1.

**Six-month freeze prescription:** restore OpenAPI today; merge bound snapshots on execute; put ARM/ARN on the 65-band goldens; apply merge queue; run Gate 1; run G-REAL-06 with two packs; stop re-scoring.

**Most dangerous attractive distraction:** starting AS-076–AS-100 (Career vs Rehearsal / sharing) while OpenAPI is red and execute ignores the bind.

**Most boring real moat:** sealed manifest + pack version on the audit row.

---

## 13. Competitive Reality Check & Moat Assessment

Current moat: policy-state-driven declaration gating, sealed evidence, governed workflow, diagram compile into the graph. Potential moat: path findings + diagram citations + live ObservedFact that improve with model quality. Weakest moat assumption: buyers will believe the mechanism without a run. Illusory moat: engine count. Boring-but-durable: audit + manifest. What makes it obvious: live two-pack compare plus a bound snapshot that actually changes findings.

---

## 14. Adoption & Monetization

**30-day usage:** strongest positive — declaration-only path findings plus mermaid/vsdx ingest plus attach control; strongest negative — attach does not change execute, and nothing shown to a real architect. **Sponsor purchase:** blocker is G4 HOLD. **Why buy instead of more frontier licenses:** the license does not know the pack version, cannot seal evidence, and cannot tell you what changed since last quarter.

**Top monetization blockers:** (1) no real-mode proof row; (2) Gate 1 unobserved; (3) attach without merge; (4) OpenAPI red for technical buyers who generate clients; (5) G-COMMERCE-01; (6) no sponsor has read a real ROI summary.

**Top enterprise adoption blockers:** (1) live inventory opt-in (soft prompt only); (2) extractor permission story per cloud; (3) procurement trust posture `(B)`; (4) no pilot references; (5) operator onboarding without founder; (6) merge-queue not live (internal credibility).

---

## 15. Most Important Truth

**You can attach an estate snapshot and the review still pretends the estate was never there — and every API push is red on a contract snapshot that already knows the attach DTO.**

QR-06–QR-15 closed the v9 emission and honesty pack. AS-049 made the bind visible. Density does not move until execute merges ObservedFact and the 65-band goldens carry ARM/ARN the gate already knows how to accept. **Restore the snapshot, merge the snapshot, then run one real review with two packs.**

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** DX-77; AS-076–AS-100 Career/Rehearsal chrome; Graph-RAG community default flip before TB-883 has a budget; prefix-family `IsThemeEnabled` (PP-01 already rejected it); re-implementing AS-019 / AS-035 / AS-049.

**Diminishing returns:** more engines without ARM/ARN on the graph; UI polish on routes no pilot has seen; more claim-honesty guards while OpenAPI is red.

**Founder behaviors that delay validation:** commissioning another density generation pack; treating attach UI as live-estate proof; treating a green PR check as a green trunk until merge queue is live.

**Enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region.

---

## 17. Top Improvement Opportunities

**Shipped this cycle — do not re-open:** QR-01–QR-15; AS-042; AS-046–AS-049; AS-019/AS-035/AS-045.

### Tier 1 — Must Fix / Must Validate

**1. Restore OpenAPI v1 snapshot + generated TS types after AS-048/QR-15.**
Tier 1 · Why: fail-fast red on trunk; every later API PR fights the same job. · Affected: Correctness, Runtime, AI. · Evidence: run 34407627784. · Design 1 / Market 0 · **V1.** Cursor prompt: **QR-16**.

**2. Execute merges bound snapshot as ObservedFact (AS-050).**
Tier 1 · Why: attach without merge is false confidence. · Affected: Density, TTV, Correctness. · Evidence: `ArchitectureInventoryBindingService` has no execute overlay. · Design 4 / Market 1 · **V1.** **QR-17**.

**3. Enable merge queue (owner) — YAML already shipped.**
Tier 1 · **Owner.** Draft JSON in `.github/rulesets/golden-cohort-gate-merge-queue.json`. · Design 6 / Market 0.

**4. Execute Gate 1, then G-REAL-06 with two pack configurations.**
Tier 1 · **Validation.** Market 9 / Design 2.

### Tier 2 — High Leverage (Composer prompts QR-18–QR-25)

**5. Put product-shaped ARM/ARN/`diagram:` on 65-band golden graphs** so `HasConcreteEvidenceCitation` can pass. Collectors already exist. **QR-18.**

**6. Same for `identity-blast-radius` (5/5 no evidence).** **QR-19.**

**7. Next `ga-starter` ISO 27001 P1 slice** (HIPAA already QR-12). **QR-20.**

**8. Unbound architecture labeled estate gap (AS-051).** **QR-21.**

**9. Bound snapshot freshness on the desk (AS-052).** **QR-22.**

**10. Bind/unbind authz + Required audit + IDOR (AS-055).** **QR-23.**

**11. Re-record `insight-density-engine-distribution.md` after 16–19.** **QR-24.**

**12. Remaining path-engine citations (`segmentation-semantics`, leftover `data-flow-trust-boundary`).** **QR-25.**

Cursor prompts for items 1–2 and 5–12: [`../architecture/V10_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V10_QUALITY_ROI_COMPOSER_PROMPTS.md) (**QR-16–QR-25**).

### Tier 3 — Hold

TB-883 ablation (budget-blocked); frontier capture with real transcripts (after G-REAL-06); per-version OpenAPI document; DX-77; AS-076+ Career/Rehearsal; prefix-family theme enablement; AS-054 ratchet (do after AS-050 if a second collector appears).

---

## 18. Prompt Batching Guidance

**First — Composer, one PR:** QR-16 (OpenAPI snapshot + generated types). Merge nothing else until the OpenAPI fail-fast job is green. **Composer-safe.**

**Second — Composer:** QR-17 (AS-050 ObservedFact merge). Stronger reasoning if IE snapshot storage shape is ambiguous; still no new collector.

**Third — Composer:** QR-18 (65-band ARM on goldens) then QR-19 (blast-radius ARM/ARN). Parallel only after QR-16 is green.

**Fourth — Composer:** QR-20 (ISO slice) in parallel with QR-21 (estate-gap honesty).

**Fifth:** QR-22 / QR-23 after AS-049 is green on the queued run; QR-24 after 16–19; QR-25 last. Owner: apply merge queue; Gate 1; G-REAL-06.

---

## 19. Model Usage Guidance

Composer for QR-16 (snapshot regen), QR-18/QR-19 (golden graph properties), QR-21/QR-22 (copy + Vitest), QR-24 (record markdown). Composer or stronger for QR-17 (execute overlay order vs diagram bind). Composer for QR-20 catalog rows if following the HIPAA slice pattern. Stronger reasoning for QR-23 IDOR/audit. Owner for merge queue, Gate 1, G-REAL-06. No assessment re-run until QR-16 is green on trunk.

---

## 20. Pending Questions For Later

**Blocks V1:** QR-16; QR-17; merge-queue apply; Gate 1; G-REAL-06; G-COMMERCE-01.

**Requires founder decision:** (a) apply merge queue now; (b) TB-883 monthly cap; (c) whether Azure hosted-pull should become a hard first-review gate (soft prompt already shipped).

**Requires customer validation:** everything in §7.1's "what is not."

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v10 is the pass where the repo finished the v9 honesty pack and made inventory **visible** without making it **true**. That is principal-architect taste on the attach control and a process miss on the OpenAPI snapshot. The useful next move is small: **make the contract snapshot match the attach DTO, merge ObservedFact on execute, then run one real review.**
