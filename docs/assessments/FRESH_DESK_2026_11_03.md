# Fresh desk — SecureNow and ArchLucid

**Scored:** 2026-11-03 01:22 UTC  
**Tree:** `origin/master` at `9975603fcb` (includes merged PRs **#6062** rank next-stored context and disposition sync, **#6064** investigation-effort audit honesty, **#6068** Stop→ITSM handoff and first-review jest-axe, **#6069** Home Reader role hint, **#6073** cloud subscription scope on collection-missing, sponsor/pilot Stop ITSM links, and explanation rank context).  
**Prior desk:** 2026-11-02 21:41 UTC at `7709917e64` — SecureNow **74.93%**, ArchLucid **79.20%**.
**Model:** 47 qualities, total weight **120**. Weights match `scripts/calculate_scores.py` (46 qualities, weight 112) plus **Cutting-Edge AI Technology** at weight **8**.  
**`(A)` rule:** V1 / V1.1 in-contract product evidence only. SOC 2 CPA attestation, a signed design partner, owner walks, live Stripe, and a published Marketplace offer are **`(B)`** and do not reduce `(A)`.

Headline formula: `sum(score × weight) / 120`.

| Product | `(A)` headline | Prior desk (2026-11-02 21:41 UTC) |
|---|---:|---:|
| **SecureNow** | **75.63%** | 74.93% |
| **ArchLucid** | **79.24%** | 79.20% |

This pass recomputes every score from the merged tree at `9975603fcb`. It does not carry the 21:41 desk forward without re-reading the pragmatic lift PRs landed after `7709917e64`.

## Executive summary

### `(A)` Overall

Both products remain past a demo shell. SecureNow still shows `fixture-path-01` from welcome and footer chrome, keeps `/why-securenow` off those surfaces, and cites only stored hops and cut points. Home and cloud connections now name the **Reader** role and **subscription scope** when collection is missing. A saved **Stop** opens a draft ITSM outbound or finding-export handoff from Path inspect, the remediation workbench, the sponsor path page, and the pilot decision page — still draft-only; nothing sends until the operator confirms. Path rank and explanation surfaces show **next stored path** rank context when it is stored. Automated axe now also covers the first-review guide prerequisite block (in addition to Path inspect and the path-scoped diagram).

ArchLucid’s first-review guide names one next prerequisite (sample package, then policy pack) and that block is in the jest-axe set. SSO stays optional. Platform health stays a separate self-hosted blocker.

The headline gap is still commercial distance and real capture, not a missing ranker. SecureNow’s largest weighted holes remain the explanation substrate (simulator plus bounded Azure OpenAI, not a second ranker), time-to-value before a non-fixture Reader capture, and adoption friction until that capture exists. ArchLucid’s largest holes remain sales-led marketability, bounded AI substrate, and time-to-value before a sealed tenant review.

### `(B)` Procurement / market-motion realism

Beta remains **NO_GO**. Fees stay off public pages. A CPA-issued SOC 2 report and a third-party pen test are not published. Owner walks **M-308**, **M-313**, **M-314**, and **M-315** are not done. **M-316** quote documents stay off welcome and the footer. Those facts are buyer friction. They are not `(A)` deductions.

## How to read a row

Weighted deficiency = `(100 − score) × weight`. Higher means more urgent. Full notes are on the qualities that moved or that remain in the top of the deficiency list. Every other quality is one line.

## SecureNow — ranked by weighted deficiency

### Cutting-Edge AI Technology — 76 · weight 8 · deficiency 192

Rank query and explanation paths surface `nextStoredPathRankContext` when a next stored path exists. `SecurityEvidencePathExplanationService` still cites only allowed evidence refs and falls back on disallowed citations. The substrate is Azure OpenAI plus a simulator. This pass did not add a new model behavior or change `PathRankingEngine` weights.

v1: in scope.

### Time-to-Value — 74 · weight 7 · deficiency 182

Home names a next step from loaded capture state. The public sample is now on the welcome page and the footer, with `Synthetic fixture. Not a customer result.` Value before a real capture is still that fixture. A second successful capture is still required before path-id deltas are listed.

v1: in scope. The footer link does not create a subscription.

### Adoption Friction — 74 · weight 6 · deficiency 156

Cloud connections `securenow-collection-missing` names collection status, the Reader role, and an explicit **Subscription scope** line from the Azure connection (or `not selected`). Home repeats the same Reader and scope hint when capture is missing. The operator still must configure Reader and a subscription before a non-fixture path exists.

v1: in scope.

### Marketability — 78 · weight 8 · deficiency 176

Welcome and the marketing footer link `Healthcare Claims sample review` and `SecureNow sample (fixture-path-01)` (`/securenow-sample`). `/why-securenow` stays off both. The checker fails if the fixture href is removed or `/why-securenow` is added. Beta remains **NO_GO**. No fee is published. Score moved from 72 because the sample is on default marketing chrome, not only by URL. It does not move into the mid-80s while **NO_GO** and the absent price are the honest public posture.

v1: in scope as honest beta copy.

### AI/Agent Readiness — 78 · weight 8 · deficiency 176

Unknown hop refs, unknown cut points, and a swapped path id are rejected before they are cited. Simulator output is labeled. There is no separate SecureNow model route.

v1: in scope.

### Proof-of-ROI Readiness — 70 · weight 5 · deficiency 150

Investigation effort stays on **ROI not calculated** until the operator’s own inputs pass, rejects the fixture tuple, and records audit-oriented honesty when inputs are saved. No customer figure is stored in git.

v1: in scope as an honest blank.

### Correctness — 80 · weight 8 · deficiency 160

Path reports, hop evidence refs, and the explanation validator agree on what may be cited. Diagram hop filtering prefers `cloudResourceId` and then labels. SecureNow does not invent a second ranker.

v1: in scope.

### Sponsor Value Visibility — 78 · weight 4 · deficiency 88

`/administration/securenow-sponsor-path?pathId=` renders Path inspect and saves Proceed / Extend / Stop plus a required rationale in this browser for this workspace. A saved **Stop** links to the same draft ITSM handoff as Path inspect. The page states the record does not clear beta **NO_GO**. It is still not a server audit row, so it stays out of the mid-80s.

v1: in scope.

### Decision Velocity — 78 · weight 2 · deficiency 44

Path inspect, the sponsor path page, and the pilot decision page share the same browser disposition store. A saved **Stop** on the pilot decision page shows the draft ITSM handoff beside the saved rationale. Cross-browser and cross-device reopen still do not exist.

v1: in scope.

### Compliance Readiness — 74 · weight 2 · deficiency 52

When a cut point is visible, Path inspect shows `Framework theme: Microsoft cloud security benchmark. A cited theme is not a certification.` Score moved from 62. The line is a label, not a control evaluation.

v1: in scope.

### Accessibility — 76 · weight 1 · deficiency 24

`securenow-path-surfaces-axe.test.tsx` runs jest-axe on Path inspect with one path loaded and on the path-scoped diagram client. `first-review-guide-axe.test.tsx` covers the first-review one-prerequisite block. `ACCESSIBILITY_SCOPE.md` says that set is not a WCAG certification and not an assistive-technology user study. Participant AT studies stay out of `(A)`.

v1: in scope.

### Usability — 72 · weight 3 · deficiency 84

Diagrams with `pathId` still filter to hop endpoints until **Show the rest of the subscription**. Matching prefers `cloudResourceId`. When nothing matches, the banner says no diagram nodes matched the hop identifiers yet and the subscription control remains.

v1: in scope.

### One line each

| Quality | Score | Weight | Justification |
|---|---:|---:|---|
| Differentiability | 78 | 4 | Cited hops, cut points, a stored rank, and an Azure write refusal stay on Path inspect and the sample. |
| Workflow Embeddedness | 76 | 3 | Remediation workbench, ITSM onboarding, and sponsor/pilot **Stop** handoffs share one draft resolver. A saved Stop still does not send a ticket by itself. |
| Trustworthiness | 74 | 3 | Sample, fixture, ROI, and sponsor copy stay synthetic or **NO_GO** where a result would be over-claimed. |
| Commercial Packaging Readiness | 64 | 2 | Public SKU card has identifiers and no fee. Live Stripe is out of `(A)`. |
| Policy and Governance Alignment | 68 | 2 | Packs influence named expectation keys. WK-21 still excludes engines that are not pack-aware. |
| Procurement Readiness | 66 | 2 | Trust-center honesty and a private quote packet exist. CPA attestation is `(B)` only. |
| Interoperability | 74 | 2 | Collection and diagram leads state Azure-only. |
| Auditability | 80 | 2 | Shared append-only audit catalog. The sponsor disposition is browser storage, not that catalog. |
| Change Impact Clarity | 70 | 1 | Cut points describe a recommended change and say SecureNow does not change Azure. |
| Cognitive Load | 68 | 1 | Path-scoped diagrams help. The workbench still exposes the full mode set. |
| Customer Self-Sufficiency | 66 | 1 | Home and cloud connections name Reader scope and link to connections when collection is missing. |
| Stickiness | 62 | 1 | Home lists added, gone, and unchanged path ids after two successful captures, and says this is not a usage claim. |
| Template and Accelerator Richness | 58 | 1 | Home fixture rows are walks, not customer accelerators. |
| Traceability | 82 | 3 | Hops carry evidence references. Explanations may cite only those refs and cut points. |
| Data Consistency | 82 | 2 | Attack-path reports and ranked paths read the same stored path ids. |
| Architectural Integrity | 86 | 3 | SecureNow is a product line on the shared API, not a forked ranker. |
| Security | 80 | 3 | Tenant isolation stays database-per-tenant. Collection is read-only Azure inventory. |
| Reliability | 76 | 2 | Capture status distinguishes succeeded, partial, failed, and pending. |
| Maintainability | 78 | 2 | Product-line copy and path APIs stay separated from ArchLucid review copy. |
| Explainability | 78 | 2 | Path inspect shows hops, weakest hop, rank next-stored context, and explanation output appends rank context when the summary omits it. |
| Azure Compatibility and SaaS Deployment Readiness | 70 | 2 | Same host. Daily value still depends on a customer extractor upload or connector. |
| Availability | 74 | 1 | Shared host health. No SecureNow-specific SLO. |
| Performance | 72 | 1 | Home loads snapshots plus attack-path reports when captures exist. |
| Scalability | 74 | 1 | Path queries are paged. Diagram filter is client-side on the rendered outline. |
| Supportability | 70 | 1 | Self-service copy names the next page. |
| Manageability | 72 | 1 | Operators use the shared admin shell. |
| Deployability | 76 | 1 | Same release train as ArchLucid. |
| Observability | 74 | 1 | Shared API logs and audit events. |
| Testability | 82 | 1 | Disposition, ITSM handoff, collection-missing scope, rank context, and expanded axe tests cover the lines scored above. |
| Modularity | 82 | 1 | Hop filtering and disposition storage are isolated modules. |
| Extensibility | 74 | 1 | No public plugin SDK, and that absence is not an `(A)` defect. |
| Evolvability | 76 | 1 | Azure-only is explicit. |
| Documentation | 78 | 1 | `docs/securenow/` matches **NO_GO** and the fixture rules. Hold docs record the 2026-11-02 welcome/footer yes. |
| Azure Ecosystem Fit | 80 | 1 | Reader inventory, ARM ids, and Azure architecture icons. |
| Cost-Effectiveness | 74 | 1 | Explanations are one completion with a stored fallback. |

## ArchLucid — ranked by weighted deficiency

### Marketability — 78 · weight 8 · deficiency 176

The buyer path is still a sealed architecture review. Welcome already linked the Healthcare Claims sample. The footer now uses the same href, and the welcome band also links the SecureNow fixture without adding `/why-securenow`. Score moved from 76 for that chrome. It stays under 80 because the motion is still sales-led and live checkout is out of V1.

v1: in scope.

### Cutting-Edge AI Technology — 80 · weight 8 · deficiency 160

Platform-provisioned Azure OpenAI, retrieval, structured agent results, and PilotStrict gates are the substrate. Graph-RAG neighbor expansion is bounded. This pass did not change the model path.

v1: in scope.

### Time-to-Value — 78 · weight 7 · deficiency 154

The sample review spine shows a sample manifest on the sample run. The guide’s one-prerequisite block points at choosing a sample before a policy pack. A tenant review still has to be started, evidenced, and sealed.

v1: in scope.

### Adoption Friction — 78 · weight 6 · deficiency 132

`resolveFirstReviewGuideOnePrerequisite` names the first incomplete item in order: sample package selected (`isConfigured` and a selected run), then an enabled policy-pack workspace assignment. SSO is not in that list. `FIRST_REVIEW_GUIDE_SSO_OPTIONAL_COPY` stays. When both are done the block says `Sample package and policy pack are selected.` Self-hosted platform health remains `requiredBlockers`, not this block. Score moved from 72. It does not reach the mid-80s because the operator still has to finish a real review after those two selections.

v1: in scope.

### Proof-of-ROI Readiness — 74 · weight 5 · deficiency 130

Sponsor ROI summary is disposition-aware and labeled. It is not a customer-verified savings study.

v1: in scope.

### Correctness — 84 · weight 8 · deficiency 128

PilotStrict rejects an empty evidence anchor on `task-topology` and accepts one non-empty anchor. Cost governance already had the paired starter-pack test.

v1: in scope.

### AI/Agent Readiness — 84 · weight 8 · deficiency 128

Simulator and Real are separate. PilotStrict enforces citations on Real traces. Fallback and unparsed traces reject under PilotStrict.

v1: in scope.

### Sponsor Value Visibility — 76 · weight 4 · deficiency 96

Sponsor dashboard, scorecard, and board-pack export read the same sponsor-summary service. Per-system rows do not pretend to sum to the disposition-aware headline.

v1: in scope.

### One line each

| Quality | Score | Weight | Justification |
|---|---:|---:|---|
| Usability | 74 | 3 | Review workspace tabs stay visible. The review surface is still dense. |
| Differentiability | 82 | 4 | Policy packs, evidence-to-finding-to-manifest, and a sealed package remain the difference from a frontier chat. |
| Decision Velocity | 68 | 2 | Decisions and exceptions are recorded. The path is still a multi-tab review. |
| Workflow Embeddedness | 80 | 3 | Jira, ServiceNow, Confluence, Slack, and Teams seams ship. They do not apply changes in the customer cloud. |
| Trustworthiness | 80 | 3 | Sample versus tenant runs are distinguished. |
| Procurement Readiness | 70 | 2 | Trust center and self-assessment exist. CPA SOC 2 is `(B)`. |
| Commercial Packaging Readiness | 72 | 2 | Sales-led order form. Live commerce is not deducted. |
| Compliance Readiness | 74 | 2 | Bundled packs and declaration gating exist for named rule families. |
| Policy and Governance Alignment | 82 | 2 | Pre-commit gate and effective governance resolution ship. |
| Interoperability | 82 | 2 | Azure, AWS, and GCP inventory paths ship. SecureNow staying Azure-only does not reduce this score. |
| Auditability | 86 | 2 | Typed audit catalog and export. |
| Cognitive Load | 66 | 1 | The tab strip is intentionally intact. |
| Customer Self-Sufficiency | 74 | 1 | Managed Azure OpenAI is the hosted path. |
| Stickiness | 70 | 1 | Repeat review and comparison exist. No usage claim is inferred. |
| Template and Accelerator Richness | 70 | 1 | Guided intake, demo manifests, and bundled packs. |
| Accessibility | 72 | 1 | Automated a11y coverage includes the first-review prerequisite block. Participant AT studies are out of `(A)`. |
| Traceability | 88 | 3 | Authority chain from evidence through manifest and artifacts. |
| Change Impact Clarity | 76 | 1 | Findings carry recommendations. Proposed changes stay advisory until commit validation. |
| Data Consistency | 86 | 2 | Golden manifest is the run of record. |
| Architectural Integrity | 88 | 3 | Orchestration lives in Application. Tenant isolation is database-per-tenant. |
| Security | 82 | 3 | Auth, tenant scope, and redaction paths are in the shipping host. |
| Reliability | 78 | 2 | Outbox, health, and budget cutoffs exist. |
| Maintainability | 80 | 2 | Solution filters and product-line splits are documented. |
| Explainability | 80 | 2 | Structured explanations and citation gates. |
| Azure Compatibility and SaaS Deployment Readiness | 78 | 2 | Hosted Terraform wires OpenAI, Search, Key Vault, and workload RBAC. Daily use still needs owner-applied tfvars. |
| Availability | 76 | 1 | Host health endpoints. No customer SLO in this score. |
| Performance | 74 | 1 | No new field p75 in this pass. |
| Scalability | 76 | 1 | Paging and tenant databases. |
| Supportability | 74 | 1 | Runbooks and admin diagnostics exist. |
| Manageability | 76 | 1 | Admin configuration pages exist. |
| Deployability | 80 | 1 | Terraform root and CI corset. |
| Observability | 78 | 1 | Platform diagnostics and agent quality metrics. |
| Testability | 85 | 1 | First-review prerequisite and first-review axe tests extend the agent-output gates scored above. |
| Modularity | 86 | 1 | Product lines share the API without a second orchestrator. |
| Extensibility | 76 | 1 | No public plugin SDK, not deducted as a V1 miss. |
| Evolvability | 80 | 1 | ADR set still describes the seams. |
| Documentation | 82 | 1 | Scope, deferred list, and trust center match the boundaries checked here. |
| Azure Ecosystem Fit | 88 | 1 | Hosted path is Azure OpenAI, AI Search, Key Vault, and Azure storage. |
| Cost-Effectiveness | 78 | 1 | OpenAI budget Terraform and agent budget gates. |

## What moved on this tree

| Change on `master` (since 2026-11-02 21:41 desk) | SecureNow | ArchLucid |
|---|---|---|
| Rank next-stored context on rank + explanation (#6062, #6073) | Cutting-edge 74 → 76; explainability 76 → 78 | — |
| Home + cloud connections Reader role and subscription scope (#6069, #6073) | Adoption friction 70 → 74; customer self-sufficiency 64 → 66 | — |
| Stop → draft ITSM / finding export handoff (#6068, #6073) | Workflow 72 → 76; sponsor visibility 76 → 78; decision velocity 76 → 78 | — |
| Investigation-effort audit honesty (#6064) | Proof-of-ROI 68 → 70 | — |
| First-review guide jest-axe (#6068) | Accessibility 74 → 76 | Accessibility 68 → 72 |
| Expanded unit tests (#6062–#6073) | Testability 80 → 82 | Testability 84 → 85 |

## Most important truth

Pragmatic UI lifts through **#6073** are on `master`. They improve honest operator copy and draft handoffs; they do not create a Reader capture or a customer path. SecureNow headline readiness is still capped by fixture-first time-to-value until an owner-controlled subscription produces stored paths. ArchLucid is still capped by sealing a tenant review after sample and pack selection.

## What is worth doing next

Do not reopen FS-09 collection copy, Stop ITSM handoff, rank context in explanation, or first-review axe as if they were still absent.

1. **Leave `PathRankingEngine` alone.** Cutting-edge deficiency remains the largest SecureNow weighted gap and it is not a missing ranker.
2. **Treat a real Reader capture as owner work.** Time-to-value stays high until a subscription the owner controls produces a non-fixture path.
3. **If sponsor disposition must survive a second browser,** persist Proceed / Extend / Stop on the server audit path. Browser storage remains the honest limit for weight 4 and weight 2.

Hold owner walks, public prices, SOC 2 CPA, and pen-test publication. They are `(B)`.

## Pending questions

- Should a saved sponsor disposition become a tenant audit event, or stay browser-local on purpose?
- After sample and policy pack are selected, should the first-review guide stop at that sentence, or name the next walkthrough step in the same block?
