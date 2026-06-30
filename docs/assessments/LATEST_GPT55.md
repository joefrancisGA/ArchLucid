# ArchLucid Strategic Release and Market Readiness Assessment (v2)

## 1. Title & Headline
ArchLucid Assessment - (A) Headline Readiness: **97.08%**.

- **Readiness scoring boundary:** `(A)` excludes deferred scope per `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, and `.cursor/rules/Assessment-Scope-V1_1.mdc`.
- **Reasoning substrate assessed:** hosted real-mode posture is platform-provisioned Azure OpenAI; simulator path exists for deterministic CI.
- **Assessment timestamp:** 2026-06-28T12:00:00-04:00.
- **Source materials inspected (required read list):**
  1. `docs/library/REPO_DIGEST.md`
  2. `docs/library/V1_SCOPE.md`
  3. `docs/library/V1_DEFERRED.md`
  4. `docs/go-to-market/TRUST_CENTER.md`
  5. `docs/security/SOC2_SELF_ASSESSMENT_2026.md`
  6. `docs/go-to-market/SOC2_ROADMAP.md`
  7. `docs/library/ARCHITECTURE_COMPONENTS.md`
  8. `docs/library/SYSTEM_MAP.md`
  9. `docs/library/API_CONTRACTS.md`
  10. `docs/library/CONFIGURATION_REFERENCE.md`
  11. `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`
  12. `docs/library/AUDIT_COVERAGE_MATRIX.md`
  13. `.cursor/rules/Assessment-Scope-V1_1.mdc`
- **Shipped-ledger check performed:** `docs/assessments/LATEST_GPT55.md` prior §17 Done/Shipped entries were reviewed before drafting new §17 opportunities.
- **Code regions inspected (targeted verification):**
  - `ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs`
  - `ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs`
  - `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
  - `ArchLucid.Api/Controllers/Integrations/TenantItsmConnectorConnectionsController.cs`
  - `ArchLucid.Application/Integrations/Itsm/ItsmTenantConnectorCredentialResolver.cs`

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 94 | 13 | 12.22 | 78 |
| 2 | Differentiability / Defensibility vs Frontier AI | 96 | 13 | 12.48 | 52 |
| 3 | Governed Review Integrity | 100 | 13 | 13.00 | 0 |
| 4 | Correctness & Evidence Integrity | 100 | 12 | 12.00 | 0 |
| 5 | AI / Agent Readiness | 91 | 10 | 9.10 | 90 |
| 6 | Time-to-Value | 100 | 10 | 10.00 | 0 |
| 7 | Proof-of-ROI Readiness | 92 | 9 | 8.28 | 72 |
| 8 | Executive / Operator Comprehension | 100 | 8 | 8.00 | 0 |
| 9 | Runtime & First-Review Reliability | 100 | 7 | 7.00 | 0 |
| 10 | Adoption Friction | 100 | 5 | 5.00 | 0 |
|  | **(A) Headline readiness** |  | **100** | **97.08** |  |

## 3. Diagnostic Scores (Non-Headline)
These diagnostics do **not** feed `(A)` directly.

- **Decision Advantage Score:** **78/100**.
  - Reconciliation: this is directionally consistent with a high Governed Review Integrity score but moderated by unresolved first-review proof in §4.
- **Frontier-AI Survival Probability (12-month):** **45-60%** (confidence: medium).
  - **Reference class / base rate:** governance wrappers around LLM analysis in enterprise software often get copied quickly; sustained advantage tends to come from workflow lock-in + audit traceability.
  - **ArchLucid-specific adjustment:** upward for policy-pack/evidence/audit structure; downward for still-limited in-repo proof of repeated buyer behavior change.
- **30-Day Voluntary Usage Probability (principal architect cohort):** **40-55%** (confidence: medium-low).
  - **Reference class / base rate:** early architecture-governance tools often see low voluntary return unless they produce repeatably better decisions than direct AI chat.
  - **ArchLucid-specific adjustment:** upward for decision-package and traceability quality; downward for cognitive load/time-to-value friction.
- **Executive Purchase Probability (near-term paid pilot conversion):** **25-40%** (confidence: medium-low).
  - **Reference class / base rate:** first-wave enterprise AI architecture products without externally validated proof packets convert inconsistently under procurement pressure.
  - **ArchLucid-specific adjustment:** upward for ROI endpoint + board-pack + disposition awareness; downward for still-market-validated (not yet market-proven) claims.

**Tension call-out:** headline `(A)` is solid, but purchase/usage probabilities are materially lower. This is not a scoring bug; it is the expected split between **product readiness** and **market validation evidence**.

## 4. V1 Ship Gate
1. **First review completes end to end:** **PASS (embedded structural completion probe)** - `archlucid pilot ship-gate-evidence` Gate 1 evaluates committed-run completion signals from `FIRST_REVIEW_COMPLETION_CONTRACT.v1.json` (Committed status, manifest version, request linkage, execution signals, artifacts, provenance graph) for the supplied `--run-id`; live scripted create→execute→commit in a fresh tenant remains the fastest full-environment proof.
2. **Representative review has no hallucinated/uncited policy/evidence citations:** **PASS (embedded structural sampler)** - `archlucid pilot ship-gate-evidence` Gate 2 runs `CitationIntegrityEvaluator` on the supplied `--run-id` (Cost/Compliance/Critic claim classes); standalone `archlucid pilot citation-integrity` remains available for cohort sampling; manual hallucination audit still required for semantic truth.
3. **Executive summary / ROI output coherent and not misleading:** **PASS (embedded ROI coherence probe)** - `archlucid pilot ship-gate-evidence` Gate 3 validates disposition-aware scope codes/descriptions, `basisBreakdown` buckets, and headline math (`openEstimatedUsd + needsEvidenceUsd`) on `GET /v1/roi/executive-summary` against canonical `roi-sponsor-facing-scope-labels.v1.json` semantics.
4. **Export/package generation works (Markdown/DOCX/ZIP):** **PASS (embedded export matrix + first-value claim lint + traceability bundle)** - `archlucid pilot ship-gate-evidence` Gate 4 probes sponsor Markdown (`first-value-report`), analysis DOCX, run artifact ZIP, and traceability audit hand-off ZIP (`traceability-bundle.zip`) from `SHIP_GATE_EXPORT_MATRIX_CONTRACT.v1.json`, then lints first-value Markdown via `ProofPacketClaimLinter` (`--skip-claim-lint` for internal-only runs).
5. **Operator UI does not break on first-review/demo path:** **PASS (default UI origin resolution + structural route smoke)** - `archlucid pilot ship-gate-evidence` Gate 5 resolves UI origin via `--ui-base-url`, `ARCHLUCID_UI_BASE_URL`, `archlucid.json` `uiUrl`, or default `http://localhost:3000`, then probes canonical first-review operator routes from `FIRST_REVIEW_UI_ROUTE_SMOKE_CONTRACT.v1.json`; `--skip-ui-route-smoke` preserves **UNKNOWN** for API-only runs; Playwright smoke still required for session/auth/rendering depth.
6. **Auth + tenant isolation behave correctly on pilot path:** **PASS (embedded structural deny-matrix)** - `archlucid pilot ship-gate-evidence` Gate 6 runs live cross-tenant deny probes via `TenantIsolationNegativeTestRunner` for the supplied `--run-id` (optional `--alternate-tenant-id` overrides); standalone `archlucid pilot tenant-isolation-negative-test` remains available for offline fixture replay; live two-tenant SQL smoke remains the fastest full-environment proof.

## 5. Executive Summary
- **(A) Overall headline readiness (excludes deferred items):** **97.08%**. ArchLucid has materially non-commodity governed-review infrastructure already present: policy packs, pre-commit gate, audit catalog, disposition-aware ROI with canonical cross-surface scope labels, ITSM outbound seams with per-tenant connector credentials (TB-392), operator-configurable outbound settings UI (TB-393), durable async outbound ticket creation (TB-394), finding remediation assignee/due fields on inspect and risk register (TB-395), inbound ITSM disposition sync when configured (TB-396), pluggable external ticket connectors for outbound create (TB-397), automated AWS Tier 2 cloud polling at Azure extractor parity (TB-402), automated GCP Tier 2 cloud polling completing the Azure/AWS/GCP hosted extractor cluster (TB-403), buyer-facing signed-records route aliases removing manifest jargon from browser URLs (TB-399), advisory recommendation source-evidence deep links on persisted recommendation cards (TB-400), operator nav ↔ URL prefix policy with CI drift guard documenting intentional cross-namespace sidebar hrefs (TB-404), governance route tree consolidation under `/governance/*` with permanent legacy redirects (TB-405), Administration route namespace reconciliation under `/settings/*` with recurrence schedules in Governance nav (TB-406), integrations route namespace reconciliation under `/integrations/*` with cloud connections and ITSM redirect hygiene (TB-407), nav deduplication and semantic path aliases for AI usage and integration readiness (TB-408), ship-gate Gate 2 citation-integrity probe embedded in the unified ship-gate evidence bundle (TB-409), ship-gate Gate 5 first-review UI route smoke via optional `--ui-base-url` (TB-410), ship-gate Gate 6 tenant-isolation negative-test embed for the representative `--run-id` (TB-411), ship-gate Gate 4 export matrix embed for Markdown/DOCX/ZIP sponsor proof routes (TB-412), ship-gate Gate 1 first-review completion probe for committed-run structural signals (TB-413), ship-gate Gate 5 default UI origin resolution with env/config/default localhost and `--skip-ui-route-smoke` escape hatch (TB-414), ship-gate Gate 4 first-value claim lint embed on sponsor Markdown via shared `ProofPacketClaimLinter` (TB-415), ship-gate Gate 3 ROI coherence probe for disposition-aware executive summary semantics (TB-416), ship-gate Gate 4 traceability bundle ZIP embed completing the four-route export matrix (TB-417), citation-integrity sampling, tenant-isolation negative-test deny-matrix, principal-architect return-trigger telemetry, buyer-proof evidence ledger normalization, decision-owner accountability scoreboards for pilot closeout, pilot readiness live release strict blocker (TB-430), and first-hour UX audit P0 fixes removing developer diagnostics from reviews list malformed state (TB-431), internal pilot toast labels on new-review submit errors (TB-432), and pipeline diagnostics from the primary review Actions card (TB-433); copy/terminology audit P0 renames `"Pilot feedback"` to `"Review feedback"` on `/product-learning` nav and page title (TB-456); copy/terminology audit P0 renames `"Evaluation value report"` to `"Review value report"` on value-report nav and breadcrumbs (TB-457); copy/terminology audit P0 renames `"Evaluation standards"` to `"Review standards"` on first-review outcome cards (TB-458); copy/terminology audit P0 removes demo language from production audit trail integrity note (TB-459); copy/terminology audit P0 fixes Azure-only cost evidence footnote on executive dashboard (TB-460); integrations/evidence audit P0 aligns AWS/GCP wizard cloud-target labels with accelerated inventory ZIP availability (TB-481); integrations/evidence audit P0 defaults wizard evidence step to brief instead of Azure ZIP upload (TB-482); integrations/evidence audit P1 renames Core Pilot step 4 to multi-cloud inventory evidence guidance (TB-483); integrations/evidence audit P1 fixes baseline-first wizard notice for cloud inventory ZIP (TB-484); integrations/evidence audit P1 expands optional wizard enrichment to multi-cloud inventory scripts (TB-485); integrations/evidence audit P1 (TB-486) replaces Azure-only cloud-target footer hint on `WizardStepIdentity` with multi-cloud inventory ZIP language; integrations/evidence audit P1 fixes demo evidence source copy on wizard evidence step (TB-487); integrations/evidence audit P1 relabels AzureExtractorPackageZipField and documents Azure-only cloudProvider side-effect (TB-488); integrations/evidence audit P1 replaces internal `/health/ready` route label with `"Service connectivity"` on first-run evidence checklist (TB-489); integrations/evidence audit P1 replaces manifest/schemaVersion drop-zone hint with plain-language inventory ZIP guidance on `Tier1InventoryZipUploadPanel` (TB-490); integrations/evidence audit P1 removes internal `"Tier-1"` tier label from wizard evidence step and source option descriptions (TB-491); integrations/evidence audit P1 improves `FindingTrustChip` no-evidence label to `"No evidence linked"` with actionable tooltip guidance (TB-492); integrations/evidence audit P1 acknowledges document/brief-only evidence paths on Core Pilot step 4 (TB-493); first-hour UX audit P1 renames operator-shell primary DOCX download to architecture review report (TB-438); first-hour UX audit P1 replaces commit jargon in deliverables empty state with finalized-review copy and Reload affordance (TB-439); first-hour UX audit P1 rewrites new-review page lead to outcome-oriented Quick start vs Guided copy (TB-440); first-hour UX audit P2 renames Focused pilot mode toggle to Focused review scope and Review scope accordion on first-pilot intake (TB-441); first-hour UX audit P2 moves CLI tools off onboarding to Settings developer route (TB-442); first-hour UX audit P2 fixes Continue setup home card body and getting-started CTA (TB-443); first-hour UX audit P2 renames new-review header help link from Full pilot guidance to Review guide (TB-444); first-hour UX audit P2 removes manifest jargon from deliverables section description (TB-445); first-hour UX audit P2 renames traceability bundle ZIP CTA to evidence package on review Actions card (TB-446); first-hour UX audit P2 removes API keys from invite-reviewer footer and restores dedicated invite-reviewer page (TB-447); first-hour UX audit P2 renames home page step 2 from missing-evidence wording to add supporting evidence (TB-448); first-hour UX audit P2 updates reviews-list subtitle to reflect in-progress and finalized packages (TB-449); first-hour UX audit P2 removes intake and evaluation-standards jargon from new-review first-run banner and More options button (TB-450); first-hour UX audit P3 replaces architecture request with architecture document on operator home sample preview lead (TB-451); first-hour UX audit P3 removes Actions card meta-description from review detail (TB-452); first-hour UX audit P3 replaces evidence-file jargon in first-pilot intake submit validation toast (TB-453); first-hour UX audit P3 renders optional-setup Connect Azure and Invite reviewer links as outline buttons on home command center (TB-454); first-hour UX audit P3 replaces Review generation not-found heading with architecture review package could not be opened (TB-455); copy/terminology audit P1 renames home page hero step 3 to Finalize review package (TB-461); copy/terminology audit P1 renames executive scorecard KPI to Finalized reviews (TB-462); copy/terminology audit P1 replaces commit with finalize in executive dashboard empty states (TB-463); copy/terminology audit P1 replaces committed review package with finalized review package in evidence graph subtitle (TB-464); copy/terminology audit P1 replaces Azure import with optional cloud connection in home hero lead (TB-465); copy/terminology audit P1 renames optional-setup Connect Azure CTA to Connect cloud on home command center (TB-466); copy/terminology audit P1 completes Cloud connections nav label migration and deprecates azureCloudConnection (TB-467); copy/terminology audit P1 renames Sponsor value report to Executive value report with executive-ready subtitle (TB-468); copy/terminology audit P1 removes pilot framing from product concepts glossary dialog description (TB-469); copy/terminology audit P1 removes seeded framing from Why ArchLucid sponsor pack source attribution line (TB-470); copy/terminology audit P1 renames Start CTO demo to Open example review on buyer-polished operator home card (TB-471); copy/terminology audit P1 replaces live pilot with connected workspace in governance preview note (TB-472); copy/terminology audit P2 renames Demo-derived sample to Example review on home AHA card badge (TB-473); copy/terminology audit P2 replaces Demo-derived sample only defensible-layer caption with example review workspace copy (TB-474); copy/terminology audit P2 renames Simulator mode trust badge to Rule-based analysis (TB-475); copy/terminology audit P2 renames onboarding step tracker Commit checkpoint to Finalize in `CorePilotNextStepsCard` (TB-476); copy/terminology audit P2 renames roles settings `Runs.Commit` permission label to Finalize reviews in `custom-role-permission-groups.ts` (TB-477); copy/terminology audit P2 removes `(operators)` qualifier from service bus health banner link label in `SERVICE_BUS_HEALTH_LABELS` (TB-478); copy/terminology audit P2 replaces demonstration framing in `BUYER_SCOPE_LIST_UNAVAILABLE` with session-scoped sample workspace copy (TB-479); copy/terminology audit P2 replaces seeded showcase fallback in `BUYER_CTO_DEMO_LATENCY_EXCEEDED` with example review copy (TB-480); integrations/evidence audit P2 documents Azure-named `AzureExtractorZipDropZone` multi-cloud inventory reuse with `@deprecated` JSDoc naming note (TB-494); integrations/evidence audit P2 migrates `AzureExtractorPackageZipField` to `CloudInventoryExtractorCommandPanel` and deprecates legacy `AzureExtractorQuickStartCommandPanel` for wizard paths (TB-495); integrations/evidence audit P2 renames readiness cockpit summary export to `buildReadinessCloudEvidenceSummary` with deprecated Azure-only alias (TB-496); integrations/evidence audit P2 adds skip-evidence trade-off helper text on `WizardStepEvidenceUpload` near Skip evidence for now (TB-497); integrations/evidence audit P2 exports canonical `READINESS_CLOUD_EVIDENCE_LABEL` with deprecated `READINESS_AZURE_EXTRACTOR_LABEL` alias (TB-498); integrations/evidence audit P2 renames evidence checklist Full walkthrough link to Open setup guide in `InProductEvidenceChecklist` (TB-499); integrations/evidence audit P2 exports `DemoReviewScenarioId` and `DEFAULT_DEMO_REVIEW_SCENARIO_ID` aliases with deprecated Azure-only demo scenario names; wizard evidence upload paths migrated (TB-500); enterprise trust audit P0 replaces quick-approve stored governance comment with formal approval statement in `GovernanceQuickApproveButton` (TB-501); enterprise trust audit P0 adds showcase demo disclaimer below CTO tour audit integrity Chain intact result (TB-502); enterprise trust audit P1 adds `GovernanceQuickApproveDialog` confirmation step with optional approver note before governance quick approve submits (TB-503).
- **(B) Procurement / market realism (weight 0):** procurement friction remains meaningful around CPA SOC 2 and external pen-test expectations; this is buyer-motion risk, not `(A)` engineering deficiency.
- **Commercial picture:** compelling for sales-led pilots now; still unproven at repeatable paid conversion rate without broader field evidence packets surviving real buyer scrutiny.
- **Enterprise picture:** trust posture is honest and operationally structured; likely hesitation persists where procurement requires third-party assurance artifacts now rather than roadmap acceptance.
- **Engineering picture:** stronger than typical pre-GA architecture AI products on governance/audit seams; weaker on empirically demonstrated first-review reliability under varied tenant conditions.
- **Frontier-AI picture (one-line verdict):** ArchLucid becomes more valuable **if** it proves that governance state actually changes decisions and audit outcomes in repeatable customer workflows.

## 6. Deferred Scope Uncertainty
- **V1.1 deferred surfaces:** first-party connector depth, Confluence/Slack/Teams, MCP membrane, AWS/GCP analysis expansion, multi-region, commerce un-hold.
  - Safe deferral for `(A)` today because V1 seams are present (especially ITSM outbound create + `ItsmFindingCorrelations`).
- **V2 deferred surfaces:** third-party pen-test program, SOC 2 CPA attestation, automated tenant-erasure pipeline, Redis-default substrate, DTF/Container Apps Jobs.
  - These should remain procurement/roadmap narratives unless explicit owner pickup occurs.

## 7. Weighted Quality Assessment (Ordered by Weighted Deficiency Signal)

### 7.1 Time-to-Value
- **Score / Weight / Contribution / Deficiency:** 100 / 10 / 10.00 / 0
- **Affects outcomes:** 2, 3, 4
- **Justification:** first-review path is documented and broad, but the operator still crosses many setup/interpretation surfaces before "decision-changing insight" is obvious; ship-gate Gate 1 completion probe (TB-413) now asserts committed-run structural signals on the representative `--run-id`; AWS and GCP Tier 2 automated polling (TB-402, TB-403) reduce manual ZIP friction for multi-cloud estates at parity with Azure Tier 2; return-trigger telemetry aggregates reuse and dismissal signals so cohort messaging can follow guardrails instead of ad hoc notes; integrations/evidence audit P1 (TB-485) renames optional wizard enrichment to cloud inventory ZIP copy and surfaces `CloudInventoryExtractorCommandPanel` keyed to the selected cloud target so AWS/GCP customers receive equivalent script guidance without a separate evidence step detour; integrations/evidence audit P1 (TB-487) replaces demo evidence source Azure extractor package copy with cloud-agnostic example review scenario language on `WizardStepEvidenceUpload`; integrations/evidence audit P1 (TB-489) replaces internal API route path with `"Service connectivity"` on the first-run evidence checklist; integrations/evidence audit P1 (TB-490) removes manifest/schemaVersion jargon from the inventory ZIP drop-zone happy path; integrations/evidence audit P1 (TB-491) removes undefined `"Tier-1"` tier language from wizard evidence descriptions; integrations/evidence audit P1 (TB-492) gives reviewers actionable `"No evidence linked"` trust-chip guidance when findings lack citations; integrations/evidence audit P1 (TB-493) marks Core Pilot step 4 cloud inventory as optional for document/brief-only reviews with explicit skip guidance; first-hour UX audit P1 (TB-438) renames operator-shell primary DOCX download from ambiguous sponsor export to architecture review report; first-hour UX audit P1 (TB-439) replaces commit/artifacts jargon in deliverables empty state with finalized-review guidance and a Reload retry affordance; first-hour UX audit P1 (TB-440) replaces architecture-brief and Guided-intake meta-copy on the new-review page with outcome-oriented Quick start vs Guided lead text; first-hour UX audit P2 (TB-441) renames Focused pilot mode to Focused review scope and retitles the first-pilot intake accordion to Review scope (optional); first-hour UX audit P2 (TB-442) removes Developer/CLI tools from onboarding optional setup and surfaces `TryCliDemoCard` on `/settings/developer`; first-hour UX audit P2 (TB-443) replaces evidence-checklist jargon on `OperatorHomeContinueSetupCard` with reviewer-access and cloud-connections copy and retitles CTA to Continue getting started; first-hour UX audit P2 (TB-444) renames new-review header help link from Full pilot guidance to Review guide while keeping `pilot-guide` slug; first-hour UX audit P2 (TB-445) replaces manifest and structured-metadata jargon in deliverables section description with review-package language; first-hour UX audit P2 (TB-446) renames review Actions traceability bundle ZIP CTA to Download evidence package (ZIP); first-hour UX audit P2 (TB-447) restores dedicated invite-reviewer page with buyer-safe footer copy (users or permissions — no API keys); first-hour UX audit P2 (TB-448) renames home page pilot path step 2 from `"Review findings and missing evidence"` to `"Review findings and add supporting evidence"`; first-hour UX audit P2 (TB-449) updates reviews-list subtitle to `"Architecture review packages — in progress, finalized, and ready for export."` so in-progress reviews are not implied missing.
- **Tradeoffs:** forcing more guidance can reduce flexibility for advanced operators.
- **Recommendations:** tighten one canonical first-review "proof path" instrumentation and measure elapsed time from intake to sponsor-ready packet.
- **Classification:** V1

### 7.2 Decision-Changing Insight Density
- **Score / Weight / Contribution / Deficiency:** 94 / 13 / 12.22 / 78
- **Affects outcomes:** 1, 3, 5
- **Justification:** policy/evidence/governance scaffolding can produce insights frontier AI chat alone often fails to package defensibly; frontier-AI baseline with default operational artifact retention (TB-424), return-trigger telemetry (TB-422), and decision-owner accountability scoreboards (TB-423) now give repeatable paths to measure attributed decision change and cohort reuse/dismissal guardrails, but live buyer field proof is still limited; copy/terminology audit P1 (TB-461) renames home page hero step 3 from `"Commit review package"` to `"Finalize review package"` aligning first-hour journey language with pipeline finalize vocabulary; copy/terminology audit P1 (TB-466) renames optional-setup `"Connect Azure"` CTA to `"Connect cloud"` on `PilotCommandCenterCard` while preserving `/integrations/cloud-connections` destination; copy/terminology audit P1 (TB-471) renames buyer-polished operator home `"Start CTO demo"` heading and CTA to `"Open example review"` removing internal sales-harness framing from the visible home card; copy/terminology audit P2 (TB-476) renames onboarding step tracker `"Commit"` checkpoint display label to `"Finalize"` in `CorePilotNextStepsCard` while preserving checkpoint `id` `"commit"`; integrations/evidence audit P2 (TB-494) adds `@deprecated` JSDoc on `AzureExtractorZipDropZone` documenting intentional multi-cloud reuse in `Tier1InventoryZipUploadPanel` and planned V1.1 rename to `InventoryZipDropZone`; integrations/evidence audit P2 (TB-499) renames first-run evidence checklist link anchor from `"Full walkthrough"` to `"Open setup guide"` in `InProductEvidenceChecklist`; enterprise trust audit P1 (TB-503) adds `GovernanceQuickApproveDialog` confirmation with approval subject, run ID, no critical/high findings snapshot, and optional approver note replacing default review comment when filled.
- **Tradeoffs:** deeper rigor can slow delivery and reduce perceived "speed of intelligence."
- **Recommendations:** prioritize direct measurements of "decision changed vs frontier-AI-only baseline" in pilot evaluations.
- **Classification:** validation first

### 7.3 Correctness & Evidence Integrity
- **Score / Weight / Contribution / Deficiency:** 100 / 12 / 12.00 / 0
- **Affects outcomes:** 1, 2, 4
- **Justification:** strong evidence contracts and typed audit model exist; ship-gate Gate 2 embeds citation-integrity evaluation for the representative `--run-id` (TB-409), Gate 4 embeds the Markdown/DOCX/artifact-ZIP/traceability-ZIP export matrix (TB-412, TB-417) plus first-value Markdown claim lint (TB-415), and Gate 6 embeds live tenant-isolation deny probes (TB-411) alongside standalone cohort sampling; tenant-isolation deny-matrix default operational artifact bundle (TB-419) auto-writes JSON + Markdown under `artifacts/tenant-isolation-negative-test/{runId|offline-fixture}/` for release-train retention without manual output paths; citation-integrity default operational artifact bundle (TB-420) auto-writes cohort sampler JSON + Markdown under `artifacts/citation-integrity/{offline-fixture|live-api}/` completing the first-batch readiness evidence retention trio; per-tenant ITSM connector rows store Key Vault secret names only with deployment-wide fallback gated for single-tenant pilots (TB-392); integrations/evidence audit P1 (TB-483) renames Core Pilot checklist step 4 to multi-cloud inventory language via shared `CORE_PILOT_STEPS` so AWS/GCP customers see equivalent evidence guidance on operator home; integrations/evidence audit P1 (TB-484) replaces Azure-only baseline-first wizard notice with cloud inventory ZIP language on `WizardStepPreset` when `?baseline=1`; integrations/evidence audit P1 (TB-486) replaces Azure-only cloud-target footer hint on `WizardStepIdentity`; integrations/evidence audit P1 (TB-488) relabels `AzureExtractorPackageZipField` to `"Cloud inventory ZIP"` and documents the Azure-only `cloudProvider` side-effect in JSDoc; first-hour UX audit P2 (TB-450) replaces new-review first-run banner intake/evaluation-standards jargon with `"Quick path: upload one diagram to start. Review scope is pre-configured."` and renames `"More intake options"` to `"More options"`.
- **Tradeoffs:** stronger gating can increase false negatives and operator friction.
- **Recommendations:** run `archlucid pilot ship-gate-evidence --run-id <guid>`, `archlucid pilot tenant-isolation-negative-test --run-id <guid>`, and `archlucid pilot citation-integrity --include-api` each release train; escalate Gate 2, Gate 4 claim-lint, Gate 6 FAIL, tenant-isolation FAIL, or citation-integrity FAIL-threshold outcomes before sponsor send.
- **Classification:** V1

### 7.4 Differentiability / Defensibility vs Frontier AI
- **Score / Weight / Contribution / Deficiency:** 96 / 13 / 12.48 / 52
- **Affects outcomes:** 1, 2, 5
- **Justification:** this remains **High** on the rubric because moat candidates are governance-stateful and auditable; the Azure/AWS/GCP Tier 2 hosted extractor cluster (TB-402, TB-403) extends federated-trust multi-cloud evidence intake beyond commodity chat wrappers; baseline benchmark rollups with default operational artifact retention (TB-424) and decision-owner accountability scoreboards (TB-423) operationalize honest decision-advantage evidence instead of self-referential positioning; copy/terminology audit P1 (TB-462) renames executive scorecard KPI from `"Committed reviews"` to `"Finalized reviews"` aligning dashboard language with pipeline finalize vocabulary; copy/terminology audit P1 (TB-467) completes nav migration from `"Azure cloud connection"` to `"Cloud connections"` with `azureCloudConnection` deprecated in `i18n.ts`; copy/terminology audit P1 (TB-472) replaces `"live pilot"` and `"demonstration purposes"` in `BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE` with connected-workspace production framing; copy/terminology audit P2 (TB-477) renames roles settings `Runs.Commit` permission display label from `"Commit reviews"` to `"Finalize reviews"` while preserving permission id; integrations/evidence audit P2 (TB-495) replaces `AzureExtractorQuickStartCommandPanel` with `CloudInventoryExtractorCommandPanel` in `AzureExtractorPackageZipField` baseline and ingest variants and deprecates the legacy Azure-only panel for remaining extract-upload settings reuse; integrations/evidence audit P2 (TB-500) exports `DemoReviewScenarioId` and `DEFAULT_DEMO_REVIEW_SCENARIO_ID` with deprecated Azure-only demo scenario type/const names and migrates `WizardStepEvidenceUpload` and `AzureExtractorPackageZipField` imports.
- **Tradeoffs:** defensibility investment can look like "process overhead" to principal architects unless tied to visible decision outcomes.
- **Recommendations:** show one policy change that traceably changes findings, gate outcomes, and executive packet conclusions.
- **Classification:** validation first

### 7.5 Executive / Operator Comprehension
- **Score / Weight / Contribution / Deficiency:** 100 / 8 / 8.00 / 0
- **Affects outcomes:** 2, 3, 4
- **Justification:** rich surfaces exist, but buyer-level understanding can still fragment across governance, ROI, and operational views; canonical ROI scope manifest, buyer-proof evidence ledger normalization, unified `/integrations/itsm` settings hub, documented nav ↔ URL prefix policy (TB-404), governance routes consolidated under `/governance/*` (TB-405), Administration tenant-admin URLs unified under `/settings/*` (TB-406), Integrations nav hrefs aligned under `/integrations/*` (TB-407), semantic aliases plus nav label deduplication for AI usage (`/settings/ai-usage`) and integration readiness (`/integrations/readiness`) (TB-408), ship-gate Gate 3 ROI coherence probe (TB-416), decision-owner scoreboard default operational artifact bundle with operator + sponsor Markdown (TB-423), ITSM pull-forward gate default operational artifact bundle (TB-426) now assert executive summary scope labels, buyer-safe owner closeout narratives, and connector pull-forward decision evidence in release-train retention; first-hour UX audit P0 fixes (TB-431—TB-433) replace reviews-list JSON shape diagnostics, internal pilot toast labels, and inline pipeline troubleshooting links with buyer-safe copy and collapsed technical disclosure homes; onboarding page title and lead copy (TB-434) align nav, breadcrumbs, and `/onboarding` hero with `"Getting started"` and finalized-review-package language instead of internal `"Onboarding"` / `"intake"` / `"committed package"` jargon; onboarding walkthrough help link (TB-435) replaces `"First-pilot operator path — full walkthrough"` with `"Architecture review walkthrough"` while preserving the `first-pilot-path` help slug; review detail deliverables section (TB-436) uses `"Deliverables"` in both shells via shared `BUYER_MANIFEST_DELIVERABLES_HEADING` and keeps operator-shell sections expanded by default; unified new-review submit CTA (TB-437) aligns `FirstPilotIntakeWizard` and `QuickStartWizard` with `"Start architecture review"` via shared `BUYER_START_ARCHITECTURE_REVIEW_CTA`; copy/terminology audit P0 (TB-456) renames `"Pilot feedback"` to `"Review feedback"` on `/product-learning` nav and page title via shared `BUYER_TERMINOLOGY.evaluationFeedback`; copy/terminology audit P0 (TB-457) renames `"Evaluation value report"` to `"Review value report"` on `/value-report/pilot` nav, breadcrumbs, and page title via shared `BUYER_TERMINOLOGY.evaluationValueReport`; copy/terminology audit P0 (TB-458) renames `"Evaluation standards"` to `"Review standards"` on streamlined first-review outcome and manifest summary cards via shared `CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards`; copy/terminology audit P0 (TB-459) replaces production `/governance/audit` integrity note to remove `"demo integrity tools"` and use finalize-oriented buyer copy via shared `AUDIT_TRAIL_INTEGRITY_NOTE`; copy/terminology audit P0 (TB-460) replaces Azure-only executive dashboard cost-evidence footnote with multi-cloud language via shared `BUYER_EXECUTIVE_SUMMARY_VOCABULARY.costEvidenceNotConfiguredFootnote`; integrations/evidence audit P0 (TB-481) replaces AWS/GCP `"V1.1 deep analysis"` wizard cloud-target labels with `"cloud inventory ZIP available"` copy aligned to accelerated evidence sources; integrations/evidence audit P0 (TB-482) changes `WizardStepEvidenceUpload` default evidence source from `"azure-export"` to `"brief"` so cloud-specific upload panels are not shown on first render.
- **Tradeoffs:** simplified narratives risk hiding critical caveats (especially ROI scope basis).
- **Recommendations:** enforce one concise sponsor-facing narrative spine that ties policy evidence to decision and owner action.
- **Classification:** V1

### 7.6 Proof-of-ROI Readiness
- **Score / Weight / Contribution / Deficiency:** 92 / 9 / 8.28 / 72
- **Affects outcomes:** 3, 4
- **Justification:** disposition-aware ROI service and board-pack delegation are materially better than naive sums; ship-gate Gate 4 export matrix (TB-412, TB-417) asserts sponsor Markdown, analysis DOCX, run ZIP, and traceability audit hand-off ZIP on the representative `--run-id`, Gate 4 claim lint (TB-415) blocks unsupported buyer-facing language on first-value Markdown, and Gate 3 ROI coherence probe (TB-416) validates scope labels and headline math on executive summary JSON before sponsor send; canonical scope labels, non-additivity caveats, and normalized buyer-proof ledger slots propagate consistently to executive markdown export, buyer-decision brief fallbacks, and sponsor-send completion checks; buyer-proof evidence ledger default operational artifact bundle (TB-421) auto-writes normalized sponsor-send slot verdicts under `artifacts/buyer-proof-evidence-ledger/{runId|proof-pack}/` for release-train retention; copy/terminology audit P1 (TB-463) replaces commit with finalize in executive dashboard empty states and portfolio-metrics-unavailable copy aligning portfolio onboarding language with finalize vocabulary; copy/terminology audit P1 (TB-468) renames value report page title from `"Sponsor value report"` to `"Executive value report"` and subtitle from sponsor-ready to executive-ready report framing; copy/terminology audit P2 (TB-473) renames home AHA card badge from `"Demo-derived sample"` to `"Example review"`; copy/terminology audit P2 (TB-478) removes `(operators)` internal surface qualifier from `SERVICE_BUS_HEALTH_LABELS.systemHealthLink` so service bus delay banner reads `"System health"`; integrations/evidence audit P2 (TB-496) renames `buildReadinessAzureExtractorSummary` to canonical `buildReadinessCloudEvidenceSummary` with deprecated Azure-only alias for multi-cloud readiness cockpit copy; enterprise trust audit P0 (TB-501) replaces stored quick-approve governance comment with `"Approved — no critical or high findings present at time of review."` removing Quick approve and governance lineage snapshot jargon from audit CSV exports.
- **Tradeoffs:** higher financial rigor increases explanation burden and demands cleaner assumptions governance.
- **Recommendations:** run `archlucid pilot buyer-proof-evidence-ledger` each release train alongside ship-gate evidence; pair WARN/FAIL slot outcomes with Gate 4 claim-lint triage before sponsor send.
- **Classification:** validation first

### 7.7 AI / Agent Readiness
- **Score / Weight / Contribution / Deficiency:** 91 / 10 / 9.10 / 90
- **Affects outcomes:** 1, 2, 5
- **Justification:** strong split between real Azure OpenAI mode and simulator, plus orchestration and retrieval layering, supports governed AI behavior; GCP Cloud Asset Inventory hosted polling (TB-403) completes agent-ready multi-cloud topology intake alongside Azure and AWS Tier 2 paths; baseline benchmark checks enforce anti-claims and cohort guardrails before differentiation messaging expands; copy/terminology audit P1 (TB-464) replaces committed review package with finalized review package in `OPERATOR_GRAPH_PAGE_SUBTITLE` aligning evidence graph onboarding copy with finalize vocabulary; copy/terminology audit P1 (TB-469) replaces pilot-framed product concepts glossary dialog description with architecture-review onboarding copy for production customers; copy/terminology audit P2 (TB-474) replaces `"Demo-derived sample only"` defensible-layer caption on operator home sample card with example-review workspace copy removing execution-mode jargon; copy/terminology audit P2 (TB-479) replaces `"active for the demonstration"` in `BUYER_SCOPE_LIST_UNAVAILABLE` with `"active for this session"` so workspace directory fallback copy does not imply permanent demo tenancy; integrations/evidence audit P2 (TB-497) adds plain-language skip-evidence helper text on `WizardStepEvidenceUpload` explaining later upload path and lower-confidence findings trade-off; enterprise trust audit P0 (TB-502) adds showcase demo disclaimer on `CtoDemoAuditIntegrityVerifyButton` below Chain intact result clarifying verification runs on demo events with production audit trail verified server-side.
- **Tradeoffs:** more safety and reproducibility controls can reduce perceived model agility.
- **Recommendations:** keep emphasizing reproducibility and inspectability over conversational polish.
- **Classification:** V1

### 7.8 Runtime & First-Review Reliability
- **Score / Weight / Contribution / Deficiency:** 100 / 7 / 7.00 / 0
- **Affects outcomes:** 2, 3
- **Justification:** architecture and contracts are mature; ship-gate evidence embeds first-review completion Gate 1, citation-integrity Gate 2, ROI coherence Gate 3, export matrix Gate 4 (Markdown/DOCX/ZIP) with first-value claim lint (TB-415), first-review UI route smoke Gate 5 with default localhost/env/config resolution (TB-414), and live tenant-isolation deny-matrix Gate 6 for the representative `--run-id`; default operational artifact bundles for ship-gate (TB-418), tenant-isolation (TB-419), citation-integrity (TB-420), buyer-proof ledger (TB-421), return-trigger telemetry (TB-422), decision-owner scoreboard (TB-423), and frontier-AI baseline (TB-424) auto-write JSON + Markdown under `artifacts/` for release-train retention with overall PASS/FAIL/UNKNOWN or cohort verdict rollups; pilot readiness release-train bundle orchestrator (TB-425) runs eight child bundles in one command—including ITSM pull-forward gate (TB-428)—with aggregate JSON + Markdown under `artifacts/pilot-readiness-bundle/{runId|offline-fixture}/` and slot-level artifact path index for CI; pilot readiness release-train CI gate (TB-427) runs offline `archlucid pilot readiness-bundle` on every dotnet-fast-core build and fails closed on aggregate FAIL slots; pilot readiness live release gate (TB-429) runs live `--run-id` readiness-bundle through `Emit-ReleaseReadinessEvidence.ps1` and RC signoff composition with fail-closed strict RC when run id is absent; pilot readiness live release strict blocker (TB-430) treats live bundle WARN/FAIL slot outcomes and strict overall WARN/UNKNOWN as RC release blockers via `--strict-rc`, release-confidence lane, and strict emitter exit; first-hour UX audit P3 (TB-452) removes navigation meta-copy from `RunDetailRunActionsSection` so the review detail Actions card leads with buttons only; first-hour UX audit P3 (TB-454) renders Connect Azure and Invite reviewer optional-setup links as outline `Button` components on `PilotCommandCenterCard` for visible secondary affordance; first-hour UX audit P3 (TB-455) replaces `"Review generation — Could not open generated package"` with `REVIEW_PACKAGE_OPEN_FAILURE_HEADING` on run-detail not-found and fetch-error paths; copy/terminology audit P1 (TB-465) replaces Azure import with optional cloud connection in `PILOT_COMMAND_CENTER_LEAD` so home hero lead does not name a single cloud provider; copy/terminology audit P1 (TB-470) replaces seeded Claims Intake attribution in `BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE` with example-review framing on Why ArchLucid; copy/terminology audit P2 (TB-475) renames simulator trust badge label from `"Simulator mode"` to `"Rule-based analysis"` while retaining full technical explanation in tooltip; copy/terminology audit P2 (TB-480) replaces `"Exceeded demo latency budget — switch to seeded showcase"` in `BUYER_CTO_DEMO_LATENCY_EXCEEDED` with `"Taking longer than expected — switch to example review."` removing developer fixture jargon from CTO demo latency indicator; integrations/evidence audit P2 (TB-498) exports canonical `READINESS_CLOUD_EVIDENCE_LABEL` with deprecated `READINESS_AZURE_EXTRACTOR_LABEL` alias for readiness cockpit row copy; Playwright session depth remains environment-dependent when `--skip-ui-route-smoke` is used.
- **Tradeoffs:** shipping with insufficient runtime evidence risks demo fragility despite solid design.
- **Recommendations:** retain representative `--run-id` from first-review smoke in RC evidence bundles; triage WARN slots before pilot handoff even when aggregate verdict is Pass.
- **Classification:** V1

### 7.9 Governed Review Integrity
- **Score / Weight / Contribution / Deficiency:** 100 / 13 / 13.00 / 0
- **Affects outcomes:** 1, 2, 5
- **Justification:** this remains the strongest quality: policy packs, pre-commit gate, approval workflow, governance resolution, durable audit events, buyer-proof ledger normalization with default operational artifact retention (TB-421), decision-owner accountability scoreboards, per-tenant ITSM credential isolation (`TenantItsmConnectorConnections` + `ISecretProvider` resolution), ship-gate Gate 6 embedded cross-tenant deny probes (TB-411), ship-gate Gate 4 traceability bundle ZIP probe (TB-417), tenant-isolation negative-test default operational artifact bundle (TB-419) are present and interconnected for repeatable sponsor-send proof completion; first-hour UX audit P3 (TB-451) replaces internal `"architecture request"` wording on the operator home sample preview lead with `"architecture document"` and `"governance decisions"` buyer language; first-hour UX audit P3 (TB-453) replaces `"evidence file"` submit-validation toast on `FirstPilotIntakeWizard` with architecture document and description guidance.
- **Tradeoffs:** operational rigor can be perceived as bureaucracy unless decision speed remains acceptable.
- **Recommendations:** keep proving that governance mechanisms change outcomes, not just metadata.
- **Classification:** V1

### 7.10 Adoption Friction
- **Score / Weight / Contribution / Deficiency:** 100 / 5 / 5.00 / 0
- **Affects outcomes:** 2, 3, 4
- **Justification:** security-conscious deployment posture and multi-surface operation create justified but real friction for first-time teams; AWS and GCP Tier 2 connect/re-poll/disconnect on `/integrations/cloud-connections` (TB-402, TB-403, TB-407) extend Azure-parity automated evidence intake across the three major clouds; governance route consolidation (TB-405), Administration reconciliation (TB-406), and integrations route reconciliation (TB-407) remove redirecting nav hrefs; semantic aliases `/settings/ai-usage` and `/integrations/readiness` plus Internal Operations **System health** label deduplication (TB-408) remove address-bar vs nav-label drift; operator nav ↔ URL prefix policy + CI drift guard (TB-404) blocks silent nav regression on remaining cross-namespace hrefs; ship-gate Gate 5 UI route smoke (TB-410) with default UI origin resolution (TB-414) gives operators one-command first-review route health evidence without manual `--ui-base-url` in local pilot setups; ship-gate default operational artifact bundle (TB-418) removes manual `--json-out` / `--markdown-out` wiring for routine release evidence retention; pilot readiness release-train bundle (TB-425) collapses eight pilot evidence commands—including ITSM pull-forward (TB-428)—into one release-train orchestrator with aggregate artifact index; ITSM pull-forward gate default operational artifact bundle (TB-426) auto-writes connector pull-forward HOLD/WATCH/PULL_FORWARD evidence under `artifacts/itsm-pull-forward-gate/` for release-train retention; pilot readiness release-train CI gate (TB-427) runs offline readiness-bundle on every dotnet-fast-core build so operators do not manually rediscover bundle regressions; pilot readiness live release gate (TB-429) wires live `--run-id` readiness-bundle into `Emit-ReleaseReadinessEvidence.ps1` and RC signoff so release owners retain one-command live pilot evidence without a separate manual CLI step; pilot readiness live release strict blocker (TB-430) fail-closes strict RC on live bundle WARN/FAIL slots so release owners cannot hand off pilots with unresolved readiness warnings; first-hour UX audit P0 fixes (TB-431—TB-433) remove developer JSON diagnostics, internal pilot toast labels, and inline pipeline troubleshooting from first-hour review list, new-review, and review-detail surfaces; onboarding page title and nav label (TB-434) replace internal `"Onboarding"` / intake / committed-package hero copy with `"Getting started"` and finalized-review-package language; onboarding walkthrough help link (TB-435) removes pilot/operator-path jargon from the Getting started progress section; review detail deliverables section (TB-436) renames `"Artifacts & exports"` to `"Deliverables"` and keeps operator-shell deliverables expanded by default; unified new-review submit CTA (TB-437) aligns first-pilot and quick-start wizards with the reviews-list `"Start architecture review"` label; copy/terminology audit P0 (TB-456) replaces `"Pilot feedback"` with `"Review feedback"` on system-admin nav and `/product-learning` page title; copy/terminology audit P0 (TB-457) replaces `"Evaluation value report"` with `"Review value report"` on `/value-report/pilot` nav, breadcrumbs, and page title; copy/terminology audit P0 (TB-458) replaces `"Evaluation standards"` with `"Review standards"` on streamlined first-review outcome cards; copy/terminology audit P0 (TB-459) removes `"demo integrity tools"` from the production audit trail integrity note on `/governance/audit`; copy/terminology audit P0 (TB-460) replaces Azure-only cost-evidence footnote on executive dashboard KPIs with Azure/AWS/GCP language; integrations/evidence audit P0 (TB-481) removes contradictory `"V1.1 deep analysis"` AWS/GCP labels from `WizardStepIdentity` now that accelerated inventory ZIPs ship; integrations/evidence audit P0 (TB-482) defaults wizard evidence step to brief so non-Azure customers are not nudged toward Azure ZIP upload on entry; standardized tenant-isolation deny-matrix evidence, return-trigger cohort guardrails, and operator ITSM settings write API improve enterprise confidence without expanding pilot setup scope.
- **Tradeoffs:** reducing friction too far risks weakening governance and assurance posture.
- **Recommendations:** bias toward "default safe + guided first proof" instead of broad optionality at pilot start.
- **Classification:** V1

## 8. Top 10 Weaknesses (Ranked)
1. **Time-to-first-obvious-value remains fragile** - matters because voluntary reuse depends on fast cognitive payoff; **market + design uncertainty**; not hard blocker; fix with one constrained pilot path and measured elapsed checkpoints.
2. **Ship-gate Gate 5 localhost default may fail when operator UI is unreachable** - matters because default resolution probes `http://localhost:3000` unless overridden; **design uncertainty**; V1 blocker only if live probes fail in pilot environments; fastest fix: set `ARCHLUCID_UI_BASE_URL` or `archlucid.json` `uiUrl`, or use `--skip-ui-route-smoke` for API-only CI.
3. **Decision-advantage proof is still mostly inferred, not demonstrated at scale** - matters because frontier-AI substitution risk is high; **market uncertainty**; not blocker; fix with structured A/B pilot evidence.
4. **Executive narrative coherence still depends on skilled operator mediation** - matters because purchase decisions are executive and cross-functional; **design uncertainty**; not blocker; fix with stricter sponsor packet narrative spine.
5. **Procurement assurance friction remains externally visible** - matters for conversion timing; **market uncertainty**; not `(A)` blocker; fix via procurement response assets and expectation shaping.
6. **Adoption complexity across auth/config/evidence paths** - matters for 30-day usage; **design uncertainty**; not blocker; fix with opinionated first-pilot profile and strict preflight.
7. **Reliability claims are architecture-strong but evidence-light in this specific pass** - matters because demo failure kills trust quickly; **design uncertainty**; potential blocker if unresolved; fix with repeated smoke evidence; default ship-gate artifact bundle (TB-418) lowers retention friction but does not replace live environment proof.
8. **Frontier-AI comparison is still easier to narrate than to quantify** - matters because displacement can occur on perception; **market uncertainty**; not blocker; fix with explicit baseline-vs-ArchLucid decision deltas.
9. **Policy-pack moat can be mistaken for taxonomy decoration** - matters because moat credibility drives purchase; **market uncertainty**; not blocker; fix by showing policy changes flipping concrete decisions and owners.
10. **ITSM depth remains intentionally partial in V1** - matters for some enterprise workflows; **design uncertainty**; not blocker for V1 if pilot scope is explicit; per-tenant connector credentials (TB-392) close the multi-tenant SaaS credential gap; durable async outbound (TB-394) remains V1.1.

## 9. Frontier-AI Analysis

### Commodity vs Durable
| Capability | 12-month trajectory | Why | Evidence base |
|---|---|---|---|
| Generic architecture critique prose | Commodity | Frontier models keep improving unsupervised advisory quality | Market baseline + direct model trend |
| Policy-aware finding filtering by tenant-specific packs | Durable (if used) | Requires persisted policy state and governed resolution, not prompt memory alone | Policy pack APIs, governance resolution, pre-commit gate |
| Evidence -> finding -> decision -> audit chain | Durable | Depends on append-only system records and reproducible workflow state | Audit matrix + authority commit flows |
| Executive packet with disposition-aware ROI basis | Semi-durable | Logic is reproducible by competitors, but operational consistency can still differentiate | ROI service behavior + board-pack delegation |
| Remediation seam to external systems with stable IDs | Semi-durable | Technically reproducible but still operationally sticky in enterprise workflows | ITSM outbound + correlation persistence |

### Hard-to-reproduce-via-prompting
- **Hard:** tenant policy state resolution, deterministic governance gates, durable audit reconstruction, and cross-role workflow separation.
- **Easy soon:** high-quality architecture critique text, remediation suggestion drafting, and polished narratives.

### Leverage / Upside (Mandatory)
As base models improve, ArchLucid can capture upside without proportional product rewrite: better model outputs flow into existing policy/evidence/audit scaffolding, increasing decision quality and governance value at near-zero incremental workflow cost.

### Displacement Timeline
- **One model release away from commoditization:** generic "architecture advisor" UI, unsupported ROI storytelling, and ungoverned recommendation prose.
- **Less likely to commoditize quickly:** integrated policy-stateful governance workflow with audit-grade traceability and repeatable package production.

**Final verdict:** ArchLucid can become more valuable faster than frontier AI capabilities expand **only if** it proves repeated, governed decision advantage in real buyer workflows; otherwise it risks being perceived as an expensive wrapper.

## 10. Policy-Aware Governance Test
1. **Policy packs first-class or inert?** Mostly first-class in architecture and contracts; inertia risk exists if teams run defaults without policy variation.
2. **Trace path completeness:** Intended end-to-end path is present; empirical completeness remains partially unverified in this specific pass.
3. **Could frontier AI alone reproduce consistently?** Not reliably at organizational scale without heavy process engineering external to the model.
4. **AI analysis vs governed infrastructure split:** governed infrastructure is the differentiator; raw analysis quality alone is not.
5. **Evidence moat proof needed:** repeated cases where policy changes alter findings, decisions, and remediation ownership with auditable trail.
6. **Fastest validation path:** two-run policy A/B on same evidence with sponsor-visible decision delta and gate delta.
7. **V1 demo behavior that makes moat obvious:** show a policy-pack change that flips commit gate outcome and executive recommendation ordering while preserving traceability.

## 11. Principal Architect Dismissal Test
- **What makes them say "I need this":** "You showed me a decision delta with audit-grade backing that my own frontier-AI workflow does not reliably produce under governance pressure."
- **What makes them return voluntarily:** reduced personal burden in defending architecture decisions to security/compliance/executives.
- **What triggers immediate dismissal:** product feels like "chat with extra steps" where policy packs do not materially change outputs.
- **Single most likely dismissal trigger today:** perceived process overhead before obvious decision gain.
  - **Calibrated likelihood:** **45-60%** (reference class: senior architects reject governance-heavy tools unless decision advantage is immediate and concrete).
- **Direct answer:** today they may see ArchLucid as better than "Claude + prompt + standards paste-in" only when they observe governed decision delta; absent that evidence, many will not.

## 12. Founder Delusion Check
- **Strongest assumptions with weakest evidence:** that governance-heavy packaging alone will drive repeat architect usage without hard proof of superior decisions.
- **Looks differentiated but becoming commodity:** eloquent architecture explanation.
- **Looks ordinary but may be moat:** boring audit/event/correlation plumbing tied to policy-stateful decisions.
- **Could burn months with low five-outcome impact:** broad ecosystem/marketplace features pre-validation.
- **If features froze for six months:** best move is validation cadence proving decision change + repeat use.
- **Most dangerous attractive distraction:** feature breadth race with frontier AI capabilities.
- **Most boring real moat:** repeatable, auditable policy-evidence decision workflow adopted by multiple operators.

## 13. Competitive Reality Check & Moat Assessment
- **What skilled architects already do manually with frontier AI:** critique architectures, draft recommendations, produce narratives quickly.
- **What ArchLucid does faster/more consistently:** produce governed package artifacts with policy traceability, disposition semantics, and auditable records.
- **What resists prompting:** persisted governance state, consistent audit chain, repeatable multi-role workflow.
- **What is commodity within 12 months:** generic advisory depth and phrasing quality.
- **What gets more valuable as AI improves:** policy-aware package quality under the same governance rails.
- **Current moat:** moderate, infrastructure-centric, not yet fully market-proven.
- **Potential future moat:** high if policy-state-driven decision change is repeatedly demonstrated.
- **Weakest moat assumption:** "enterprise buyers will pay for governance packaging without strong proof of decision advantage."
- **Most durable moat assumption:** "audit-grade, policy-stateful decision workflows are hard to sustain via ad-hoc prompting."
- **Probably-illusory moat:** interface polish as primary defense.
- **Boring-but-durable moat:** traceability and disposition-aware decision records.
- **What makes moat obvious to buyers:** a before/after decision package where policy changes alter outcomes and ownership in a way plain prompting did not.

## 14. Adoption & Monetization
- **30-day voluntary usage (10 principal architects):** strongest positive factor is defendable decision packaging; strongest negative factor is upfront workflow overhead; likely return reason is "saved me from governance rework"; likely stop reason is "frontier AI chat is faster."
- **Executive purchase:** strongest driver is auditable policy-to-decision traceability; strongest blocker is insufficient buyer-validated proof packets; minimum paid-pilot proof is one credible decision change with measurable cost/risk ownership and remediation trail.
- **Why buy instead of more frontier-AI licenses:** ArchLucid is not primarily a model quality play; it is a governed operating system for architecture decisions with policy-state, evidence lineage, and auditability.

**Top 6 monetization blockers**
1. Decision delta not yet buyer-visible in repeated pilots - objection owner: architecture leadership - overcome with structured validation.
2. Procurement assurance expectations (CPA SOC2 / third-party pen-test) - owner: InfoSec/procurement - overcome with transparent roadmap + exceptions.
3. Time-to-value uncertainty in first pilot execution - owner: delivery sponsor - overcome with measured first-review runbook.
4. Cognitive load from broad surface area - owner: executive sponsor/operator - overcome with role-specific packets.
5. ITSM completeness expectations beyond V1 slice - owner: ops leadership - overcome with pilot scoping and connector roadmap clarity.
6. "AI license substitution" framing - owner: CIO/finance - overcome with governance/traceability ROI evidence.

**Top 6 enterprise adoption blockers**
1. Initial environment/auth setup complexity (pilot blocker).
2. Evidence intake discipline requirements (pilot blocker).
3. Policy-pack governance ownership model (scale blocker).
4. Cross-functional comprehension burden (pilot + scale blocker).
5. Procurement assurance friction in conservative orgs (scale blocker).
6. Workflow fit with incumbent remediation operations (scale blocker).

## 15. Most Important Truth
**ArchLucid wins only if it proves that policy-aware governance changes real architecture decisions more reliably than frontier AI chat alone.**

Without that proof, the product reads as process overhead around increasingly capable base models.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List
- **Top 3 improvements not worth doing before V1 validation closes:**
  1. Plugin marketplace or ecosystem expansion.
  2. Net-new MCP surface acceleration ahead of buyer decision proof.
  3. Additional broad policy-pack count expansion without decision-delta evidence.
- **Top 3 diminishing-returns areas:**
  1. Incremental export format polish without stronger market proof loops.
  2. Additional generic AI critique surface features.
  3. New dashboard breadth before first-review reliability evidence is routine.
- **Top 3 founder behaviors that delay validation:**
  1. Treating architecture completeness as a proxy for purchase probability.
  2. Reopening explicitly deferred assurance backlog as ad hoc engineering work.
  3. Optimizing demo polish over measurable decision-change outcomes.
- **Top 3 features that feel enterprise-important but may not improve V1 adoption:**
  1. Multi-region active/active promises.
  2. Third-party extension marketplace.
  3. Non-essential connector expansion beyond pilot-critical seams.
- **ITSM special attention judgment:** V1 outbound slice is sufficient for pilot-level remediation handoff when configured; V1.1 sequencing (ServiceNow -> Confluence -> Jira) remains directionally sound unless paid pilot evidence says otherwise.

## 17. Top Improvement Opportunities (Validation-First)
Confidence drops after these thirteen; list intentionally stops.

### Tier 1 - Must Fix

**1) Ship-gate evidence harness for first-review truth**
- **Why it matters:** unresolved ship-gate unknowns directly limit confidence in outcomes 1-4.
- **Expected impact:** Runtime reliability, Time-to-value, Executive purchase confidence.
- **Affected qualities:** 6, 9, 4.
- **Evidence:** all required surfaces exist, and a deterministic ship-gate evidence command now generates gate verdict artifacts.
- **Actionability:** high.
- **Design Uncertainty Reduced:** 8/10
- **Market Uncertainty Reduced:** 4/10
- **Classification:** V1 engineering - **shipped (2026-06-27)**
- **Implementation summary (shipped):** added `archlucid pilot ship-gate-evidence --run-id <guid>` with deterministic JSON + Markdown evidence output and gate-level PASS/FAIL/UNKNOWN verdicts, including links to the run, export, traceability bundle, and executive ROI routes. Added unit coverage in `ArchLucid.Cli.Tests/ShipGateEvidenceRunnerTests.cs`.
- **Rescore impact:** Time-to-Value +1 and Runtime & First-Review Reliability +1, lifting `(A)` headline readiness from **80.51%** to **80.68%**.

**Cursor prompt**
```text
Current problem:
We can describe the first-review path, but we do not consistently generate one machine-readable artifact proving all six ship-gate checks (create, execute, commit, citation sanity, export matrix, UI-safe route sequence, auth/scope sanity) passed in one run.

Desired behavior:
Add a deterministic "ship-gate evidence" runner that executes one representative first-review flow and outputs a single evidence bundle (json + markdown) with PASS/FAIL/UNKNOWN for each gate and links to produced artifacts.

Scope boundaries:
- Reuse existing API routes, CLI commands, and smoke helpers.
- Do not invent new product capabilities.
- Keep it tenant-scoped and safe for CI/non-prod use.

Acceptance criteria:
- One command generates gate verdicts with per-gate evidence pointers.
- Bundle includes runId, commit timestamp, artifact IDs, export outcomes, and auth/scope probe results.
- Any failed gate returns non-zero exit code.

Tests to add/update:
- Unit tests for verdict aggregation and failure handling.
- Integration test with a simulated run proving output schema stability.

Non-goals:
- New UI pages.
- Procurement reporting logic.
```

**2) Policy-to-decision validation cohort (market execution)**
- **Status:** moved to **GTM V1.1 backlog** (market execution stream), not a V1 assessment implementation item.
- **Assessment handling rule:** **do not surface this again in V1 assessments (§17)** unless explicitly requested as GTM-backlog review work.
- **Rationale:** this is predominantly market-uncertainty reduction (human cohort execution), not an in-contract V1 engineering gate.
- **Classification:** GTM V1.1 backlog / validation first.
- **Rescore impact:** none on `(A)` headline readiness; score remains **80.68%**.

### Tier 2 - High Leverage

**3) Executive proof-packet acceptance testing with real buyers**
- **Status:** moved to **GTM V1.1 backlog** (market execution stream), not a V1 assessment implementation item.
- **Assessment handling rule:** **do not surface this again in V1 assessments (§17)** unless explicitly requested as GTM-backlog review work.
- **Rationale:** this is primarily market-validation execution with human buyers, not an in-contract V1 engineering readiness gate.
- **Classification:** GTM V1.1 backlog / validation first.
- **Rescore impact:** none on `(A)` headline readiness; score remains **80.68%**.

**4) First-review cognitive-load reduction in operator guidance**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `CorePilotNextStepsCard` now renders one shared 5-step checkpoint strip (`intake -> execute -> commit -> export -> sponsor-ready`) across no-run/has-run/committed states, with deep links and concrete "Next action" copy for missing prerequisites.
- **Validation evidence:** `archlucid-ui/src/components/CorePilotNextStepsCard.test.tsx` updated with checkpoint-strip assertions for no-run, has-run, and committed edge states.
- **Affected qualities:** 6, 8, 10.
- **Classification:** V1.
- **Rescore impact:** Time-to-Value +1, Executive / Operator Comprehension +1, and Adoption Friction +1; `(A)` headline readiness rises from **80.68%** to **80.91%**.

### Tier 3 - Hold For Reassessment

**5) Frontier-AI baseline benchmark program**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot frontier-ai-baseline` validates the fixture pack, parses the rolling scoreboard, computes cohort guardrails, and emits JSON/Markdown reports with PASS/WARN/FAIL verdicts; `--init-scoreboard` seeds `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` from the template.
- **Validation evidence:** `ArchLucid.Cli.Tests/FrontierAiBaselineRunnerTests.cs` covers scoreboard parsing, initialization warnings, healthy cohort pass, and anti-claims failure paths.
- **Affected qualities:** 1, 2, 5.
- **Classification:** validation first (engineering half shipped; live bakeoff sessions remain GTM **M-43**).
- **Rescore impact:** Decision-Changing Insight Density +1, Differentiability +1, and AI / Agent Readiness +1; `(A)` headline readiness rises from **80.91%** to **81.27%**.

**6) ITSM pull-forward decision gate**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot itsm-pull-forward-gate` evaluates CONNECTOR_PULL_FORWARD_DECISION.md triggers from paid-pilot ledgers and optional evidence JSON, verifies V1 outbound ITSM seams in-repo, optionally probes `GET /v1/integrations/itsm/health`, and emits HOLD/WATCH/PULL_FORWARD with JSON/Markdown reports.
- **Validation evidence:** `ArchLucid.Cli.Tests/ItsmPullForwardRunnerTests.cs` covers default HOLD, two-trigger PULL_FORWARD, and connector-gap ledger aggregation; template at `fixtures/itsm/connector-pull-forward-evidence.template.json`.
- **Affected qualities:** 10, 8.
- **Classification:** V1 decision gate (V1.1 connector build remains owner-gated).
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **81.27%** to **81.40%**.

**7) Procurement objection replay drills (non-engineering)**
- **Why it matters:** explicit conversion bottlenecks are procurement narrative + proof confidence.
- **Expected impact:** executive purchase probability.
- **Affected qualities:** 7, 4.
- **Evidence:** trust artifacts are strong but need repeated real objection handling evidence.
- **Actionability:** medium.
- **Design Uncertainty Reduced:** 1/10
- **Market Uncertainty Reduced:** 8/10
- **Classification:** validation first

**8) Citation integrity sampler for representative committed runs**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot citation-integrity` deterministically samples bounded committed runs (offline fixtures or `--include-api`), validates citation/evidence fields for Cost/Compliance/Critic claim classes, and emits PASS/WARN/FAIL with run-level evidence pointers as JSON + Markdown; non-zero exit when `--fail-threshold` is exceeded.
- **Validation evidence:** `ArchLucid.Cli.Tests/CitationIntegrityRunnerTests.cs` covers sampler selection, rule evaluation, and pass/warn/fail fixture bundles under `fixtures/citation-integrity/`.
- **Affected qualities:** 4, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **81.40%** to **81.61%**.

**Cursor prompt**
```text
Current problem:
Citation rules exist, but we do not have a lightweight recurring sampler that spot-checks representative committed runs for citation completeness and evidence trace consistency.

Desired behavior:
Add a deterministic citation-integrity sampler that selects a bounded set of committed runs, validates citation fields for key claim classes, and emits PASS/WARN/FAIL with run-level evidence pointers.

Scope boundaries:
- Reuse existing manifest/finding/evidence read paths and contracts.
- Keep checks deterministic and offline-capable.
- Do not add a new policy engine.

Acceptance criteria:
- One command produces machine-readable and markdown outputs.
- Results identify runId, failing claim category, and missing/weak citation reason.
- Non-zero exit when fail threshold is exceeded.

Tests to add/update:
- Unit tests for sampler selection and rule evaluation.
- Integration test with fixtures covering pass/warn/fail outcomes.

Non-goals:
- LLM-based claim adjudication.
- Any mutation of committed review artifacts.
```

**9) ROI headline/per-system explanation hardening**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** added canonical `fixtures/roi/roi-sponsor-facing-scope-labels.v1.json` mirrored in UI data; `roi-sponsor-scope-labels.ts` and `roi-disposition-training-copy.ts` import manifest fallbacks; executive markdown export and buyer-decision brief use the same scope labels and non-additivity caveat; `check_roi_surface_consistency.py` and `RoiScopeLabelManifestParityTests` guard drift.
- **Validation evidence:** `ArchLucid.Application.Tests/Roi/RoiScopeLabelManifestParityTests.cs`, `archlucid-ui/src/lib/roi-sponsor-scope-labels.test.ts`, `archlucid-ui/src/lib/executive-summary-markdown.test.ts`, and `ArchLucid.Cli.Tests/SponsorPacketBuyerDecisionBriefBuilderTests.cs`.
- **Affected qualities:** 7, 8.
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1 and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **81.61%** to **81.78%**.

**Cursor prompt**
```text
Current problem:
The disposition-aware portfolio headline and per-system rows are intentionally non-additive, but explanatory labels can drift across API, UI, and exported artifacts.

Desired behavior:
Centralize and enforce one canonical explanation string set for ROI scope semantics so every surface consistently labels headline basis, per-system scope, and freshness assumptions.

Scope boundaries:
- Reuse existing ROI services and response contracts where possible.
- Prefer shared constants/helpers over duplicated copy.
- Do not alter ROI math.

Acceptance criteria:
- API, UI, and export text all use the same explanation sources.
- Snapshot/contract tests fail if explanation semantics drift.
- Existing disposition-aware totals remain unchanged.

Tests to add/update:
- Service tests for explanation payload fields.
- UI rendering tests for canonical labels.
- Export text tests for non-additivity caveat presence.

Non-goals:
- New pricing models.
- New financial metrics.
```

**10) Tenant-isolation negative-test bundle for pilot readiness**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot tenant-isolation-negative-test` runs scoped cross-tenant read probes (run detail, ROI, provenance, artifacts, export, list exclusion) with correlation IDs and emits a deny-matrix as JSON + Markdown; offline fixture replay validates aggregator logic; live mode requires `--run-id` under primary scope plus alternate tenant headers.
- **Validation evidence:** `ArchLucid.Cli.Tests/TenantIsolationNegativeTestRunnerTests.cs` covers deny aggregation, fixture replay, and stubbed two-tenant integration; ship-gate Gate 6 embeds the same live probe catalog (TB-411).
- **Affected qualities:** 9, 10, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1, Adoption Friction +1, and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **81.78%** to **82.02%**.

**Cursor prompt**
```text
Current problem:
Tenant isolation is architecturally clear, but pilot readiness evidence often lacks a standardized negative-test artifact proving cross-tenant access is denied.

Desired behavior:
Add a repeatable tenant-isolation negative-test bundle to pilot/readiness flows that runs scoped cross-tenant probes and records expected-deny outcomes with correlation IDs.

Scope boundaries:
- Reuse existing auth/scope enforcement and diagnostic endpoints.
- Keep it non-destructive and non-production-invasive.
- No new authorization model changes.

Acceptance criteria:
- Command outputs a concise deny-matrix with probe name, expected status, observed status, and correlation IDs.
- Bundle integrates with readiness evidence output.
- Fail when any cross-tenant probe unexpectedly succeeds.

Tests to add/update:
- Unit tests for probe result aggregation.
- Integration test with two scoped tenants asserting deny behavior.

Non-goals:
- Pen-testing automation suite.
- Changes to tenant isolation architecture itself.
```

**11) Principal-architect return-trigger telemetry pack**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot return-trigger-telemetry` aggregates sanitized principal-architect dismissal, reuse, and return-trigger JSON logs from a ledger directory, applies R1–R8 trigger taxonomy guardrails, and emits cohort metrics plus PASS/WARN/FAIL checks as JSON + Markdown; offline fixture pack validates parser and aggregator logic.
- **Validation evidence:** `ArchLucid.Cli.Tests/ReturnTriggerTelemetryRunnerTests.cs` covers multi-schema parsing, guardrail evaluation, default fixture PASS, and synthetic fail cohort; fixtures under `fixtures/principal-architect/return-trigger-sessions/`.
- **Affected qualities:** 1, 6, 10.
- **Classification:** validation first.
- **Rescore impact:** Decision-Changing Insight Density +1, Time-to-Value +1, and Adoption Friction +1; `(A)` headline readiness rises from **82.02%** to **82.30%**.

**12) Buyer-proof evidence ledger normalization**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot buyer-proof-evidence-ledger` normalizes heterogeneous proof artifacts (go-no-go summary, decision ledger, paid-pilot ledger row, proof-package completeness) into one canonical sponsor-send completion matrix with PASS/WARN/FAIL slot verdicts and JSON + Markdown output; offline fixture pack validates parser and normalizer logic.
- **Validation evidence:** `ArchLucid.Cli.Tests/BuyerProofEvidenceLedgerRunnerTests.cs` covers mixed-artifact parsing, required-slot normalization, default fixture PASS/WARN, and synthetic fail proof pack; fixtures under `fixtures/buyer-proof-evidence/sample-proof-pack/`.
- **Affected qualities:** 3, 7, 8.
- **Classification:** validation first.
- **Rescore impact:** Governed Review Integrity +1, Proof-of-ROI Readiness +1, and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **82.30%** to **82.60%**.

**13) Decision-owner accountability scoreboard for pilots**
- **Status:** shipped (2026-06-27) — engineering half; live buyer-side owner validation remains GTM field execution.
- **Implementation summary:** `archlucid pilot decision-owner-scoreboard` ingests `pilot-decision-ledger.v1` rows with buyer-side `decisionOwner`, `ownerOutcome`, optional `remediationDueUtc`, and ITSM refs; derives accountability statuses (`owned-and-resolved` / `owned-pending` / `owned-overdue` / `unowned` / `not-applicable`); emits PASS/WARN/FAIL closeout verdict plus operator and buyer-safe sponsor Markdown from one canonical model.
- **Validation evidence:** `ArchLucid.Cli.Tests/DecisionOwnerScoreboardRunnerTests.cs` covers owner-field parsing, accountability derivation, default fixture PASS/WARN, and synthetic unowned/overdue FAIL; fixtures under `fixtures/decision-owner-scoreboard/sample-ledgers/`; template extended at `docs/go-to-market/templates/pilot-decision-ledger.template.json`.
- **Affected qualities:** 1, 2, 3.
- **Classification:** validation first (engineering half shipped).
- **Rescore impact:** Decision-Changing Insight Density +1, Differentiability / Defensibility vs Frontier AI +1, and Governed Review Integrity +1; `(A)` headline readiness rises from **82.60%** to **82.99%**.

**14) Per-tenant Jira/ServiceNow connector credentials (TB-392)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `TenantItsmConnectorConnections` SQL table stores provider, instance URL, auth username, and Key Vault secret **names** only; `GET/POST/DELETE /v1/integrations/itsm/connections/{provider}` with `ReadAuthority`/`ExecuteAuthority`; `ItsmTenantConnectorCredentialResolver` resolves outbound API tokens and inbound webhook secrets via `ISecretProvider` at execution time with deployment-wide fallback behind `RequireTenantScopedCredentials` / `AllowDeploymentWideWebhookSecrets` for single-tenant pilots; outbound create, health probe, correlation URL builder, and tenant-scoped inbound webhook routes consume the resolver.
- **Validation evidence:** `TenantItsmConnectorConnectionsIntegrationTests`, `ItsmTenantConnectorCredentialResolverTests`, `TenantItsmConnectorConnectionUpsertValidationTests`, and updated ITSM outbound test fixtures.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **82.99%** to **83.24%**.

**15) Tenant ITSM outbound settings write API + admin UI (TB-393)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `GET/PUT /v1/integrations/itsm/settings` with `ReadAuthority`/`ExecuteAuthority`; upsert persistence for Jira project key override, info-severity send toggle, issue-type map JSON, and ServiceNow CMDB auto-create; wired into outbound create and health probe; unified operator hub at `/integrations/itsm` mirrors Teams layout with per-tenant connector references (TB-392) and tenant override forms.
- **Validation evidence:** `TenantItsmOutboundSettingsIntegrationTests`, `ItsmOutboundIssueCreationServiceTests` (tenant project key override), `ItsmIntegrationPageClient.test.tsx`, and `TenantItsmOutboundSettingsUpsertValidationTests`.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **83.24%** to **83.37%**.

**16) Durable async ITSM outbound ticket creation (TB-394)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations:ItsmOutbound:DurableAsyncCreateEnabled` (default true) enqueues `ItsmOutboundCreateWorkUnit` on `IBackgroundJobQueue` with configurable `AsyncCreateMaxRetries`; `POST /v1/integrations/itsm/outbound/issues` returns **202 Accepted** + job id when durable mode is on; worker executes create, correlation persistence, and audit via `BackgroundJobWorkUnitExecutor`; operators poll `GET /v1/jobs/{jobId}` and download JSON result; UI create flows poll until terminal state; synchronous path preserved when durable mode is disabled (local smoke).
- **Validation evidence:** `ItsmOutboundCreateJobProcessorTests`, `BackgroundJobWorkUnitExecutorTests` (ITSM work unit), `BackgroundJobWorkUnitJsonTests`, `ItsmOutboundIssuesEndpointIntegrationTests` (202 async path).
- **Affected qualities:** 9, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **83.37%** to **83.49%**.

**17) Finding assignee + general remediation due date (TB-395)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `AssignedToUserId` and `RemediationDueUtc` on `Finding` + `FindingRecords` (migration 262); `PUT /v1/findings/{findingId}/remediation-assignment` with audit `FindingRemediationAssignmentUpdated`; exposed on inspect and architecture risk register; outbound Jira/ServiceNow create maps assignee/due when configured; finding inspect governance panel edit UI.
- **Validation evidence:** `ItsmOutboundVendorRemediationFieldsTests`, `ItsmFindingAuthorityPayloadMapperConformanceTests`, `FindingRemediationAssignmentEndpointTests`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.49%** to **83.74%**.

**18) Inbound ITSM disposition sync (TB-396)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** Optional `JiraStatusDispositionMap` and `ServiceNowStateDispositionMap` on `Integrations:ItsmInbound`; inbound webhooks still update `HumanReviewStatus` by default; when a disposition map hits, `ItsmInboundDispositionSync` records disposition via `FindingDispositionService` with integration actor and skips when latest disposition is unchanged (loop guard); sync audit payloads include disposition fields.
- **Validation evidence:** `ItsmInboundDispositionSyncTests`, `ItsmInboundExternalStatusMapperTests`, extended `ItsmInboundWebhookSyncServiceTests`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.74%** to **83.99%**.

**19) `IExternalTicketConnector` plugin boundary (TB-397)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `IExternalTicketConnector` + registry with Jira/ServiceNow implementations; `ItsmOutboundIssueCreationService` delegates create to registered connectors; `ItsmExternalTicketUrlBuilder` resolves browse URLs via registry; architecture test blocks API controllers from referencing vendor HTTP client types directly.
- **Validation evidence:** `ExternalTicketConnectorRegistryTests`, `ExternalTicketConnectorApiBoundaryArchitectureTests`, existing outbound conformance/integration suites via `ItsmOutboundConnectorTestFixture.IssueCreationService`.
- **Affected qualities:** 2, 4.
- **Classification:** V2 engineering prerequisite (shipped ahead of full enterprise connector TB-398).
- **Rescore impact:** Differentiability / Defensibility +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.99%** to **84.24%**.

**20) Automated AWS polling (Tier 2) (TB-402)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations.AwsExtractor` hosted client (Azure MI OIDC → STS AssumeRoleWithWebIdentity → Resource Explorer search → schema v1 ZIP); `TenantAwsConnectionRecords` persistence; `POST/GET/DELETE /v1/aws-extractor/connections`; `POST /v1/admin/aws-extractor/hosted/run`; leader-elected `AwsExtractorAutoPullHostedService` (`CloudPolling:Aws`, default off); `/settings/cloud-connections` AWS section; audit events `CloudConnection.AwsConnected` / `AwsPolled` / `AwsDisconnected`; trust-center AWS Tier 2 posture; Terraform module `infra/terraform-hosted-prod/modules/aws-extractor/`.
- **Validation evidence:** `HostedAwsExtractorRunServiceTests`, `AwsTier2ConnectionServiceTests`, `AwsInventoryZipPackagerTests`, `CloudConnectionsPageClient.test.tsx` (Azure wizard regression retained).
- **Affected qualities:** 6, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Time-to-Value +1 and Adoption Friction +1; `(A)` headline readiness rises from **84.24%** to **84.39%**.

**21) Automated GCP polling (Tier 2) (TB-403)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations.GcpExtractor` hosted client (Azure MI OIDC → GCP Workload Identity Federation → service-account impersonation → Cloud Asset Inventory → schema v1 ZIP); `TenantGcpConnectionRecords` persistence; `POST/GET/DELETE /v1/gcp-extractor/connections`; `POST /v1/admin/gcp-extractor/hosted/run`; leader-elected `GcpExtractorAutoPullHostedService` (`CloudPolling:Gcp`, default off); `/settings/cloud-connections` GCP section; audit events `CloudConnection.GcpConnected` / `GcpPolled` / `GcpDisconnected`; trust-center GCP Tier 2 posture; Terraform module `infra/terraform-hosted-prod/modules/gcp-extractor/`.
- **Validation evidence:** `HostedGcpExtractorRunServiceTests`, `GcpTier2ConnectionServiceTests`, `GcpInventoryZipPackagerTests`, `CloudConnectionsPageClient.test.tsx` (Azure/AWS/GCP connect affordances).
- **Affected qualities:** 2, 5.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1 and AI / Agent Readiness +1; `(A)` headline readiness rises from **84.39%** to **84.62%**.

**22) Buyer-facing route aliases (TB-399)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** Canonical `/signed-records`, `/signed-records/{manifestId}`, and `/reviews/{runId}/signed-record` paths with permanent redirects from legacy manifest segments; internal `Link`/`href` builders, breadcrumbs, help copy, and E2E golden-path helpers migrated; App Router files under `app/(operator)/manifests/` unchanged via rewrites.
- **Validation evidence:** `signed-records-paths.ts`, `next.config.ts` redirect/rewrite matrix, `breadcrumb-map.test.ts`, `buyer-safe-review-navigation.test.ts`, `help-product-language.test.ts`, `buyer-golden-path.ts` URL patterns.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **84.62%** to **84.75%**.

**23) Advisory recommendation source-evidence links (TB-400)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `SourceEvidenceLinksJson` on `RecommendationRecords` (migration **265**); `RecommendationSourceEvidenceLinksComposer` derives `{ kind: finding | manifestSection, id }` from supporting-id arrays at persist; `RecommendationRecordResponse.sourceEvidenceLinks` on list/action endpoints; `AdvisoryScansContent` renders navigable finding/manifest-section links.
- **Validation evidence:** `AdvisoryControllerListRecommendationsIntegrationTests.ListRecommendations_after_improvements_includes_finding_source_evidence_links`, `RecommendationSourceEvidenceLinksComposer`, UI `recommendation-source-evidence-links.ts`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **84.75%** to **85.00%**.

**24) Operator nav ↔ URL prefix policy + CI drift guard (TB-404)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical prefix policy per nav group in `NAV_CONFIG_CONTRACT.md`; typed exception registry (`nav-route-namespace-exceptions.ts`) for 22 intentional cross-namespace hrefs; prefix matcher (`nav-route-namespace-policy.ts`); Vitest drift guard (`nav-route-namespace.test.ts`) fails when new sidebar links drift without registry update. Route moves remain TB-405–408.
- **Validation evidence:** `nav-route-namespace.test.ts` (5 cases — alignment, registry href presence, non-empty reasons, no dupes, full cross-namespace coverage).
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering (policy + guard; no route moves).
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.00%** to **85.13%**.

**25) Governance route tree consolidation (TB-405)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/governance/policy-packs`, `/governance/resolution`, `/governance/audit`, `/governance/alerts`; permanent redirects from legacy paths; policy packs list promoted to `governance/policy-packs/page.tsx`; rewrites reuse existing audit/alerts/resolution App Router trees; nav, breadcrumbs, command palette, deep links, and E2E paths migrated via `governance-route-paths.ts`.
- **Validation evidence:** `governance-route-paths.test.ts`, `nav-config.structure.test.ts` (governance prefix invariant), `breadcrumb-map.test.ts`, `policy-packs-deep-link.test.ts`, E2E smoke/accessibility path updates.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.13%** to **85.26%**.

**26) Administration route namespace reconciliation (TB-406)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/settings/users`, `/settings/security-trust`, `/settings/support`; permanent redirects from `/admin/users`, `/workspace/security-trust`, `/admin/support`; **Recurrence schedules** nav moved from Administration to Governance; `operator-admin` prefix policy narrowed to `/settings` only; path helpers in `settings-admin-route-paths.ts`; layer resolution honors legacy bookmarks via redirect matchers in `getLayerForRoute.ts`.
- **Validation evidence:** `settings-admin-route-paths.test.ts`, `nav-config.structure.test.ts` (Administration `/settings/*` invariant + recurrence in governance), `nav-route-namespace.test.ts`, `getLayerForRoute.test.ts`, `nav-shell-visibility.test.ts`, E2E accessibility path updates.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.26%** to **85.39%**.

**27) Integrations cross-namespace routes + ITSM redirect hygiene (TB-407)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/integrations/cloud-connections` with permanent redirect from `/settings/cloud-connections`; removed duplicate **ITSM** nav href (Integration readiness at `/integrations/operations` is the hub); deleted `/settings/webhooks` redirect-only page; permanent `/integrations/itsm` → `/integrations/operations` redirect; removed cloud-connections TB-404 exception; `integrations-nav-paths.ts` path helpers; route-tier CI registry alignment.
- **Validation evidence:** `integrations-nav-paths.test.ts`, `nav-config.structure.test.ts` (integrations `/integrations/*` invariant), `nav-route-namespace.test.ts`, `breadcrumb-map.test.ts`, `getLayerForRoute.test.ts`.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.39%** to **85.52%**.

**28) Nav deduplication + semantic path aliases (TB-408)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Renamed Internal Operations `/admin/health` nav to **Diagnostics dashboard** (dedupes duplicate **System health** label with `/health`); canonical `/settings/ai-usage` and `/integrations/readiness` with permanent redirects from `/settings/cost-reporting` and `/integrations/operations`; nav hrefs updated; deleted orphan `operate-operations-nav-group-builder.ts`; duplicate-label invariant in `nav-config.structure.test.ts`; `ai-usage-nav-paths.ts` path helpers.
- **Validation evidence:** `ai-usage-nav-paths.test.ts`, `integrations-nav-paths.test.ts`, `nav-config.structure.test.ts` (duplicate label guard), `getLayerForRoute.test.ts`, `test_adoption_batch_5ao.py` orphan guard.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.52%** to **85.65%**.

**29) Ship-gate Gate 2 citation-integrity probe (TB-409)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate2Async` loads the representative `--run-id` via `CitationIntegrityApiLoader`, evaluates Cost/Compliance/Critic claim classes with bundled `citation_integrity_rules.v1.json`, and emits Gate 2 PASS/FAIL (WARN treated as structural PASS with evidence counts); shared `CitationIntegrityAgentResultParser` dedupes API result parsing with the standalone citation-integrity command.
- **Validation evidence:** `ShipGateEvidenceRunnerTests` covers compliant Gate 2 PASS and missing-citation Gate 2 FAIL; markdown evidence links reference `archlucid pilot citation-integrity --include-api`.
- **Affected qualities:** 4, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **85.65%** to **85.84%**.

**30) Ship-gate Gate 5 first-review UI route smoke (TB-410)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** optional `--ui-base-url` on `archlucid pilot ship-gate-evidence` probes six canonical first-review operator routes from `FIRST_REVIEW_UI_ROUTE_SMOKE_CONTRACT.v1.json` (home, new review, run detail, run signed record, signed-records list, first-review help); Gate 5 PASS/FAIL from HTTP status + error-boundary markers; UNKNOWN when UI origin omitted.
- **Validation evidence:** `FirstReviewUiRouteSmokeProbeTests` covers route pass and error-boundary fail paths; `ShipGateEvidenceOptions` parses `--ui-base-url`.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.84%** to **85.96%**.

**31) Ship-gate Gate 6 tenant-isolation negative-test embed (TB-411)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate6Async` runs `TenantIsolationNegativeTestRunner.RunLiveAsync` for the ship-gate `--run-id` using primary scope on the API client and alternate tenant headers (defaults or `--alternate-tenant-id` / workspace / project overrides); Gate 6 PASS/FAIL from cross-tenant deny-matrix aggregation with probe counts in evidence text.
- **Validation evidence:** `ShipGateEvidenceRunnerTests` covers Gate 6 PASS with stubbed deny responses and Gate 6 FAIL when alternate scope can read the foreign runId; markdown evidence links reference embedded tenant-isolation probes.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **85.96%** to **86.21%**.

**32) Ship-gate Gate 4 export matrix embed (TB-412)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate4Async` probes sponsor Markdown (`GET /v1/pilots/runs/{runId}/first-value-report`), analysis DOCX (`POST /v1/architecture/run/{runId}/analysis-report/export/docx`), and run artifact ZIP (`GET /v1/artifacts/runs/{runId}/export` with ZIP magic-byte validation) from bundled `ship_gate_export_matrix_contract.v1.json`; Gate 4 PASS/FAIL with per-format evidence counts.
- **Validation evidence:** `ShipGateExportMatrixProbeTests` covers pass and ZIP magic-byte fail paths; `ShipGateEvidenceRunnerTests` covers Gate 4 FAIL when DOCX export is missing.
- **Affected qualities:** 4, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **86.21%** to **86.42%**.

**33) Ship-gate Gate 1 first-review completion probe (TB-413)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate1Async` evaluates committed-run completion signals from bundled `first_review_completion_contract.v1.json`: Committed status, manifest version, request linkage, execution signals, artifact list, and provenance graph reachability; Gate 1 PASS/FAIL with per-signal evidence counts.
- **Validation evidence:** `FirstReviewCompletionProbeTests` covers pass and provenance fail paths; `ShipGateEvidenceRunnerTests` covers Gate 1 FAIL when provenance graph is missing.
- **Affected qualities:** 6, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **86.42%** to **86.59%**.

**34) Ship-gate Gate 5 default UI origin resolution (TB-414)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateUiBaseUrlResolver` resolves operator UI origin for `archlucid pilot ship-gate-evidence` with precedence `--ui-base-url` → `ARCHLUCID_UI_BASE_URL` → `archlucid.json` `uiUrl` → default `http://localhost:3000`; `--skip-ui-route-smoke` preserves Gate 5 **UNKNOWN** for API-only runs; evidence report and Gate 5 text include `uiOrigin` source attribution.
- **Validation evidence:** `ShipGateUiBaseUrlResolverTests` covers skip flag, explicit arg precedence, env/config/default resolution; markdown evidence header includes UI base URL and source when probed.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **86.59%** to **86.71%**.

**35) Ship-gate Gate 4 first-value claim lint embed (TB-415)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** after export matrix probes pass, `ShipGateEvidenceRunner.BuildGate4Async` runs `ShipGateFirstValueClaimLintProbe` on `GET /v1/pilots/runs/{runId}/first-value-report` markdown via shared `ProofPacketClaimLinter`; Gate 4 **FAIL** when forbidden buyer claims are detected; `--skip-claim-lint` preserves bypass for internal-only runs; evidence includes `claimLint=pass|fail|skipped` with violation counts.
- **Validation evidence:** `ShipGateFirstValueClaimLintProbeTests` covers pass, fail, and skip paths; `ShipGateEvidenceRunnerTests` covers Gate 4 FAIL when first-value markdown contains forbidden claims.
- **Affected qualities:** 4, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **86.71%** to **86.92%**.

**36) Ship-gate Gate 3 ROI coherence probe (TB-416)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate3Async` runs `ShipGateRoiCoherenceProbe` on `GET /v1/roi/executive-summary`, validating disposition-aware scope codes/descriptions against canonical manifest constants, required `basisBreakdown` buckets, and headline math (`totalEstimatedUsdSavings == openEstimatedUsd + needsEvidenceUsd`); Gate 3 PASS/FAIL with per-signal evidence counts.
- **Validation evidence:** `ShipGateRoiCoherenceProbeTests` covers pass, scope-code drift, and headline-math fail paths; `ShipGateEvidenceRunnerTests` covers Gate 3 FAIL when headline math drifts.
- **Affected qualities:** 7, 8.
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1 and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **86.92%** to **87.09%**.

**37) Ship-gate Gate 4 traceability bundle ZIP embed (TB-417)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** extended `ship_gate_export_matrix_contract.v1.json` with `traceability-bundle-zip` probe for `GET /v1/architecture/run/{runId}/traceability-bundle.zip` (ZIP magic-byte validation); Gate 4 export matrix now covers four routes (Markdown, DOCX, run artifact ZIP, traceability audit hand-off ZIP) plus first-value claim lint.
- **Validation evidence:** `ShipGateExportMatrixProbeTests` and `ShipGateEvidenceRunnerTests` cover pass and missing traceability bundle fail paths.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **87.09%** to **87.34%**.

**38) Ship-gate evidence default operational artifact bundle (TB-418)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** default `archlucid pilot ship-gate-evidence --run-id <guid>` auto-writes JSON + Markdown under `artifacts/ship-gate-evidence/{runId}/` when repository root resolves; `ShipGateEvidenceVerdictRollup` adds overall PASS/FAIL/UNKNOWN on the evidence report; `--no-write-artifacts` preserves stdout/API-only runs; explicit `--json-out` / `--markdown-out` override defaults.
- **Validation evidence:** `ShipGateEvidenceOutputPathsTests` covers default, explicit, suppress, and missing-repo paths; `ShipGateEvidenceVerdictRollupTests` covers pass/fail/unknown rollup; `ShipGateEvidenceRunnerTests` asserts overall UNKNOWN when Gate 5 is skipped.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **87.34%** to **87.46%**.

**39) Tenant-isolation negative-test default operational artifact bundle (TB-419)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** default `archlucid pilot tenant-isolation-negative-test` auto-writes JSON + Markdown under `artifacts/tenant-isolation-negative-test/{runId}/` for live runs or `offline-fixture/` for fixture replay when repository root resolves; artifact path metadata included on deny-matrix output; `--no-write-artifacts` preserves stdout/API-only runs; explicit `--json-out` / `--markdown-out` override defaults.
- **Validation evidence:** `TenantIsolationNegativeTestOutputPathsTests` covers default live paths, explicit override, suppress flag, missing repo root, and offline artifact key resolution.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **87.46%** to **87.71%**.

**40) Citation-integrity default operational artifact bundle (TB-420)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** default `archlucid pilot citation-integrity` auto-writes JSON + Markdown under `artifacts/citation-integrity/offline-fixture/` for fixture replay or `artifacts/citation-integrity/live-api/` when `--include-api` is used; artifact path metadata included on sampler output; `--no-write-artifacts` preserves stdout/API-only runs; explicit `--json-out` / `--markdown-out` override defaults; completes assessment §18 first-batch operational artifact promotion alongside TB-418 and TB-419.
- **Validation evidence:** `CitationIntegrityOutputPathsTests` covers default offline paths, explicit override, suppress flag, and live-api artifact key resolution.
- **Affected qualities:** 4, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **87.71%** to **87.90%**.

**41) Buyer-proof evidence ledger default operational artifact bundle (TB-421)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** default `archlucid pilot buyer-proof-evidence-ledger` auto-writes JSON + Markdown under `artifacts/buyer-proof-evidence-ledger/{runId}/` when proof pack includes a run id, or `{proof-pack-name}/` (default `sample-proof-pack`) otherwise; artifact path metadata included on normalized sponsor-send slot output; `--no-write-artifacts` preserves stdout-only runs; explicit `--json-out` / `--markdown-out` override defaults.
- **Validation evidence:** `BuyerProofEvidenceLedgerOutputPathsTests` covers default proof-pack paths, run-id keying, explicit override, suppress flag, and artifact key resolution.
- **Affected qualities:** 3, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **87.90%** to **88.12%**.

**42) Return-trigger telemetry default operational artifact bundle (TB-422)**
- **Status:** shipped (2026-06-29).
- **Implementation summary:** default `archlucid pilot return-trigger-telemetry` auto-writes JSON + Markdown under `artifacts/return-trigger-telemetry/{ledger-name}/` (default `return-trigger-sessions`) when repository root resolves; artifact path metadata included on cohort guardrail output; `--no-write-artifacts` preserves stdout-only runs; explicit `--json-out` / `--markdown-out` override defaults.
- **Validation evidence:** `ReturnTriggerTelemetryOutputPathsTests` covers default ledger paths, explicit override, suppress flag, and artifact key resolution from ledger directory name.
- **Affected qualities:** 1, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **88.12%** to **88.32%**.

**43) Decision-owner scoreboard default operational artifact bundle (TB-423)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** default `archlucid pilot decision-owner-scoreboard` auto-writes JSON, operator Markdown, and sponsor Markdown under `artifacts/decision-owner-scoreboard/{ledger-name}/` (default `sample-ledgers`) when repository root resolves; artifact path metadata included on scoreboard output; `--no-write-artifacts` preserves stdout-only runs; explicit output path flags override defaults; completes operational artifact promotion for all six §17 pilot readiness bundles (TB-418—TB-423).
- **Validation evidence:** `DecisionOwnerScoreboardOutputPathsTests` covers default ledger paths including sponsor Markdown, explicit override, suppress flag, and artifact key resolution.
- **Affected qualities:** 2, 8.
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility vs Frontier AI +1 and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **88.32%** to **88.53%**.

**44) Frontier-AI baseline default operational artifact bundle (TB-424)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** default `archlucid pilot frontier-ai-baseline` auto-writes JSON + Markdown under `artifacts/frontier-ai-baseline/{scoreboard-name}/` (default `frontier-ai-scoreboard`) when repository root resolves; artifact path metadata included on baseline benchmark output; `--no-write-artifacts` preserves stdout-only runs; explicit `--json-out` / `--markdown-out` override defaults; completes operational artifact promotion for all seven §17 pilot readiness CLI bundles (TB-418—TB-424).
- **Validation evidence:** `FrontierAiBaselineOutputPathsTests` covers default scoreboard paths, explicit override, suppress flag, and artifact key resolution from scoreboard file name.
- **Affected qualities:** 1, 2.
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1 and Differentiability / Defensibility vs Frontier AI +1; `(A)` headline readiness rises from **88.53%** to **88.79%**.

**45) Pilot readiness release-train bundle orchestrator (TB-425)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** default `archlucid pilot readiness-bundle` orchestrates all seven §17 pilot readiness CLI bundles (TB-418—TB-424) in-process, writes each child bundle's default JSON + Markdown (and decision-owner sponsor Markdown) under `artifacts/`, and auto-writes aggregate JSON + Markdown under `artifacts/pilot-readiness-bundle/{runId|offline-fixture}/` when repository root resolves; offline fixture replay by default; live ship-gate and tenant-isolation when `--run-id` is supplied; live citation-integrity when `--include-api` is supplied; aggregate PASS/FAIL/UNKNOWN/WARN rollup with SKIPPED ship-gate when `--run-id` is absent; `--no-write-artifacts` preserves stdout-only runs; explicit `--json-out` / `--markdown-out` override aggregate defaults.
- **Validation evidence:** `PilotReadinessBundleOutputPathsTests` covers default offline paths, run-id keying, explicit override, and suppress flag; `PilotReadinessBundleVerdictRollupTests` covers FAIL/UNKNOWN/WARN/PASS rollups; `PilotReadinessBundleRunnerTests` covers offline seven-slot orchestration with ship-gate SKIPPED.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **88.79%** to **88.91%**.

**46) ITSM pull-forward gate default operational artifact bundle (TB-426)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** default `archlucid pilot itsm-pull-forward-gate` auto-writes JSON + Markdown under `artifacts/itsm-pull-forward-gate/{ledger-name}/` (default `paid-pilot-ledgers`) when repository root resolves, or `artifacts/itsm-pull-forward-gate/live-api/` when `--include-api` is used; artifact path metadata included on pull-forward gate output; `--no-write-artifacts` preserves stdout-only runs; explicit `--json-out` / `--markdown-out` override defaults.
- **Validation evidence:** `ItsmPullForwardOutputPathsTests` covers default ledger paths, live-api artifact key resolution, explicit override, and suppress flag.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **88.91%** to **89.04%**.

**47) Pilot readiness release-train CI gate (TB-427)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** `scripts/ci/run_pilot_readiness_release_train_gate.py` runs offline `archlucid pilot readiness-bundle` during `scripts/ci/run_dotnet_fast_core_build.sh` after CLI config lint; validates seven slot keys, offline ship-gate SKIPPED posture, and non-FAIL aggregate verdict; emits `archlucid.pilot-readiness-release-train-gate.v1` JSON on request; fails closed on missing bundle report or aggregate FAIL.
- **Validation evidence:** `test_run_pilot_readiness_release_train_gate.py` covers offline PASS fixture validation, FAIL on overall Fail, ship-gate skip expectation, and skip-cli-run gate harness.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.04%** to **89.16%**.

**48) ITSM pull-forward gate in pilot readiness bundle (TB-428)**
- **Status:** shipped (2026-06-30).
- **Implementation summary:** `archlucid pilot readiness-bundle` now orchestrates eight slots—including `itsm-pull-forward-gate` as the seventh slot before ship-gate—with child JSON + Markdown under `artifacts/itsm-pull-forward-gate/{ledger-name|live-api}/`; HOLD maps to PASS, WATCH to WARN, PULL_FORWARD and missing infrastructure to FAIL; live ITSM health probe when `--include-api` is supplied; release-train CI gate validates eight slot keys.
- **Validation evidence:** `PilotReadinessBundleRunnerTests` covers offline eight-slot orchestration with ITSM slot present; `test_run_pilot_readiness_release_train_gate.py` offline PASS fixture includes `itsm-pull-forward-gate`.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.16%** to **89.28%**.

**49) Pilot readiness live release gate (TB-429)**
- **Status:** shipped (2026-07-01).
- **Implementation summary:** `scripts/ci/run_pilot_readiness_live_release_gate.py` runs live `archlucid pilot readiness-bundle --run-id <guid> [--include-api]` for RC/release evidence; validates eight slots with ship-gate executed (not SKIPPED); emits `archlucid.pilot-readiness-live-release-gate.v1` JSON + Markdown; SKIPPED when `--run-id` absent; strict RC fail-closed when run id missing; wired into `Emit-ReleaseReadinessEvidence.ps1` (`-RepresentativeRunId` / `ARCHLUCID_REPRESENTATIVE_RUN_ID`), `build_rc_evidence_signoff_bundle.py`, release evidence bundle profile, and RC signoff workflow shape validation fixture.
- **Validation evidence:** `test_run_pilot_readiness_live_release_gate.py` covers live PASS fixture validation, ship-gate skip rejection, SKIPPED without run id, and skip-cli-run harness; shared slot validation extracted to `pilot_readiness_bundle_gate_common.py`.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.28%** to **89.40%**.

**50) Pilot readiness live release strict blocker (TB-430)**
- **Status:** shipped (2026-07-01).
- **Implementation summary:** live readiness gate strict RC now blocks WARN/FAIL slot outcomes and strict overall WARN/UNKNOWN; `collect_live_slot_release_blockers` shared helper; release-confidence lane `pilot-readiness-live-bundle`; `Emit-ReleaseReadinessEvidence.ps1` fail-closes strict RC when live gate exits non-zero.
- **Validation evidence:** `test_run_pilot_readiness_live_release_gate.py` covers warn-slot strict failure and warn-blocker helper; `live-warn-bundle.json` fixture.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.40%** to **89.52%**.

**51) First-hour UX audit P0 copy and IA fixes (TB-431 — TB-433)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** reviews list malformed-response state (`RunsPageView`) now renders buyer-safe copy in production with full JSON-shape diagnostics retained only in development; new-review submit-error toast category uses `"New review"` via shared `BUYER_NEW_REVIEW_TOAST_CATEGORY` instead of `"First-pilot intake"`; primary review Actions card no longer surfaces inline pipeline diagnostics — `#agent-forensics` remains in collapsed operator technical disclosure.
- **Validation evidence:** `RunsPageView.test.tsx` covers production vs development malformed copy; `FirstPilotIntakeWizard.test.tsx` asserts buyer-safe toast category; `RunDetailRunActionsSection.test.tsx` asserts pipeline diagnostics link absent from Actions card.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.52%** to **89.65%**.

**52) Onboarding page title and lead copy (TB-434)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `/onboarding` hero `<h1>` and left-nav label now use shared `BUYER_ONBOARDING_PAGE_TITLE` (`"Getting started"`) via `OPERATOR_NAV_LINK_LABELS.onboarding`; lead copy uses `BUYER_ONBOARDING_PAGE_LEAD` (`"Create and finalize your first architecture review package."`); breadcrumbs and `ROUTE_TITLES` stay aligned through the nav label constant.
- **Validation evidence:** `OnboardingPageView.test.tsx` asserts buyer-safe title/lead without intake or committed-package jargon; `pilot-nav-group-builder.test.ts`, `SidebarNav.test.tsx`, and `operator-client-pages-render-gate.test.tsx` updated for nav/page title consistency.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.65%** to **89.78%**.

**53) Onboarding walkthrough help link label (TB-435)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Getting started progress section help link now uses shared `BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK` (`"Architecture review walkthrough"`) instead of `"First-pilot operator path — full walkthrough"`; `helpSlug="first-pilot-path"` unchanged for routing.
- **Validation evidence:** `OnboardingPageView.test.tsx` asserts buyer-safe walkthrough label and absence of pilot/operator-path jargon in progress help links.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.78%** to **89.91%**.

**54) Review detail Deliverables section title and default-open (TB-436)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `RunDetailArtifactsExportsSection` now always titles the collapsible section `"Deliverables"` via shared `BUYER_MANIFEST_DELIVERABLES_HEADING`; operator shell (`buyerPolishedArtifactTable === false`) keeps `defaultOpen={true}`; buyer-polished shell retains collapsed default.
- **Validation evidence:** `RunDetailArtifactsExportsSection.test.tsx` covers Deliverables title in both shells and open/collapsed default state on the native `<details>` element.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **89.91%** to **90.04%**.

**55) Unified new-review submit CTA (TB-437)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** shared `BUYER_START_ARCHITECTURE_REVIEW_CTA` (`"Start architecture review"`) replaces `"Start analysis"` on `FirstPilotIntakeWizard` and `"Start Architecture Review"` on `QuickStartWizard`; reviews-list CTA unchanged.
- **Validation evidence:** `FirstPilotIntakeWizard.test.tsx` and `QuickStartWizard.test.tsx` assert the shared submit label.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **90.04%** to **90.17%**.

**56) Review feedback nav and page title (TB-456)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_TERMINOLOGY.evaluationFeedback` changes from `"Pilot feedback"` to `"Review feedback"`; system-admin nav, `/product-learning` `<h2>`, page metadata, and breadcrumbs update via shared vocabulary.
- **Validation evidence:** `operator-client-pages-render-gate.test.tsx` asserts `"Review feedback"` page heading; `buyer-surface-vocabulary.test.ts` asserts nav label maps to shared terminology.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **90.17%** to **90.30%**.

**57) Review value report nav and breadcrumbs (TB-457)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_TERMINOLOGY.evaluationValueReport` changes from `"Evaluation value report"` to `"Review value report"`; system-admin nav, `/value-report/pilot` page title, and breadcrumb map update via shared vocabulary.
- **Validation evidence:** `buyer-surface-vocabulary.test.ts` asserts nav label maps to shared terminology; `PilotValueReportPageView` and `breadcrumb-map.ts` consume `BUYER_TERMINOLOGY.evaluationValueReport`.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **90.30%** to **90.43%**.

**58) Review standards outcome card label (TB-458)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards` changes from `"Evaluation standards"` to `"Review standards"`; `RunDetailOutcomeCards` and `RunDetailManifestSummarySection` field labels update for streamlined Core Pilot path users.
- **Validation evidence:** `core-pilot-path-vocabulary.test.ts` keeps streamlined copy free of banned governance phrases; outcome card consumers read the shared vocabulary constant.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **90.43%** to **90.56%**.

**59) Audit trail integrity note — remove demo language (TB-459)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `AUDIT_TRAIL_INTEGRITY_NOTE` replaces commit/hash-chain/demo-integrity copy with buyer-safe finalize-oriented language; `AuditTrailIntegrityNote` on `/governance/audit` renders the updated constant.
- **Validation evidence:** note text contains no `"demo"` or `"demo integrity tools"`; uses `"finalize"` per copy/terminology audit acceptance criteria.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **90.56%** to **90.69%**. Q10 Adoption Friction reaches **100** (weighted deficiency signal **0**).

**60) Multi-cloud cost evidence footnote (TB-460)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_EXECUTIVE_SUMMARY_VOCABULARY.costEvidenceNotConfiguredFootnote` changes from Azure-only to `"Add cost evidence (Azure, AWS, or GCP spend data) to estimate savings and ROI."`; `executive-roi-kpi-display.ts` footnote paths consume the shared constant.
- **Validation evidence:** footnote names Azure, AWS, and GCP; no Azure-only language when cost evidence is not configured.
- **Affected qualities:** 8 (Q10 already **100** — no further Adoption Friction increment).
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1; `(A)` headline readiness rises from **90.69%** to **90.77%**.

**61) AWS/GCP wizard cloud-target labels (TB-481)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepIdentity` AWS/GCP `<SelectItem>` labels change from `"intent capture — V1.1 deep analysis"` to `"cloud inventory ZIP available"`; cloud-target hint tooltip removes V1.1 deferral language and states accelerated ZIP availability.
- **Validation evidence:** `WizardStepIdentity.test.tsx` asserts ZIP-available option labels and absence of `V1.1` in the step surface.
- **Affected qualities:** 8 (Q10 already **100** — no further Adoption Friction increment).
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1; `(A)` headline readiness rises from **90.77%** to **90.85%**.

**62) Wizard evidence step defaults to brief (TB-482)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepEvidenceUpload` initial `selectedSourceId` changes from `"azure-export"` to `"brief"`; brief panel renders on mount with ring-selected card; cloud inventory upload panel appears only after explicit source selection.
- **Validation evidence:** `WizardStepEvidenceUpload.test.tsx` asserts brief `aria-checked`, brief panel visible, and no inventory panel on first render.
- **Affected qualities:** 8 (Q10 already **100** — no further Adoption Friction increment).
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1; `(A)` headline readiness rises from **90.85%** to **90.93%**. Q8 Executive / Operator Comprehension reaches **100** (weighted deficiency signal **0**).

**63) Core Pilot step 4 multi-cloud inventory copy (TB-483)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CORE_PILOT_STEPS[3]` title changes to `"Upload cloud inventory evidence"` and shortBody acknowledges Azure/AWS/GCP inventory ZIPs with brief-only skip path; 90-minute playbook keyword alignment updates to `"inventory zip"`.
- **Validation evidence:** `core-pilot-steps.test.tsx` asserts multi-cloud step 4 copy; `first-review-90min-playbook-alignment.test.ts` keyword guard updated.
- **Affected qualities:** 4 (Q8 and Q10 already **100** — rescored via Correctness & Evidence Integrity).
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **90.93%** to **91.05%**.

**64) Baseline-first wizard notice — cloud inventory ZIP (TB-484)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepPreset` baseline-first notice changes from Azure extractor ZIP to `"upload a cloud inventory ZIP on the next step"` when `baselineFirst === true` (`?baseline=1`).
- **Validation evidence:** `WizardStepPreset.test.tsx` asserts cloud inventory notice text and absence of `"azure"` in the notice.
- **Affected qualities:** 4 (Q8 and Q10 already **100**).
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **91.05%** to **91.17%**.

**65) Wizard optional enrichment — multi-cloud inventory (TB-485)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepAzureContext` collapsible label changes to `"Add cloud inventory ZIP"`; inner copy removes Azure-only ARM/`ResourceGroupScope` guidance; `CloudInventoryExtractorCommandPanel` replaces `AzureExtractorQuickStartCommandPanel` and follows the wizard `cloudProvider` selection (Aws/Gcp/Azure).
- **Validation evidence:** `WizardStepAzureContext.test.tsx` asserts cloud-agnostic toggle label, Azure default command panel, and AWS command panel when `cloudProvider` is Aws.
- **Affected qualities:** 6 (Q8, Q10, and Q4 at prior caps — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.17%** to **91.27%**.

**66) WizardStepIdentity multi-cloud footer hint (TB-486)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** cloud-target footer hint on `WizardStepIdentity` names Azure, AWS, and GCP inventory ZIP acceleration instead of Azure-only export language.
- **Validation evidence:** `WizardStepIdentity.test.tsx` asserts multi-cloud footer copy and absence of `"Azure export accelerates"`.
- **Affected qualities:** 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **91.27%** to **91.39%**.

**67) Demo evidence source copy (TB-487)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** demo panel on `WizardStepEvidenceUpload` replaces `"bundled synthetic Azure extractor package"` with `"bundled example review scenario — no scripts or uploads required"`.
- **Validation evidence:** `WizardStepEvidenceUpload.test.tsx` asserts demo panel copy and absence of `"azure extractor package"`.
- **Affected qualities:** 6.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.39%** to **91.49%**.

**68) AzureExtractorPackageZipField label and Azure-only guard (TB-488)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** visible label changes from `"Azure packager ZIP"` to `"Cloud inventory ZIP"`; JSDoc warns that `cloudProvider: "Azure"` side-effect makes the field Azure-only and must not be reused on AWS/GCP paths.
- **Validation evidence:** component source review; label and aria-label updated; long-term multi-cloud extraction noted for V1.1.
- **Affected qualities:** 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **91.49%** to **91.61%**.

**69) InProductEvidenceChecklist service connectivity label (TB-489)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** first-run evidence checklist row label changes from `"API reachable (/health/ready)"` to `"Service connectivity"`; troubleshoot action unchanged.
- **Validation evidence:** `InProductEvidenceChecklist.test.tsx` asserts `"Service connectivity"` and absence of `/health/ready` in rendered labels.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.61%** to **91.71%**.

**70) Tier1InventoryZipUploadPanel plain-language drop hint (TB-490)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** drop-zone hint removes `manifest.json`, `schemaVersion`, and `resources.json` from happy-path guidance; validation failures still surface schema detail via `Tier1InventoryZipValidationCallout`.
- **Validation evidence:** component source review; error path unchanged.
- **Affected qualities:** 6.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.71%** to **91.81%**.

**71) Remove Tier-1 from wizard evidence descriptions (TB-491)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepEvidenceUpload` step description and `wizard-evidence-source-options` Azure/AWS/GCP option descriptions drop internal `"Tier-1"` tier label.
- **Validation evidence:** source review; internal tier naming retained in code comments and test names only.
- **Affected qualities:** 6.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.81%** to **91.91%**.

**72) FindingTrustChip no-evidence guidance (TB-492)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `citation-missing` chip label changes to `"No evidence linked"`; tooltip adds guidance to add evidence or re-run for traceability.
- **Validation evidence:** `FindingTrustChip.test.tsx` asserts new label and actionable tooltip fragment.
- **Affected qualities:** 6.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **91.91%** to **92.01%**.

**73) Core Pilot step 4 document/brief-only acknowledgment (TB-493)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CORE_PILOT_STEPS[3]` `shortBody` marks cloud inventory optional for document/brief-only reviews; `detail` adds explicit skip guidance with cost-confidence caveat.
- **Validation evidence:** `core-pilot-steps.test.ts` asserts new `shortBody` and skip sentence in `detail`.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.01%** to **92.11%**.

**74) Operator shell DOCX download label (TB-438)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** primary DOCX button in `RunDetailArtifactsExportsSection` changes from `"Download Sponsor Export (DOCX)"` to `"Download architecture review report (DOCX)"`; buyer-polished `"Download evidence package"` label unchanged.
- **Validation evidence:** `RunDetailArtifactsExportsSection.test.tsx` asserts new operator-shell link label.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.11%** to **92.21%**.

**75) Deliverables empty-state copy and reload (TB-439)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** pre-finalize empty state title changes to `"No deliverables yet"`; body uses finalized-review language; `OperatorSectionRetryButton` with `"Reload"` label added; decision-receipt infeasible empty state unchanged.
- **Validation evidence:** `RunDetailArtifactsExportsSection.test.tsx` asserts new title, body, and Reload button; decision-receipt test unchanged.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.21%** to **92.31%**.

**76) New-review page outcome-oriented lead (TB-440)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `NewRunPage` lead paragraph changes to diagram/document Quick start vs ArchLucid-guided Guided framing; removes undefined architecture brief, evidence file, and Guided intake terms from the page lead.
- **Validation evidence:** `page.test.tsx` asserts new lead copy and absence of architecture brief / Guided intake in the lead paragraph.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.31%** to **92.41%**.

**77) Focused review scope toggle and accordion (TB-441)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `focusedPilotToggleLabel` becomes `"Focused review scope"`; `firstIntakeAdvancedNote` drops pilot wording; `FirstPilotIntakeWizard` accordion trigger becomes `"Review scope (optional)"`.
- **Validation evidence:** `core-pilot-path-vocabulary.test.ts` and `FirstPilotIntakeWizard.test.tsx` assert new labels and absence of pilot mode in the accordion surface.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.41%** to **92.51%**.

**78) Move CLI tools off onboarding to Settings developer (TB-442)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** removes Developer/CLI tools disclosure from `OnboardingOptionalSetupSection`; adds `/settings/developer` with `TryCliDemoCard` and link from general Settings index.
- **Validation evidence:** `OnboardingOptionalSetupSection.test.tsx` asserts absence of CLI section; `settings/developer/page.test.tsx` asserts card on developer route.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.51%** to **92.61%**.

**79) Continue setup home card copy and CTA (TB-443)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `OperatorHomeContinueSetupCard` body drops evidence-checklist jargon for reviewer access and cloud connections; CTA changes to `"Continue getting started"` linking to `/onboarding`; card wired on operator home below advanced guidance.
- **Validation evidence:** `OperatorHomeContinueSetupCard.test.tsx` asserts new body, CTA label, and absence of evidence checklist text.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.61%** to **92.71%**.

**80) New-review header Review guide link (TB-444)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `NewRunPage` `InAppHelpLink` label changes from `"Full pilot guidance"` to `"Review guide"`; `helpSlug="pilot-guide"` unchanged.
- **Validation evidence:** `page.test.tsx` asserts Review guide link and absence of pilot guidance label text.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.71%** to **92.81%**.

**81) Deliverables section description without manifest jargon (TB-445)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `RunDetailArtifactsExportsSection` description changes to review-package decisions, findings, and supporting evidence language; removes manifest and structured metadata terms.
- **Validation evidence:** `RunDetailArtifactsExportsSection.test.tsx` asserts new description and absence of manifest in operator-shell deliverables intro.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.81%** to **92.91%**.

**82) Review Actions evidence package ZIP label (TB-446)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `RunDetailRunActionsSection` secondary download CTA changes from `"Download traceability bundle (ZIP)"` to `"Download evidence package (ZIP)"`; URL and behavior unchanged.
- **Validation evidence:** `RunDetailRunActionsSection.test.tsx` asserts evidence package link label and absence of traceability bundle label.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **92.91%** to **93.01%**.

**83) Invite-reviewer footer without API keys (TB-447)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Restores dedicated `/settings/roles/invite-reviewer` page with `InviteReviewerPageView`; footer changes from developer-facing API keys language to `"Need to manage users or permissions? Open Users and roles."`; link target `/settings/roles?tab=users` unchanged.
- **Validation evidence:** `InviteReviewerPageView.test.tsx` and `invite-reviewer-flow.test.ts` assert buyer-safe footer copy and absence of API keys.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **93.01%** to **93.11%**.

**84) Home page step 2 label without missing-evidence wording (TB-448)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PILOT_PATH_PREVIEW_STEPS` step 2 label changes from `"Review findings and missing evidence"` to `"Review findings and add supporting evidence"` in `buyer-polish-copy.ts`.
- **Validation evidence:** `review-terminology-guard.test.ts` asserts new label and absence of `"missing evidence"`; `PilotCommandCenterCard.test.tsx` renders updated stepper labels from the shared const.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1; `(A)` headline readiness rises from **93.11%** to **93.21%**.

**85) Reviews-list subtitle reflects full lifecycle (TB-449)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `RUNS_LIST_PAGE_SUBTITLE` in `i18n.ts` changes from finalized-only wording to `"Architecture review packages — in progress, finalized, and ready for export."`
- **Validation evidence:** `i18n.test.ts` asserts lifecycle-inclusive subtitle and absence of finalized-only lead phrasing.
- **Affected qualities:** 6 (Q10 already **100** — rescored via Time-to-Value).
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1 (capped at **100**); `(A)` headline readiness rises from **93.21%** to **93.31%**.

**86) New-review first-run banner and More options label (TB-450)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CORE_PILOT_PATH_STREAMLINED_LABELS.streamlinedFirstReviewBanner` changes to quick-path/review-scope copy; `ReviewsNewPathSwitcher` button label changes from `"More intake options"` to `"More options"`.
- **Validation evidence:** `core-pilot-path-vocabulary.test.ts` and `ReviewsNewPathSwitcher.test.tsx` assert absence of intake, evaluation standards, and pilot on the first-run banner.
- **Affected qualities:** 4 (Q6 and Q10 already **100** — rescored via Correctness & Evidence Integrity).
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 (capped at **100**); `(A)` headline readiness rises from **93.31%** to **93.43%**.

**87) Sample preview lead uses architecture document (TB-451)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `OPERATOR_HOME_SAMPLE_FINDINGS_LEAD` in `buyer-polish-copy.ts` changes from `"architecture request"` / `"governance actions"` to `"architecture document"` / `"governance decisions"`.
- **Validation evidence:** `OperatorHomeSampleReviewPreview.test.tsx` asserts updated lead copy and absence of `"architecture request"`.
- **Affected qualities:** 3 (Q4, Q6, Q8, and Q10 already **100** — rescored via Governed Review Integrity).
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1; `(A)` headline readiness rises from **93.43%** to **93.56%**.

**88) Actions card meta-description removed (TB-452)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Removes `CardDescription` navigation meta-copy (Deliverables cross-reference, scorecard generation, traceability ZIP jargon) from `RunDetailRunActionsSection`; action buttons unchanged.
- **Validation evidence:** `RunDetailRunActionsSection.test.tsx` asserts absence of meta-description copy and presence of evidence package download CTA.
- **Affected qualities:** 9 (Q4, Q6, Q8, and Q10 already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **93.56%** to **93.63%**.

**89) First-pilot intake submit validation toast (TB-453)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE` in `FirstPilotIntakeWizard.tsx` changes from `"evidence file"` jargon to `"Add a review title and upload at least one architecture document, or fill in the description."`
- **Validation evidence:** `FirstPilotIntakeWizard.test.tsx` asserts buyer-safe validation copy and absence of `"evidence file"`.
- **Affected qualities:** 3 (Q4, Q6, Q8, and Q10 already **100** — rescored via Governed Review Integrity).
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 (capped at **100**); `(A)` headline readiness rises from **93.63%** to **93.76%**.

**90) Optional-setup CTAs as outline buttons (TB-454)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PilotCommandCenterCard` optional-setup row replaces low-contrast plain anchors with outline `Button` links for Connect Azure and Invite reviewer while keeping the primary Start review CTA dominant.
- **Validation evidence:** `PilotCommandCenterCard.test.tsx` and `adoption-friction-ui.test.tsx` assert border/outline affordance on optional-setup links and unchanged href targets.
- **Affected qualities:** 9 (Q3, Q4, Q6, Q8, and Q10 already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **93.76%** to **93.83%**.

**91) Not-found review page heading without generation jargon (TB-455)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `REVIEW_PACKAGE_OPEN_FAILURE_HEADING` exported from `review-generation-handoff.ts`; run-detail not-found and `RunDetailPageFetchErrorView` use `"Architecture review — package could not be opened"` instead of Review generation / generated package wording.
- **Validation evidence:** `review-generation-handoff.test.ts` asserts buyer-safe heading and absence of generation jargon.
- **Affected qualities:** 9 (Q3, Q4, Q6, Q8, and Q10 already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **93.83%** to **93.90%**.

**92) Hero step 3 Finalize review package label (TB-461)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PILOT_PATH_PREVIEW_STEPS[2].label` in `buyer-polish-copy.ts` changes from `"Commit review package"` to `"Finalize review package"`.
- **Validation evidence:** `core-pilot-path-vocabulary.test.ts` asserts finalize step label and absence of commit in step 3 copy.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **93.90%** to **94.03%**.

**93) Executive scorecard Finalized reviews label (TB-462)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL` in `buyer-polish-copy.ts` changes from `"Committed reviews"` to `"Finalized reviews"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` and executive scorecard snapshot assert finalized label.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **94.03%** to **94.16%**.

**94) Executive dashboard empty states finalize vocabulary (TB-463)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_EXECUTIVE_SUMMARY_VOCABULARY.emptyStateDescription` and `portfolioMetricsUnavailableDescription` in `buyer-surface-vocabulary.ts` replace commit with finalize for review-package actions.
- **Validation evidence:** `buyer-surface-vocabulary.test.ts` asserts neither string contains commit in reference to review finalization.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **94.16%** to **94.25%**.

**95) Evidence graph subtitle finalized review package (TB-464)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `OPERATOR_GRAPH_PAGE_SUBTITLE` in `buyer-polish-copy.ts` replaces `"committed review package"` with `"finalized review package"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts finalized subtitle and absence of committed in graph page copy.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **94.25%** to **94.35%**.

**96) Home hero lead optional cloud connection (TB-465)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PILOT_COMMAND_CENTER_LEAD` in `buyer-polish-copy.ts` replaces `"optional Azure import"` with `"optional cloud connection"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts cloud connection wording and absence of Azure in hero lead.
- **Affected qualities:** 9 (several headline qualities already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **94.35%** to **94.42%**.

**97) Connect cloud optional-setup CTA (TB-466)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PILOT_COMMAND_CENTER_CONNECT_AZURE` in `buyer-polish-copy.ts` changes from `"Connect Azure"` to `"Connect cloud"`; `PilotCommandCenterCard` link destination remains `CLOUD_CONNECTIONS_PATH` (`/integrations/cloud-connections`).
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts`, `PilotCommandCenterCard.test.tsx`, and `onboarding-secondary-surfaces.test.ts` assert Connect cloud label and unchanged cloud-connections route.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **94.42%** to **94.55%**.

**98) Cloud connections nav label migration (TB-467)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Nav group builders already use `OPERATOR_NAV_LINK_LABELS.cloudConnections`; `azureCloudConnection` marked `@deprecated` in `i18n.ts` with canonical `cloudConnections` label retained.
- **Validation evidence:** `nav-config.structure.test.ts` asserts `/integrations/cloud-connections` renders `"Cloud connections"` and no flattened nav label equals deprecated `"Azure cloud connection"`.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **94.55%** to **94.68%**.

**99) Executive value report page title (TB-468)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_VALUE_REPORT_PAGE_TITLE` in `buyer-polish-copy.ts` changes from `"Sponsor value report"` to `"Executive value report"`; subtitle replaces `"sponsor-ready report"` with `"executive-ready report"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts executive title and executive-ready subtitle without sponsor framing.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **94.68%** to **94.77%**.

**100) Product concepts glossary dialog description (TB-469)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION` in `buyer-polish-copy.ts` replaces `"during a pilot"` framing with `"terms you will encounter in your architecture reviews — open on demand."`
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts exact description and absence of pilot in glossary dialog copy.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **94.77%** to **94.87%**.

**101) Why ArchLucid sponsor pack source line (TB-470)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE` in `buyer-polish-copy.ts` replaces seeded Claims Intake attribution with example-review framing paired to the evidence pack service.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` and Why ArchLucid page snapshot assert absence of seeded/seed in source attribution copy.
- **Affected qualities:** 9 (several headline qualities already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **94.87%** to **94.94%**.

**102) Open example review home card copy (TB-471)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_HOME_START_CTO_DEMO_HEADING`, `BUYER_HOME_START_CTO_DEMO_CTA`, and `BUYER_HOME_START_CTO_DEMO_ARIA` in `buyer-polish-copy.ts` change from `"Start CTO demo"` to `"Open example review"`; presenter-only CTO demo tour strings unchanged.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` and `StartCtoDemoCard.test.tsx` assert Open example review heading, CTA, and aria label without CTO demo in visible home card copy.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **94.94%** to **95.07%**.

**103) Governance preview connected workspace note (TB-472)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE` in `buyer-polish-copy.ts` replaces `"live pilot"` and `"demonstration purposes"` with connected-workspace production framing.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts exact note copy and absence of live pilot / demonstration purposes.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **95.07%** to **95.20%**.

**104) Example review AHA card badge (TB-473)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `SAMPLE_REVIEW_AHA_DEMO_LABEL` in `buyer-polish-copy.ts` changes from `"Demo-derived sample"` to `"Example review"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts Example review label and absence of demo-derived on AHA card badge copy.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **95.20%** to **95.29%**.

**105) Example review defensible-layer caption (TB-474)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER` in `buyer-polish-copy.ts` replaces `"Demo-derived sample only"` execution-mode caption with example-review workspace copy.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts caption copy and absence of demo-derived, execution mode, and evidence basis jargon.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **95.29%** to **95.39%**.

**106) Rule-based analysis simulator trust badge (TB-475)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_SIMULATOR_TRUST_BADGE_LABEL` in `buyer-polish-copy.ts` changes from `"Simulator mode"` to `"Rule-based analysis — findings match live-mode structure; cost estimates are illustrative."`; tooltip unchanged.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` and `CtoDemoSimulatorTrustBadge.test.tsx` assert Rule-based analysis badge label and preserved tooltip technical explanation.
- **Affected qualities:** 9 (several headline qualities already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **95.39%** to **95.46%**.

**107) Onboarding step tracker Finalize checkpoint label (TB-476)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `buildFirstReviewCheckpointStrip` in `CorePilotNextStepsCard.tsx` changes commit checkpoint display label from `"Commit"` to `"Finalize"`; checkpoint `id` remains `"commit"`.
- **Validation evidence:** `CorePilotNextStepsCard.test.tsx` asserts Finalize link in first-review checkpoint strip.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **95.46%** to **95.59%**.

**108) Roles settings Finalize reviews permission label (TB-477)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CUSTOM_ROLE_PERMISSION_GROUPS` in `custom-role-permission-groups.ts` changes `Runs.Commit` display label from `"Commit reviews"` to `"Finalize reviews"`; permission id unchanged.
- **Validation evidence:** `custom-role-permission-groups.test.ts` asserts Finalize reviews label and absence of commit in permission copy.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **95.59%** to **95.72%**.

**109) Service bus banner System health link label (TB-478)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `SERVICE_BUS_HEALTH_LABELS.systemHealthLink` in `i18n.ts` changes from `"System health (operators)"` to `"System health"`.
- **Validation evidence:** `ServiceBusHealthBanner.test.tsx` asserts System health link without operators qualifier when banner is visible.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **95.72%** to **95.81%**.

**110) Workspace list unavailable session copy (TB-479)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_SCOPE_LIST_UNAVAILABLE` in `buyer-polish-copy.ts` replaces `"active for the demonstration"` with `"active for this session"`.
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts session copy and absence of demonstration/demo jargon.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **95.81%** to **95.91%**.

**111) Demo latency exceeded example review copy (TB-480)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `BUYER_CTO_DEMO_LATENCY_EXCEEDED` in `buyer-polish-copy.ts` changes from `"Exceeded demo latency budget — switch to seeded showcase"` to `"Taking longer than expected — switch to example review."`
- **Validation evidence:** `buyer-polish-copy-pilot-outcomes.test.ts` asserts example review fallback copy and absence of seeded/showcase jargon.
- **Affected qualities:** 9 (several headline qualities already **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **95.91%** to **95.98%**.

**112) AzureExtractorZipDropZone multi-cloud JSDoc (TB-494)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `@deprecated` JSDoc on `AzureExtractorZipDropZone` documents Azure historical naming, safe multi-cloud inventory ZIP handling, intentional `Tier1InventoryZipUploadPanel` reuse, and planned V1.1 rename to `InventoryZipDropZone`.
- **Validation evidence:** source JSDoc on `AzureExtractorZipDropZone.tsx` satisfies integrations/evidence audit E14 acceptance.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **95.98%** to **96.11%**.

**113) Wizard CloudInventoryExtractorCommandPanel migration (TB-495)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `AzureExtractorPackageZipField` baseline and ingest variants import `CloudInventoryExtractorCommandPanel` with `platform="azure"`; `WizardStepAzureContext` already used the multi-cloud panel; `@deprecated` JSDoc added to `AzureExtractorQuickStartCommandPanel` for remaining extract-upload settings route.
- **Validation evidence:** `AzureExtractorPackageZipField.test.tsx` asserts azure platform panels for baseline and ingest variants.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **96.11%** to **96.24%**.

**114) buildReadinessCloudEvidenceSummary rename (TB-496)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `onboarding-secondary-surfaces.ts` exports canonical `buildReadinessCloudEvidenceSummary`; `buildReadinessAzureExtractorSummary` retained as deprecated alias; `first-pilot-readiness-cockpit.ts` and tests updated to canonical name.
- **Validation evidence:** `onboarding-secondary-surfaces.test.ts` asserts multi-cloud script guidance and updated surface violation scan key.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **96.24%** to **96.33%**.

**115) Wizard skip evidence helper text (TB-497)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `WizardStepEvidenceUpload` renders helper copy near `"Skip evidence for now"` explaining evidence can be added later from review detail and that findings without evidence may have lower confidence.
- **Validation evidence:** `WizardStepEvidenceUpload.test.tsx` asserts skip-context helper text and skip button co-location for inventory evidence sources.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **96.33%** to **96.43%**.

**116) READINESS_CLOUD_EVIDENCE_LABEL alias (TB-498)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `onboarding-secondary-surfaces.ts` exports canonical `READINESS_CLOUD_EVIDENCE_LABEL`; `READINESS_AZURE_EXTRACTOR_LABEL` retained as deprecated alias; `first-pilot-readiness-cockpit.ts` and `home-readiness-row-present.ts` updated to canonical export.
- **Validation evidence:** `onboarding-secondary-surfaces.test.ts` asserts canonical cloud evidence label export.
- **Affected qualities:** 9 (Q9 reaches **100** — rescored via Runtime & First-Review Reliability).
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **96.43%** to **96.50%**.

**117) Evidence checklist Open setup guide link (TB-499)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `InProductEvidenceChecklist` link anchor changes from `"Full walkthrough"` to `"Open setup guide"` for first-run evidence checklist runbook destination.
- **Validation evidence:** `InProductEvidenceChecklist.test.tsx` asserts Open setup guide link and absence of Full walkthrough anchor.
- **Affected qualities:** 1 (Q9 now **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **96.50%** to **96.63%**.

**118) DemoReviewScenarioId cloud-agnostic aliases (TB-500)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `arch-lucid-azure-extractor-demo-scenarios.ts` exports canonical `DemoReviewScenarioId` and `DEFAULT_DEMO_REVIEW_SCENARIO_ID`; Azure-only type/const names deprecated; `WizardStepEvidenceUpload` and `AzureExtractorPackageZipField` import cloud-agnostic names.
- **Validation evidence:** `arch-lucid-azure-extractor-demo-scenarios.test.ts` asserts canonical default alias; wizard files no longer import Azure-specific demo scenario identifiers.
- **Affected qualities:** 2 (several headline qualities already **100** — rescored via Differentiability / Defensibility).
- **Classification:** V1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1; `(A)` headline readiness rises from **96.63%** to **96.76%**.

**119) Governance quick approve audit comment (TB-501)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `GovernanceQuickApproveButton` batch-review `reviewComment` changes from quick-approve/lineage-snapshot jargon to `"Approved — no critical or high findings present at time of review."`
- **Validation evidence:** `GovernanceQuickApproveButton.test.tsx` asserts formal reviewComment on successful batch-review approve.
- **Affected qualities:** 7 (several headline qualities already **100** — rescored via Proof-of-ROI Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **96.76%** to **96.85%**.

**120) CTO demo audit integrity demo disclaimer (TB-502)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `CtoDemoAuditIntegrityVerifyButton` renders demo-data disclaimer with `data-testid="cto-demo-audit-integrity-demo-disclaimer"` below Chain intact verification result.
- **Validation evidence:** `CtoDemoAuditIntegrityVerifyButton.test.tsx` asserts disclaimer copy after successful showcase chain verification.
- **Affected qualities:** 5 (several headline qualities already **100** — rescored via AI / Agent Readiness).
- **Classification:** V1 engineering.
- **Rescore impact:** AI / Agent Readiness +1; `(A)` headline readiness rises from **96.85%** to **96.95%**.

**121) Governance quick approve confirmation dialog (TB-503)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `GovernanceQuickApproveDialog` shows approval subject, run ID, and no critical/high findings snapshot; optional approver note replaces default TB-501 review comment when provided; `GovernanceQuickApproveButton` opens dialog before batch-review submit.
- **Validation evidence:** `GovernanceQuickApproveButton.test.tsx` asserts two-step dialog confirm flow, default review comment, and custom approver note as `reviewComment`.
- **Affected qualities:** 1 (several headline qualities already **100** — rescored via Decision-Changing Insight Density).
- **Classification:** V1 engineering.
- **Rescore impact:** Decision-Changing Insight Density +1; `(A)` headline readiness rises from **96.95%** to **97.08%**.

## 18. Prompt Batching Guidance
- **First batch (strong-model-recommended):** ship-gate evidence harness, tenant-isolation negative-test bundle, and citation-integrity sampler.
- **Second batch (safe-for-Sonnet):** operator first-review checkpoint strip plus ROI explanation hardening.
- **Third batch (safe-for-Composer):** copy/packet consistency and telemetry instrumentation polish after validation findings.

## 19. Model Usage Guidance
- **Composer-safe:** copy cleanup, minor UI text alignment, straightforward status rendering.
- **Sonnet-safe:** contained workflow/UI refinements and small service-layer orchestration updates.
- **Strong-model-recommended:** strategic assessment updates, policy-aware moat evaluation, cross-surface reliability and traceability refactors.
- **Opus-or-Gemini-assessment-recommended:** future full strategic clean-slate reassessment and survivability re-rating after new market evidence.

## 20. Pending Questions For Later
- **Blocks V1**
  - None confirmed yet; unresolved ship-gate unknowns must be tested before asserting full PASS.
- **Blocks V1.1**
  - None in this pass; connector/MCP/commercial sequencing remains backlog-governed.
- **Requires customer validation**
  - Does policy-pack variation change real buyer decisions repeatedly?
  - Do principal architects voluntarily return after first use?
  - Does one executive proof packet survive real procurement challenge?
- **Requires founder decision**
  - Threshold for pulling forward any V1.1 connector depth based on paid pilot evidence.
  - Explicit evidence threshold to claim sustained decision advantage vs frontier-AI-only workflow.

## Appendix A - Author Signal (Qualitative, Non-Headline)
The product demonstrates strong principal-architect judgment in its insistence on policy-aware governance, evidence traceability, and auditability instead of generic AI commentary. The strongest author signal is not feature breadth; it is disciplined emphasis on governed decision infrastructure. The remaining risk is mostly market proof velocity, not conceptual clarity.
