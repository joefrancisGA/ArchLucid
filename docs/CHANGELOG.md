> **Scope:** ArchLucid changelog - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](START_HERE.md).


# ArchLucid changelog

**Buyer shorthand (rolling):** recent entries below also call out **security / audit**, **governance & exports**, **integrations / connectors**, and **operational controls** when they change ï¿½ scan section headings for *Admin*, *Audit*, *Governance*, *OpenAPI*, *Terraform*, and *support bundle*.

Release entries newest-first. Each section condenses the detailed prompt logs preserved in `docs/archive/`.


## 2026-08-08 - UI: Digests Subscriptions tab Evidence notes (AIS)

- `/architecture/digests?tab=subscriptions` (AIS) inherits ARD Evidence chrome; traffic Notes score **48** (tab surface).

## 2026-08-08 - UI: Digests Schedule tab Evidence notes (ARS)

- `/architecture/digests?tab=schedule` (ARS) DigestsScheduleEvidenceOrientationStrip; traffic Notes score **52**. Template row **DIS → ARS**; subscriptions id **ARS → AIS**.

## 2026-08-08 - UI: Digests Browse tab Evidence notes (ARB)

- `/architecture/digests?tab=browse` (ARB) inherits ARD Evidence chrome; traffic Notes score **48** (tab surface).

## 2026-08-08 - UI: Architecture digests hub Evidence notes (ARD)

- `/architecture/digests` (ARD) traffic Notes score **71** — documents existing DigestsHubClient Evidence chrome. Template row **DI → ARD**; browse tab id **ARD → ARB**.

## 2026-08-08 - UI: Users Users tab Evidence notes (SSU)

- `/administration/users?tab=users` (SSU) inherits AUX Evidence chrome; traffic Notes score **48** (tab surface).

## 2026-08-08 - UI: Users Roles tab Evidence notes (SER)

- `/administration/users?tab=roles` (SER) inherits AUX Evidence chrome; traffic Notes score **48** (tab surface). Template row **SRX → SER**.

## 2026-08-08 - UI: Users API keys tab Evidence notes (SEU)

- `/administration/users?tab=keys` (SEU) inherits AUX Evidence chrome; traffic Notes score **48** (tab surface). Template row **SEK → SEU**.

## 2026-08-08 - UI: Restore governance/dashboard topic-map after PIL scoop

- Restored secondary-hub `/governance/dashboard` topic-map entry (Workspace overview / TB-2050) scooped during PIL Evidence commit.

## 2026-08-08 - UI: Pilot nav profile help Evidence notes (PIL)

- `/help/pilot-nav-profile` (PIL) Category-1 + topic map + `PilotNavProfileHelpEvidenceOrientationStrip`; traffic Notes score **52** (help specialty).

## 2026-08-08 - UI: Pilot feedback help Evidence notes (HPE)

- `/help/pilot-feedback` (HPE) Category-1 + topic map + `PilotFeedbackHelpEvidenceOrientationStrip`; traffic Notes score **52** (help specialty).

## 2026-08-08 - UI: Path chooser help Evidence notes (HPX)

- `/help/path-chooser` (HPX) traffic Notes score **52** (help specialty) — documents existing `HelpPathChooserGuideView` Evidence chrome (Category-1, Sources, claim-discipline, TB-1712 strip).

## 2026-08-08 - UI: Azure Boards help alias Evidence notes (HAZ)

- Category-1 + topic map for `/help/integrations/azure-boards` (HAZ) → HEZ slug; traffic Notes score **52** (help specialty alias). Template row **EIN → HAZ**. Synced HEZ template Notes to match shipped canon chrome.

## 2026-08-08 - UI: Product overview help alias Evidence notes (EPR)

- Category-1 + topic map for `/help/product-overview` (EPR) → EXE slug; traffic Notes score **52** (help specialty alias). Template row **HPR → EPR**.

## 2026-08-07 - UI: Start review Guided intake tab Evidence notes (ENE)

`/architecture/reviews/new?path=guided-intake` documents inheritance of RNX hub Evidence chrome, syncs the path switcher to `?path=`, softens buyer-facing admission jargon, traffic Notes under Tab surface (row ID ENE), and honest Evidence score 48. Path-tab surface hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Integration readiness help Evidence chrome (HEI)

`/help/integration-readiness` ships IntegrationReadinessHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map integration-readiness, traffic Notes under Help topic (row ID HEI), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Sponsor summary help Evidence chrome (EXE)

`/help/sponsor-summary` ships ExecutiveSummaryHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map sponsor-summary, traffic Notes under Help topic (row ID EXE), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Evidence-only-review help alias Evidence chrome (HEV)

`/help/evidence-only-review` inherits HelpCorePilotGuideView Evidence chrome via slug alias → `first-architecture-review` (COR; prefer `#fast-path-evidence-only`), Category-1 + topic map on the alias path, traffic Notes under Help alias (row ID HEV), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Data-handling-tenant-isolation help alias Evidence chrome (HDA)

`/help/data-handling-tenant-isolation` inherits HelpDataHandlingTenantIsolationGuideView Evidence chrome via slug alias → `data-handling` (HED), Category-1 + topic map on the alias path, traffic Notes under Help alias (row ID HDA), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Data-handling help Evidence chrome (HED)

`/help/data-handling` strengthens HelpDataHandlingTenantIsolationGuideView claim-discipline + Category-1 on the canon path, traffic Notes under Help topic (row ID HED), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Creating-runs help alias Evidence notes (HER)

`/help/creating-runs` documents legacy slug alias to review-guide (HelpReviewGuideView Evidence chrome + Category-1 on alias path), traffic Notes under Help alias (row ID HER), and honest Evidence score 52 (inherits HR). Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Core-pilot help alias Evidence notes (ECO)

`/help/core-pilot` documents legacy slug alias to first-architecture-review (HelpCorePilotGuideView Evidence chrome + Category-1 on alias path), traffic Notes under Help alias (row ID ECO; owner HEO renamed to match template), and honest Evidence score 52 (inherits COR). Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - Reliability: TB-2072 long-running operations latency-tier contract

Published [`LONG_RUNNING_OPERATIONS_CONTRACT.md`](library/LONG_RUNNING_OPERATIONS_CONTRACT.md) with tiers A–D, operation inventory, and an explicit non-claim that `GET /v1/runs/{runId}/progress` does not exist; cross-linked from API contracts, performance targets, first-real-value, and UI AGENTS.

## 2026-08-07 - Trustworthiness: TB-2071 compare execution-mode honesty

Compare-two-reviews now surfaces per-run execution mode badges, mode-mismatch warnings, and trust-label advisories on AI delta narratives when baseline and updated reviews are not equally grounded.

## 2026-08-07 - Adoption friction: TB-2070 migration operator visibility

Tenant and admin surfaces now show catalog migration stage, correlation id, migration id, and last verification error on the AppShell banner and `/admin/health` diagnostics card.

## 2026-08-07 - Reliability: TB-2069 migration fan-out stage orchestration

Tenant catalog migration APIs now enforce fan-out stage order with acknowledge-catalog-attach, stage-gated projection refresh and verification, and tenant-scoped cache invalidation.

## 2026-08-07 - Reliability: TB-2068 tenant migration banner AppShell scope

Tenant catalog migration maintenance messaging now renders from `AppShellStatusBanners` on all operator routes, polls status every 30s, and shows stage-specific suspend copy aligned with `TENANT_MIGRATION_FANOUT.md`.

## 2026-08-07 - Trustworthiness: TB-2067 distinct DeterministicFallback trust chip

Trust chips and provenance aggregates now distinguish policy-rule findings from deterministic fallbacks when the live model path failed. Wire `trustLabelReason` populates the chip tooltip when supplied.

## 2026-08-07 - Trustworthiness: TB-2066 finding inspect trust enricher run context

Finding inspect now derives trust labels from parent run structural execution mode and degradation signals instead of hardcoded Real-mode context.

## 2026-08-07 - Adoption friction: TB-2065 finding correlation vocabulary disambiguation

Compare, ITSM ticket linkage, and sponsor ROI surfaces now use distinct vocabulary for cross-review correlation (ADR 0063), ITSM ticket linkages, and portfolio FindingId deduplication.

## 2026-08-07 - Trustworthiness: TB-2064 compare UI finding correlation metadata

Compare-two-reviews now soft-loads end-to-end `findingCorrelation` metadata (method, dedupe key format, match counts, honesty note) with export-parity copy after structured compare succeeds.

## 2026-08-07 - Trustworthiness: TB-2063 compare finding delta fingerprint correlation

`AgentResultDiffService` now uses ADR 0063 `ICrossReviewFindingCorrelationService` for finding add/remove deltas instead of raw message text comparison, with message-only fallback for findings without stable ids.

## 2026-08-07 - Trustworthiness: TB-2044 finding export trust labels

Authoritative `trustLabel` / `trustLabelReason` now flow through work-item clipboard exports, bulk ITSM JSON export, and ADR/MADR markdown when the API supplies wire labels — parity with run-detail CSV.

## 2026-08-07 - Performance: TB-2062 audit list cache coalesced invalidation

Coalesce audit-list scope revision bumps within 3s during append bursts so first-page `CachingAuditRepository` reads keep cache hits under pipeline write churn; 15s list TTL still bounds staleness.

## 2026-08-07 - Performance: TB-2061 dashboard + signed-records First Load JS

Deferred below-fold sponsor-dashboard panels and the signed-records list client chunk via `next/dynamic`; extended `check:first-load-js` tracked routes and baseline for `/architecture/sponsor-dashboard` and `/governance/signed-records`.

## 2026-08-07 - UI: Compare and replay help Evidence chrome (CO)

`/help/comparison-replay` ships ComparisonReplayHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map comparison-replay, traffic Notes under Help topic (row ID CO), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Connect GCP securely help Evidence chrome (HGC)

`/help/cloud-connections/gcp` ships ConnectGcpSecurelyHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map cloud-connections-gcp, traffic Notes under Help alias (row ID HGC), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Connect AWS securely help Evidence chrome (HEC)

`/help/cloud-connections/aws` ships ConnectAwsSecurelyHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map cloud-connections-aws, traffic Notes under Help alias (row ID HEC; owner HEW renamed to match template), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: CAIQ/SIG response help Evidence chrome (ECA)

`/help/caiq-sig-response` ships CaiqSigResponseHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map caiq-sig-response, traffic Notes under Help topic (row ID ECA; owner HEC renamed to avoid template cloud-connections/aws HEC collision), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - Performance: TB-2060 decision-node materialization off commit path

Authority finalize no longer runs `IDecisionEngineV2` node persistence synchronously. `DecisionEngineV2NodeMaterialization` post-commit outbox work enqueues on every successful commit; `DecisionEngineV2NodeMaterializer` idempotently populates `GET /v1/architecture/review/{runId}/decisions` after the outbox drains.

## 2026-08-07 - UI: Azure Boards help Evidence chrome (HEZ)

`/help/azure-boards` ships AzureBoardsHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map azure-boards, traffic Notes under Help topic (row ID HEZ), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Authentication sign-in help Evidence chrome (HEA)

`/help/authentication-sign-in` ships AuthenticationSignInHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map authentication-sign-in, traffic Notes under Help topic (row ID HEA), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-07 - UI: Admin diagnostics help Evidence chrome (HAE)

`/help/admin-diagnostics` ships AdminDiagnosticsHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map admin-diagnostics, traffic Notes under Help topic (row ID HAE), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Accelerator chooser help Evidence chrome (HAX)

`/help/accelerator-chooser` ships AcceleratorChooserHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map accelerator-chooser, traffic Notes under Help topic (row ID HAX), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Help topic catch-all Evidence chrome (HE.)

`/help/[...topic]` residual markdown path ships HelpTopicCatchAllEvidenceOrientationStrip (Sources + claim-discipline), PageContextualHelp + Category-1 `/help` fallback (specialty prefixes still win), traffic Notes under Help topic (row ID HE.), and honest Evidence score 52. Catch-all residual hard-caps at help specialty orientation band; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Approval queue Evidence chrome (GOP)

`/governance/approval-queue` ships ApprovalQueueEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map governance-approval, traffic Notes under Alerts/gov (row ID GOP; added to template), and honest Evidence score 50. Decision-workflow hub hard-caps higher Evidence without audit export depth; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Alerts inbox legacy tab Evidence notes (GOI)

`/governance/alerts?tab=inbox` documents redirect canonicalize to AL hub (TB-1594), traffic Notes under Tab surface (row ID GOI), and honest Evidence score 28. Legacy inbox-tab deep link hard-caps at redirect/shim band; no CPA / third-party pen-test implication.

## 2026-08-07 - Perf: GetRunDetailAsync default omits artifact bodies (TB-2059)

`IAuthorityQueryService.GetRunDetailAsync` defaults `loadArtifactBodies` to false (metadata-only bundle); export/download paths use `IArtifactQueryService` or pass `loadArtifactBodies: true` when inline LOBs are required. Does not claim CPA / third-party pen-test.

## 2026-08-07 - Perf: comparison list omit PayloadJson (TB-2057)

Comparison history/search (`GetByRunIdAsync`, `GetByExportRecordIdAsync`, `SearchAsync`, `SearchByCursorAsync`) use `ComparisonRecordListSql` without the `PayloadJson` LOB; `GetByIdAsync` unchanged for detail. Does not claim CPA / third-party pen-test.

## 2026-08-07 - Perf: retrieval indexing outbox slim detail + parallel drain (TB-2055)

`GetRunDetailForRetrievalIndexingAsync` omits artifact bodies on the outbox hot path; full bodies load via `IArtifactQueryService` only for indexing. Batch drain uses `BoundedBatchParallelism` (TB-586 pattern). Does not claim CPA / third-party pen-test.

## 2026-08-06 - UI: Alert rules simulation tab Evidence notes (GOS)

`/governance/alert-rules?tab=simulation` documents inherited SAX hub Evidence chrome (AlertRulesEvidenceOrientationStrip + PageContextualHelp already on the hub), traffic Notes under Tab surface (row ID GOS), and honest Evidence score 48. Simulation-tab deep link hard-caps at alert-config band; no CPA / third-party pen-test implication.

## 2026-08-06 - Perf: ROI off fat GetRunDetailAsync (TB-2054)

`GetRunDetailForRoiAsync` serves ROI history/trends/portfolio via rollup projection plus finding mute flags when a snapshot exists — replacing N× full `GetRunDetailAsync` LOB loads. Does not claim CPA / third-party pen-test.

## 2026-08-06 - Perf: rollup/compare off bare ResultJson (TB-2053)

`GetRunDetailForRollupAsync` loads agent results through `GetRollupProjectionByRunIdAsync` (relational columns + JSON subpaths for claims/findings/controls) instead of full `ResultJson`. Hot-path inventory + shape guards updated. Does not claim CPA / third-party pen-test.

## 2026-08-06 - UI: Alert rules Conditions tab Evidence notes (GLR)

`/governance/alert-rules?tab=rules` documents inherited SAX hub Evidence chrome (AlertRulesEvidenceOrientationStrip + PageContextualHelp already on the hub), traffic Notes under Tab surface (row ID GLR; owner GOR renamed to avoid collision with template routing GOR), and honest Evidence score 48. Conditions-tab deep link hard-caps at alert-config band; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Alert rules composite tab Evidence notes (GOC)

`/governance/alert-rules?tab=composite` documents inherited SAX hub Evidence chrome (AlertRulesEvidenceOrientationStrip + PageContextualHelp already on the hub), traffic Notes under Tab surface (row ID GOC), and honest Evidence score 48. Composite-tab deep link hard-caps at alert-config band; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Advisory scans Scans tab Evidence notes (ADT)

`/governance/advisory-scans?tab=scans` documents inherited ADV hub Evidence chrome (Sources strip + PageContextualHelp already on the hub), traffic Notes under Tab surface (row ID ADT; owner GOA renamed to avoid collision with template alert-rules GOA), and honest Evidence score 48. Scans-tab deep link hard-caps below ADV launcher; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Example ROI bulletin Evidence chrome (EXA)

`/example-roi-bulletin` ships ExampleRoiBulletinEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing (row ID EXA), and honest Evidence score 40. Marketing synthetic bulletin hard-caps higher Evidence; not an operator PageContextualHelp surface; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Compliance journey Evidence chrome (COM)

`/compliance-journey` ships ComplianceJourneyEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing (row ID COM), and honest Evidence score 40. Marketing posture summary hard-caps higher Evidence; not an operator PageContextualHelp surface; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Auth invite Evidence chrome (AUI)

`/auth/invite` ships AuthInviteEvidenceOrientationStrip (public Sources + claim-discipline) on InvitationAcceptPageClient, traffic Notes under Auth (row ID AUI), and honest Evidence score 40. Pre-sign-in invitation handoff hard-caps higher Evidence; not an operator PageContextualHelp surface; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Auth bootstrap Evidence chrome (AUB)

`/auth/bootstrap` ships AuthBootstrapEvidenceOrientationStrip (public Sources + claim-discipline) on invitation / select-workspace / create-workspace / no-access steps, traffic Notes under Auth (row ID AUB), and honest Evidence score 40. Post-sign-in handoff hard-caps higher Evidence; not an operator PageContextualHelp surface; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: First review guide Evidence chrome (ARF)

`/architecture/first-review-guide` ships FirstReviewGuideEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map getting-started, traffic Notes under Onboarding (row ID ARF), and honest Evidence score 50. Onboarding checklist hard-caps below help-specialty COR; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Architectures list Evidence chrome (ARA)

`/architecture/architectures` ships ArchitecturesListEvidenceOrientationStrip (workspace Sources + claim-discipline), ArchitecturesHubHeaderActions PageContextualHelp + Category-1 registry + topic map getting-started, traffic Notes under Core review (row ID ARA; template AR remains legacy `/architectures`), and honest Evidence score 50. Draft inventory hard-caps below ANE create-bootstrap; listing drafts does not start a review; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Architecture draft detail Evidence chrome (ARR)

`/architecture/architectures/[architectureId]` ships ArchitecturesDraftEvidenceOrientationStrip (workspace Sources + claim-discipline), ArchitectureDraftWorkspace PageContextualHelp + Category-1 via pathIsArchitectureDraftDetail + topic map getting-started, traffic Notes under Core review (row ID ARR; template ARA remains legacy `/architectures/[architectureId]`), and honest Evidence score 50. Drafting workspace hard-caps below ANE create-bootstrap; saving a draft does not start a review; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Model-failed vs quality-rejected distinction (TB-965)

Review detail and API problem copy separate quality-gate HOLD from execution failures; Vitest forbids LLM-error conflation on quality paths. Builds on **TB-963** taxonomy SoT. Does not claim CPA / third-party pen-test or perfect AI quality.

## 2026-08-06 - GTM: **M-26** ADR Upwork listing + partial **M-136**/**M-137**/**M-108**/**M-09** artifacts

Paste-ready ADR Cleanup listing in [`QUOTE_TO_PROOF_PACKET.md#upwork-listings-draft`](go-to-market/QUOTE_TO_PROOF_PACKET.md#upwork-listings-draft); fictional-org trademark screen; scenario framing variants; showcase screenshot + landing sign-off checklists. Does not rewrite other open GTM/tech backlog rows.

## 2026-08-06 - Docs: LLM execution vs quality outcome taxonomy (TB-963)

[LLM_EXECUTION_VS_QUALITY_OUTCOME.md](library/LLM_EXECUTION_VS_QUALITY_OUTCOME.md) ships the two-axis matrix (admissibility first, quality second), failureClass / gate / triage mapping, and durable persist checklist for **TB-964**/**TB-965**. GTM **M-123**/**M-124** cite the library SoT. Does not claim CPA / third-party pen-test or perfect AI quality.

## 2026-08-06 - UI: Tenant settings Evidence chrome (ATE)

`/administration/tenant` ships TenantSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map scope, traffic Notes under Settings (row ID ATE; path aligned off legacy settings/tenant / STX), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Projects recycle bin Evidence chrome (STR)

`/administration/tenant/recycle-bin` ships ProjectsRecycleBinEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map scope, traffic Notes under Settings (row ID STR; path aligned off legacy settings/tenant/recycle-bin; owner ARE renamed to avoid collision with template sponsor-dashboard ARE), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: SCIM provisioning Evidence chrome (ASC)

`/administration/scim-provisioning` ships ScimProvisioningEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID ASC; path aligned off legacy settings/scim-provisioning / SSX), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: SSO wizard Evidence chrome (ASS)

`/administration/identity/sso-wizard` ships SsoWizardEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID ASS; path aligned off legacy settings/identity/sso-wizard / SIS), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: SAML identity-provider Evidence chrome (ASA)

`/administration/identity-providers/saml` ships IdentityProvidersSamlEvidenceOrientationStrip (workspace Sources + claim-discipline), shared PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID ASA; path aligned off legacy settings/identity-providers/saml / SSA), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Identity diagnostics Evidence chrome (SEI)

`/administration/identity-providers/diagnostics` ships IdentityProvidersDiagnosticsEvidenceOrientationStrip (workspace Sources + claim-discipline), shared PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID SEI; path aligned off legacy settings/identity-providers/diagnostics), and honest Evidence score 45. Admin diagnostic hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Internal developer tools Evidence chrome (SDX)

`/administration/developer` ships DeveloperSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map cli-usage, traffic Notes under Admin (row ID SDX; path aligned off legacy settings/developer / DSE), and honest Evidence score 45. Admin diagnostic hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Architecture intelligence Evidence chrome (AIN)

`/architecture/architecture-intelligence` ships ArchitectureIntelligenceEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map evidence-trail, traffic Notes under Core review (row ID AIN), and honest Evidence score 50. Closed-loop reasoning hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Learn more job-match Vitest (TB-2052)

CI suite learn-more-job-match.test.ts + inventory bans generic getting-started / how-it-works Learn more on secondary hubs, keeps Digests specialty + Schedule deep links, and asserts Category-1 still mounts when Learn more is omitted. **TB-2048**–**TB-2052** cluster closed. Does not claim CPA / third-party pen-test.

## 2026-08-05 - UI: Category-1 popover deep-link CTAs (TB-2051)

Allowlisted secondary hubs expose in-app `{ label, href }` actions on Category-1 what-to-do-next / where-to-configure (Digests Schedule/Subscriptions golden retained; advisory Schedules, planning ↔ pilot feedback, impact-preview → reviews, workspace health → approval queue, Connection status ↔ System health). Vitest allowlist guard ships. **TB-2052** remains open. Does not claim CPA / third-party pen-test.

## 2026-08-06 - UI: OIDC identity-provider Evidence chrome (AOI)

`/administration/identity-providers/oidc` ships IdentityProvidersOidcEvidenceOrientationStrip (workspace Sources + claim-discipline), shared PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID AOI; path aligned off legacy settings/identity-providers/oidc / SOI), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-06 - UI: Create architecture Evidence chrome (ANE)

`/architecture/architectures/new` ships ArchitecturesNewEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map first-architecture-review, traffic Notes under Core review (row ID ANE), and honest Evidence score 50. Create-bootstrap hard-caps higher Evidence; drafting does not start a review; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: AI and model governance Evidence chrome (AMO)

`/administration/model-governance` ships ModelGovernanceSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map how-it-works, traffic Notes under Settings (row ID AMO; path aligned off legacy settings/model-governance / SEM), and honest Evidence score 50. Settings commercial-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: SSO and identity hub Evidence chrome (AID)

`/administration/identity-providers` ships IdentityProvidersSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), shared PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID AID; path aligned off legacy settings/identity-providers / SIX), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Extract and Upload settings Evidence chrome (ADX)

`/administration/extract-upload` ships ExtractUploadSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map evidence-intake, traffic Notes under Settings (row ID ADX; path aligned off legacy settings/extract-upload / SE), and honest Evidence score 50. Settings intake-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Sign-in domains settings Evidence chrome (ADU)

`/administration/auth-domains` ships AuthDomainsSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map enterprise-onboarding, traffic Notes under Settings (row ID ADU; path aligned off legacy settings/auth-domains / SEU), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Account security settings Evidence chrome (ADS)

`/administration/account-security` ships AccountSecuritySettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map security-trust, traffic Notes under Settings (row ID ADS; path aligned off legacy settings/account-security / SEA; template advisory-scans tab ID ADS renamed ADT), and honest Evidence score 50. Settings personal-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Preferences settings Evidence chrome (ADR)

`/administration/preferences` ships PreferencesSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map getting-started, traffic Notes under Settings (row ID ADR; path aligned off legacy settings/preferences / SEP), and honest Evidence score 50. Settings personal-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: API keys settings Evidence chrome (ADP)

`/administration/api-keys` ships ApiKeysSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map users-and-roles, traffic Notes under Admin (row ID ADP; path aligned off legacy settings/api-keys / SAE), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Role mapping settings Evidence chrome (ADO)

`/administration/identity-providers/role-mapping` ships RoleMappingSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map users-and-roles, traffic Notes under Settings (row ID ADO; path aligned off legacy settings/identity-providers/role-mapping / SEO), and honest Evidence score 50. Settings access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: AI usage settings Evidence chrome (ADI)

`/administration/ai-usage` ships AiUsageSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map billing-and-plans, traffic Notes under Settings (row ID ADI; path aligned off legacy settings/ai-usage / SC), and honest Evidence score 50. Settings commercial-hub hard-caps higher Evidence; estimated spend is not invoice-accurate; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Deployment status Evidence chrome (ADE)

`/admin/deployment-status` ships DeploymentStatusEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map troubleshooting, traffic Notes under Admin, and honest Evidence score 45. Admin diagnostic hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Demo readiness Evidence chrome (ADD)

`/admin/demo-readiness` ships DemoReadinessEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map path-chooser, traffic Notes under Admin, and honest Evidence score 45. Admin diagnostic hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Secondary-hub Learn more remap (TB-2050)

Secondary hubs (Planning, Decision register, Advisory scans, Impact preview, Workspace health) omit generic `getting-started` / `how-it-works` Learn more when no specialty exists; tenant settings → `scope`; recommendation-learning → `pilot-feedback`. Category-1 popovers still mount. Vitest suite remains **TB-2052**. Does not claim CPA / third-party pen-test.

## 2026-08-05 - UI: Connection status Evidence chrome (ADC)

`/administration/connection-status` ships ConnectionStatusEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map integration-readiness, traffic Notes under Admin, and honest Evidence score 48. Integration-readiness hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Baseline settings Evidence chrome (ADA)

`/administration/baseline` ships BaselineSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map pilot-roi-model, traffic Notes under Settings (row ID ADA; path aligned off legacy settings/baseline / SBX), and honest Evidence score 50. Settings measurement-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Billing & plans settings Evidence chrome (ABI)

`/administration/billing` ships OperatorBillingSettingsEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map billing-and-plans, traffic Notes under Settings (row ID ABI; path aligned off legacy settings/billing / SBE), and honest Evidence score 50. Settings commercial-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Pilot ROI model help Evidence chrome (PI)

`/help/pilot-roi-model` ships PilotRoiModelHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Repeat-review loop help Evidence chrome (HRX)

`/help/repeat-review-loop` ships RepeatReviewLoopHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: First-hour-operator-path help alias Evidence (HFE)

`/help/first-hour-operator-path` documents Help alias -> COR with Category-1 + topic map on the alias path (inherits HelpCorePilotGuideView Evidence chrome), traffic Notes under Help alias, and honest Evidence score 52. Alias inherits COR orientation hard-cap; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Enterprise onboarding help Evidence chrome (HEX)

`/help/enterprise-onboarding` ships EnterpriseOnboardingHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Evaluator-workbook help alias Evidence (HEE)

`/help/evaluator-workbook` documents Help alias -> HPX with Category-1 + topic map on the alias path (inherits HelpPathChooserGuideView Evidence chrome), traffic Notes under Help alias, and honest Evidence score 52. Alias inherits HPX orientation hard-cap; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: First-pilot-path help alias Evidence (FIR)

`/help/first-pilot-path` documents Help alias → COR with Category-1 + topic map on the alias path (inherits HelpCorePilotGuideView Evidence chrome), traffic Notes under Help alias, and honest Evidence score 52. Alias inherits COR orientation hard-cap; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Evidence intake help Evidence chrome (EVI)

`/help/evidence-intake` ships EvidenceIntakeHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Evidence trail help Evidence chrome (EV)

`/help/evidence-trail` ships EvidenceTrailHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Demo explain Evidence chrome (DEX)

`/demo/explain` ships DemoExplainEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Learning, and honest Evidence score 45. Learning demo-proof page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: First architecture review Evidence chrome (COR)

`/help/first-architecture-review` ships CorePilotHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic row ID aligned to **COR** (was HCO), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Digests Learn more + Schedule deep links (TB-2049)

Digests Category-1 Learn more maps to specialty `/help/digests` (`HelpDigestsGuideView`). Schedule tab deep links ship on Digests what-to-do-next / where-to-configure. Traffic **DI**/**DIS**/**HDG** notes honest. Secondary-hub sweep **TB-2050** Done. Does not claim CPA / third-party pen-test.

## 2026-08-05 - Docs: Learn more must match page job (TB-2048)

`UI_DESIGN_SYSTEM.md` ratifies Category-1 Learn more job-match + omit-when-none and bans generic `getting-started` / `how-it-works` on secondary hubs (first-run allowlist documented). `archlucid-ui/docs/ARCHITECTURE.md` points agents here. Digests golden remap **TB-2049** Done; secondary-hub remap **TB-2050** Done; Vitest **TB-2052**. Does not claim CPA / third-party pen-test.

## 2026-08-05 - Backlog: page-scoped contextual help quality (TB-2048–TB-2052)

Opened **P0** cluster for Category-1 help *quality* (not mount coverage): Learn more must match the page job; Digests golden remap + Schedule deep link; secondary-hub remap off generic getting-started/how-it-works; actionable popover CTAs; Vitest. Complements open **TB-1666**–**TB-1670**. **TB-2048** Done same day (design-system contract); **TB-2049**–**TB-2052** remain open. See `TECH_BACKLOG.md` / `TECH_BACKLOG_OPEN.md`. Does not claim CPA / third-party pen-test.

## 2026-08-05 - Persistence: typed hot scalars on AgentExecutionTraces (TB-931)

DbUp **294** + `ArchLucid.sql` add token/cost/alias/quality columns on `dbo.AgentExecutionTraces` with best-effort JSON backfill. Create dual-writes scalars; operator list and LLM cost projections prefer typed columns with `JSON_VALUE` COALESCE for rolling-deploy rows. Quality patches dual-write bit columns. Inventory updated. Finding list title/severity was already columnar. Does not claim CPA / third-party pen-test.

## 2026-08-05 - UI: Session expired Evidence chrome (ASU)

`/auth/session-expired` ships SessionExpiredEvidenceOrientationStrip (public Sources + claim-discipline), traffic Notes under Auth, and honest Evidence score 40. Auth session-expired handoff hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Why ArchLucid proof Evidence chrome (WH)

`/why-archlucid` ships WhyArchLucidEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Learning, and honest Evidence score 45. Learning demo-proof page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Why ArchLucid Evidence chrome (WHY)

`/why` ships WhyEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing why page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Welcome Evidence chrome (WXX)

`/welcome` ships WelcomeEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing welcome page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: See it Evidence chrome (SEE)

`/see-it` ships SeeItEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing see-it page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Integration events DLQ Evidence chrome (OID)

`/operate/integration-events/dlq` ships IntegrationEventsDlqEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Advisory, and honest Evidence score 45. Admin ops DLQ hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Procurement FAQ help Evidence chrome (PRO)

`/help/procurement` ships ProcurementHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Settings security-trust Evidence chrome (WSX)

`/administration/settings/security-trust` ships SettingsSecurityTrustEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Settings, and honest Evidence score 50. Settings assurance-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Live demo Evidence chrome (LXX)

`/live-demo` ships LiveDemoEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing live-demo page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: CLI usage help Evidence chrome (HCX)

`/help/cli-usage` ships CliUsageHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelp + Category-1 registry + topic map, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Audit trail help Evidence chrome (H)

`/help/audit-trail` ships AuditTrailHelpEvidenceOrientationStrip (workspace Sources + claim-discipline), Category-1 contextual-help registry, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Try Evidence chrome (TRY)

`/try` ships TryEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing frictionless-try page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Showcase Evidence chrome (SRH)

/showcase/[runId] ships ShowcaseEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing sample-showcase page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Quick scan Evidence chrome (QXX)

/quick-scan ships QuickScanEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing demo-scan page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: ITSM OAuth callback Evidence chrome (IIO)

/integrations/itsm/oauth/callback ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes, and honest Evidence score 40. OAuth handshake surface hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI/API: Settings split by audience — personal settings for every user, tenant settings admin-only

Personal settings (`/administration/settings/preferences`, `/administration/settings/account-security`) were reachable only by URL: no nav builder published them, and the sidebar "Settings" slot pointed at the `ExecuteAuthority`-gated tenant page. They now ship in a new top-bar account menu (`AccountSettingsMenu`) backed by `SELF_SETTINGS_DESTINATIONS`, ungated at every authority rank because their writes touch only the caller's own record.

The settings hub is now unambiguously the tenant-administration surface. `settings-master-audience.ts` derives audience from each destination's data scope with an exhaustive switch, and the hub drops `self` audiences so a personal setting cannot be re-orphaned behind an admin gate (internal-tier developer tools are exempt — user-scoped but employee chrome, already gated by `showInternalShell`).

Hub-first per **IA-016 / D5**: the sidebar "Settings" slot targets `/administration/settings` at `ReadAuthority` (it also publishes read-only billing and security & trust rows); `/administration/settings/tenant` becomes a separate "Workspace settings" entry at `AdminAuthority` with a `TenantSettingsRestrictedState` for non-admin deep links, and breadcrumbs/static titles follow. `PUT /v1/tenant/cost-settings` tightened to `AdminAuthority`.

The duplicated sponsor digest editor was removed from the tenant page in favor of the Digests hub, which already owns recipients, time zone, delivery readiness, and subscription health. `POST /v1/tenant/exec-digest-preferences` and `PUT /v1/tenant/baseline` deliberately stay at `ExecuteAuthority`: the Digests hub is a `ReadAuthority` Reports destination where Operators and Sponsors schedule digests, and baseline is written by the review-intake and pilot wizards, so tightening either would break normal workflow rather than close a gap. Quality-gate mode, model governance, identity providers, sign-in domains, API keys, SCIM, users, and AI usage were already `AdminAuthority`.

## 2026-08-05 - Docs: PA first-15 package-spine IA unlock contract (TB-1030)

Published [`PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md`](library/PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md) — must-complete decision-signal set, minute-12 checkpoint, Finalize + export co-location, and narration residuals. GTM **M-181** and claim-boundary guide cite the matrix. Does not claim M-44 cohort proof, or CPA / third-party pen-test.

## 2026-08-05 - UI: Workspace and scope help Evidence chrome (HSX)

/help/scope ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip on HelpTopicMarkdownView, traffic Notes, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - UI: Security and trust help Evidence chrome (HSE)

/help/security-trust ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip on HelpTopicMarkdownView, traffic Notes, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-05 - Docs: Operator primary-object nav collapse contract (TB-1026)

Published [`OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md`](library/OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md) — architecture package as primary object, `/reviews` spine, and collapse surfaces. GTM **M-177** and claim-boundary guide cite the matrix. Does not mandate renaming every Reviews label, or claim CPA / third-party pen-test.

## 2026-08-05 - Docs: Comparison/replay immutable snapshot contract (TB-1024)

Published [`COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md`](library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md) — minimal immutable set and artifact/regenerate/verify vs UI illusion. GTM **M-175** and claim-boundary guide cite the matrix. Does not claim artifact-mode equals architecture stable, platform WORM, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Pre-finalize gate block vs advisory + SoD (TB-1022)

Published [`PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md`](library/PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md) — optional gate block vs advisory, SoD ownership, and lifecycle order. GTM **M-173** and claim-boundary guide cite the matrix. Does not claim packs are certifications, gate always on, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Transactional finalize vs outbox contract (TB-1011)

Published [`TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md`](library/TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) — finalize UoW vs outbox/async and never-silent vs disclosed best-effort. GTM **M-163** and claim-boundary guide cite the matrix. Does not claim commit equals indexed/delivered, DTF exactly-once, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Append-only / sealed evidence contract (TB-1009)

Published [`APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md`](library/APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) — append-only/sealed vs mutable inventory and Update-destruction matrix. GTM **M-161** and claim-boundary guide cite the matrix. Does not claim platform WORM or CPA / third-party pen-test.

## 2026-08-05 - Docs: Authority vs AgentTask-loop canonical path (TB-1007)

Published [`AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) — Authority product-default path, intentional AgentTask verbs, and forbid matrix for finishing finalized runs. GTM **M-159** and claim-boundary guide cite the matrix. Does not claim `/result` retired, dual storage still live, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Layer residual / irreversible-leak matrix (TB-1005)

Published [`LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md`](library/LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md) — NetArchTest vs ranked runtime residuals (wrong catalog, retrieval, tools, INV-001, committed-manifest substitute, fat DTOs). GTM **M-157** and claim-boundary guide cite the matrix. Does not claim NetArchTest proves isolation, CPA, or third-party pen-test.

## 2026-08-05 - Docs: Committed golden manifest unit-of-truth contract (TB-1003)

Published [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](library/COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) — unit of truth, Evidence→…→audit hops, forbidden substitutes, and honest hop-skip labels. GTM **M-155** and claim-boundary guide cite the matrix. Does not claim WORM/PKI beyond app-layer hash lineage, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Retrieval tenancy hit guarantee contract (TB-1001)

Published [`RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md`](library/RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md) — Ask / Azure AI Search / Graph-RAG query filter, upsert fail-closed, scoped expand, and platform corpus sentinel. GTM **M-153** and claim-boundary guide cite the matrix. Does not claim per-tenant Search service, cryptographic isolation, or CPA / third-party pen-test.

## 2026-08-05 - Docs: Tenant identity single-derivation contract (TB-999)

Published [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](library/TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) — INV-001 decide-once host boundary, trusted vs header sources, ARCH001 forbidden re-derive, and Layer A catalog reminder. GTM **M-151** and claim-boundary guide cite the matrix. Does not claim SQL RLS or CPA / third-party pen-test.

## 2026-08-05 - Docs: LLM trust-boundary ingress confinement contract (TB-997)

Published [`LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md`](library/LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md) — host-composed ingress vs structurally impossible model side effects, with Done hygiene (**TB-949**–**TB-951**) and residual **TB-952**. GTM **M-149** and claim-boundary guide cite the matrix. Does not claim injection-proof docs or CPA / third-party pen-test.

## 2026-08-04 - UI: Get started Evidence chrome (GXX)

/get-started ships GetStartedEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing first-run page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Trial funnel Evidence chrome (ATD)

/admin/trial-funnel ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes, and honest Evidence score 45. Admin KPI hub hard-caps higher Evidence (same band as ATX); no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Advisory scans Schedules tab Evidence score (AD)

`/governance/advisory-scans?tab=schedules` inherits ADV hub Evidence chrome (Category-1 + Sources strip above tabs); traffic Notes document inheritance and honest Evidence score 48. Schedule-config tab hard-caps higher Evidence (below ADV); no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Pilot feedback Evidence chrome (PRC)

/internal/product-learning ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes, and honest Evidence score 50. Internal ops feedback hub hard-caps higher Evidence (below PLA); no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Operator-auth-roles help Evidence chrome (HOE)

/help/operator-auth-roles (alias of users-and-roles) ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip on HelpUsersAndRolesGuideView, traffic Notes, and honest Evidence score 52 (sibling HUX scored with the same chrome). Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Glossary help Evidence chrome (HGE)

/help/glossary ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes (template ID aligned from HEG → HGE), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - Docs: Polly vs run-level semantics contract (TB-995)

Published [POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md](library/POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md) — transport Polly/CB vs partial agents / cache / mid-run budget, with shipped (**TB-937**–**TB-940**) vs residual owners. Bridged from [LLM_RETRY_AND_CIRCUIT_BREAKER.md](library/LLM_RETRY_AND_CIRCUIT_BREAKER.md); GTM **M-147** and claim-boundary guide cite the matrix. Does not close **TB-941**–**TB-945** or imply CPA / third-party pen-test.

## 2026-08-04 - API: ITSM inbound webhook replay guard (TB-968)

`IItsmInboundWebhookReplayGuard` + `MemoryCacheItsmInboundWebhookReplayGuard` (24h per-process dedupe); delivery id headers (`X-ArchLucid-Webhook-Delivery-Id`, `X-Atlassian-Webhook-Identifier`) or synthetic keys; replay returns HTTP 200 with `Integration.ItsmInboundWebhookReplayIgnored` audit (no second mutation). Optional `X-ArchLucid-Timestamp` skew enforced even without HMAC. Ops runbook [`ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md`](runbooks/ITSM_INBOUND_WEBHOOK_REPLAY_GUARD.md). No CPA / third-party pen-test implication.

## 2026-08-04 - UI: Move Architecture intelligence under `/architecture/architecture-intelligence`

Canonical operator path is now `/architecture/architecture-intelligence` (nav, deep links, route catalog). Former `/architecture-intelligence` bookmarks 404 — no redirect shim.

## 2026-08-04 - UI: Hard-retire `/reviews/new?intent=create-architecture` redirect

Removed server redirect and dead create-architecture tab copy on review intake; canonical create path remains `/architecture/architectures/new`. Post-generation `intent=create-architecture` on `/architecture/reviews/[runId]` unchanged.

## 2026-08-04 - UI: Hard-retire `/snapshot/[runId]` redirect shim

Removed App Router redirect stub; CTO recap leave-behind links now use `/architecture/reviews/{runId}?readOnly=1` via `buildReadOnlyReviewWorkspaceHref`. Old `/snapshot/...` bookmarks 404.

## 2026-08-04 - UI: Azure permissions help Evidence chrome (HE)

/help/azure-permissions ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes (template ID aligned from HAZ → HE), and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Demo preview Evidence chrome (DPX)

/demo/preview ships DemoPreviewEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing sample-demo page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Pilot outcomes Evidence chrome (SPP)

/sponsor-report/pilot-outcomes ships Category-1 registry, Sources + claim-discipline orientation strip, updated traffic Notes, and honest Evidence score 52 (PageContextualHelpButton already present). Sponsor period-summary hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Webhooks integration Evidence chrome (IWX)

/integrations/webhooks ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 48. Integration-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Pilot guide help Evidence chrome (HP)

/help/pilot-guide ships HelpPilotGuideView with PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Billing and plans help Evidence chrome (HBX)

/help/billing-and-plans ships Category-1 registry, Sources + claim-discipline orientation strip, updated traffic Notes, and honest Evidence score 52 (PageContextualHelpButton already present). Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Signup verify Evidence chrome (SVX)

/signup/verify ships SignupVerifyEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing evaluation-access page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: ServiceNow integration Evidence chrome (ISX)

/integrations/servicenow ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 48. Integration-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Review guide help Evidence chrome (HR)

/help/review-guide ships HelpReviewGuideView with PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Governance approval help Evidence chrome (GO)

/help/governance-approval ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, updated traffic Notes, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Demo entry Evidence chrome (DXX)

/demo ships interim DemoEntryEvidenceOrientationStrip (Sources + claim-discipline) + Continue link on the client redirect shim, traffic Notes under Marketing, and honest Evidence score 28. Redirect/shim hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Invite a reviewer Evidence chrome (SRI)

/administration/settings/users/invite-reviewer ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Settings, and honest Evidence score 48. Access-invite hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Trust Center Evidence chrome (TXX)

/trust ships TrustCenterEvidenceOrientationStrip (Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing Trust Center hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Security & Trust Evidence chrome (SEC)

/security-trust ships SecurityTrustEvidenceOrientationStrip (Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing assurance page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Validate review Evidence chrome (REP)

/replay ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes (Marketing catalog; operator Execute), and honest Evidence score 48. Validation-action hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Teams integration Evidence chrome (ITX)

/integrations/teams ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 48. Integration-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Slack integration Evidence chrome (ISN)

/integrations/slack ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 48. Integration-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Jira integration Evidence chrome (IJX)

/integrations/jira ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 48. Integration-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Findings help Evidence chrome (HFX)

/help/findings ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - UI: Alerts help Evidence chrome (HA)

/help/alerts ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-04 - API: Bounded inbound webhook body intake (TB-967)

Shared `InboundWebhookBoundedBodyReader` rejects oversize payloads (Content-Length + hard 64 KiB ceiling) before HMAC/JWT verify on ITSM, Stripe, Marketplace, and Slack inbound routes (413). Architecture/integration tests lock size-before-verify-before-parse; hostile-traffic inventory Size column updated. No CPA / third-party pen-test implication.

## 2026-08-04 - UI: Sponsor scorecard Evidence chrome (ESX)

/sponsor/scorecard ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Sponsor, and honest Evidence score 48. Sponsor KPI hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Digests Schedule Evidence chrome (DIS); retire mistaken SEX owner row

`/digests?tab=schedule` ships DigestsScheduleEvidenceOrientationStrip (Sources + claim-discipline) on the Schedule tab, traffic Notes under Tab surface on canonical **DIS**, and honest Evidence score 48. Mistaken owner row **SEX** (reusing a retired settings-exec-digest ID) removed; Hit **0.1%** folded into **DIS** (Hit **0.12%**). Owner **DIS** path corrected to schedule; **DIX** restored for subscriptions. Schedule-config tab hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Troubleshooting help Evidence chrome (HTX)

/help/troubleshooting ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: How ArchLucid works help Evidence chrome (HHX)

/help/how-it-works ships HelpHowArchLucidWorksGuideView (wired in help router), PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Connect Azure securely help Evidence chrome (HC)

/help/cloud-connections/azure ships PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation strip, traffic Notes under Help alias, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Product FAQ Evidence chrome (FXX)

/faq ships FaqEvidenceOrientationStrip (evaluation Sources + claim-discipline), traffic Notes under Marketing, and honest Evidence score 40. Marketing FAQ hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Tenant health Evidence chrome (ATX)

/admin/tenant-health ships PageContextualHelpButton, Category-1 registry, workspace Sources + claim-discipline orientation strip, traffic Notes under Admin, and honest Evidence score 45. Admin KPI hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Signed review record Evidence chrome (MMX)

/signed-records/[manifestId] ships PageContextualHelpButton, Category-1 registry, workspace Sources + claim-discipline orientation strip, traffic Notes under Marketing, and honest Evidence score 58. Package detail hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Cloud connections help Evidence chrome (HCE)

/help/cloud-connections ships HelpCloudConnectionsGuideView with PageContextualHelpButton, Category-1 registry, Sources + claim-discipline orientation, hub/Azure CTAs, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Hard-retire most redirect-only bookmarks

Prunes next.config redirects (keeps `/reviews` and `/architectures` namespace force-canonical + signed-record manifest aliases). Removes App Router and proxy shims for `/product-learning`, `/value-report*`, finding `/inspect`, `/planning`, and legacy hub bookmarks (`/runs`, `/manifests`, governance top-level, dashboard/sponsor, patterns, settings/admin aliases). Inbound links, e2e, host-gate, SEO disallow, and `RETIRED_SHIMS` updated. API `/v1/product-learning/*` unchanged. No CPA / third-party pen-test implication.

## 2026-08-04 - UI: Hard-retire legacy redirect shims

Removes next.config bookmark redirects (keeps `/reviews` and `/architectures` namespace force-canonical only). Deletes App Router and proxy shims for `/value-report*`, finding `/inspect`, and related legacy paths. Drops `RETIRED_SHIMS` test maintenance — retired bookmarks 404 without a central registry. Inbound links updated to canonical paths. API unchanged.

## 2026-08-03 - UI: Retire `/product-learning` → `/internal/product-learning`

Pilot feedback (product learning) moves under Internal Operations at `/internal/product-learning`. Legacy `/product-learning` permanentRedirects. Nav, host-gate, SEO disallow, breadcrumbs, planning CTAs, help presentation, and traffic PRC updated. API `/v1/product-learning/*` unchanged. No CPA / third-party pen-test implication.

## 2026-08-03 - UI: Approval lineage Evidence chrome (GAI)

/governance/approval-requests/[id]/lineage ships PageContextualHelpButton, Category-1 registry, workspace Sources + claim-discipline orientation strip, traffic Notes under Alerts/gov, and honest Evidence score 55. Lineage linkage hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Alert rules hub Evidence chrome (SAX)

/governance/alert-rules ships workspace Sources + claim-discipline orientation on non-routing tabs (Notifications keeps GOR strip), Category-1 help pre-existing, traffic Notes under Alerts/gov, and honest Evidence score 48. Alert-config hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - Docs: Retire VRX traffic row; fold hit share into SPR

Legacy `/value-report/roi` bookmark row **VRX** removed from the UI route traffic workbook. Hit% **0.1%** (plus SPR's **0.02%**) folded into canonical sponsor ROI summary **SPR** (Hit **0.12%**, Score **50**, Weight **6**, Deficit **6**). App Router shim still permanentRedirects `/value-report/roi` → `/sponsor-report/roi-summary`. No CPA / third-party pen-test implication.

## 2026-08-03 - UI: Advisory scans Evidence chrome (ADV)

/governance/advisory-scans ships workspace Sources + claim-discipline orientation on AdvisoryHubClient (Category-1 help pre-existing), traffic Notes under Advisory, and honest Evidence score 50. Recommendation-launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - UI: Users and roles Evidence chrome (AUX)

/administration/settings/users ships PageContextualHelpButton, Category-1 registry, workspace Sources + claim-discipline orientation strip, traffic Notes under Settings/Admin, and honest Evidence score 50. Access-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - Security: Indirect prompt-injection adversarial corpus (TB-951)

README/ADR/architecture-doc shaped injection fixtures in eval-corpus + `indirect-doc-injection.json`, with honest `expectedContained` residuals (not 100% phrase detection). CI assert + strict dataset validation wired. No CPA / third-party pen-test implication.

## 2026-08-03 - Security: AllowedTools fail-closed on production-like hosts (TB-950)

Empty/null `AgentTask.AllowedTools` denies handler dispatch on production-like hosts; unrestricted requires explicit `*` (`AgentTypeKeys.UnrestrictedDispatch`). Demo/seed tasks use concrete agent type keys. No CPA / third-party pen-test implication.

## 2026-08-03 - UI: Alert routing Evidence chrome (GOR)

/governance/alert-rules?tab=routing ships AlertRoutingEvidenceOrientationStrip (Sources + claim-discipline) and enriched traffic Notes. Notification destinations hard-cap higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 - Docs: First-review runbook and help path sync

Align FIRST_PILOT_OPERATOR_PATH / first-review help topics, CORE_PILOT, and related runbook cross-links with the canonical first-review path. No CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ Docs: Retire VPX traffic row; fold hit share into SPP

Legacy `/value-report/pilot` bookmark row **VPX** removed from the UI route traffic workbook. Hit% **0.05%** folded into canonical sponsor pilot outcomes **SPP** (Hit **0.07%**, Deficit **7**). App Router shim still permanentRedirects `/value-report/pilot` ? `/sponsor-report/pilot-outcomes`. No CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ Docs: Retire VXX traffic row; fold hit share into SPE

Legacy `/value-report` bookmark row **VXX** removed from the UI route traffic workbook. Hit% **0.2%** folded into canonical sponsor sponsor summary **SPE** (Hit **0.22%**, Deficit **22**). App Router shim still permanentRedirects `/value-report` ? `/sponsor-report/sponsor-summary`. No CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ Docs: Retire SRN traffic row; fold hit share into RRE

Legacy `/snapshot/[runId]` bookmark row **SRN** removed from the UI route traffic workbook. Hit% **0.04%** folded into canonical review workspace **RRE** (Hit **10.04%**, Weight **552.2**, Deficit **451.8**). App Router shim still redirects `/snapshot/...` ? review workspace with `readOnly=1`. No CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ Ops: ArchLucid DEV sandbox primary region ? **centralus**

DEV CD target aligned with staging/production: `dev.tfvars.example` + [`AZURE_SUBSCRIPTIONS.md`](library/AZURE_SUBSCRIPTIONS.md) now specify **`centralus`**, with example runtime RG **`rg-ArchLucid-dev-cus`** (`create_resource_group = true`). Operators must update GitHub Environment secret **`DEV_TFVARS`**, **`EXPECTED_AZURE_LOCATION=centralus`**, and **`AZURE_RESOURCE_GROUP`** for the centralus stack. ACR may remain in legacy **`rg-ArchLucid-dev`**.
## 2026-08-03 ï¿½ UI: Sponsor sponsor summary Evidence chrome (SPE)

`/sponsor-report/sponsor-summary` ships Sources + claim-discipline orientation on ValueReportPageView, Category-1 registry for the canonical path, traffic Notes under Sponsor report, and honest Evidence score 55. Period-summary hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Signup Evidence chrome (SIG)

`/signup` ships evaluation Sources + claim-discipline orientation strip (evaluation access only), traffic Notes under Marketing, and honest Evidence score 40. Marketing evaluation-access page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Getting started help Evidence chrome (HGX)

`/help/getting-started` ships PageContextualHelp, Category-1 registry, Sources + claim-discipline orientation, traffic Notes under Help topic, and honest Evidence score 52. Help-topic orientation hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Alert rules routing Evidence chrome (ALE)

`/governance/alert-rules?tab=routing` ships Sources + claim-discipline orientation on the Notifications tab, Category-1 registry on the alert-rules hub, traffic Notes under Tab surface, and honest Evidence score 48. Tab-surface delivery config hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Run provenance Evidence chrome (RRP)

`/reviews/[runId]/provenance` ships PageContextualHelp, Category-1 help via provenance path match, workspace Sources + claim-discipline orientation strip, traffic Notes under Core review, and honest Evidence score 55. Coordinator-linkage hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Pricing Evidence chrome (P)

`/pricing` ships evaluation Sources + claim-discipline orientation strip (commercial packaging only), traffic Notes under Marketing, and honest Evidence score 42. Marketing commercial page hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Cloud connections Evidence chrome (SCE)

`/integrations/cloud-connections` ships PageContextualHelpButton, Category-1 registry (plus legacy `/settings/cloud-connections`), workspace Sources + claim-discipline orientation strip, traffic Notes under Integrations, and honest Evidence score 50. Connection-hub hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Compare two reviews Evidence chrome (CXX)

/insights/compare-two-reviews ships workspace Sources + claim-discipline orientation strip (pair Cite Sources already post-Compare), Category-1 registry (pre-existing), PageContextualHelp, traffic Notes under Insights (not Marketing/Planning), and honest Evidence score 52. Directional-diff launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Policy pack detail Evidence chrome (GPI)

/governance/policy-packs/[id] ships PolicyPackDetailEvidenceChrome (PageContextualHelpButton + Sources strip + claim-discipline) across specialty/generic pack variants, Category-1 registry for /governance/policy-packs, and enriched traffic Notes. Pack narrative launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Decision register Evidence chrome (GDO)

/governance/decision-register ships PageContextualHelpButton, topic-map honesty (how-it-works / Decision register), Category-1 registry, Sources follow-up strip + claim-discipline callout (register browse, not a diligence pack), and enriched traffic Notes. Register browse hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ Docs: Retire RR traffic row; fold weights into ERU

Legacy `/inspect` bookmark row **RR** removed from the UI route traffic workbook. Hit% **0.4%**, Evidence score **18**, Weight **7.2**, and Deficit **32.8** transferred to canonical evidence-trace **ERU**. App Router shim still permanentRedirects `/inspect` ? evidence-trace. No CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Start review Evidence chrome (RNX)

/reviews/new ships ReviewsNewPageChrome (OperatorPageHeader + PageContextualHelpButton), Category-1 registry for /reviews/new and /architecture/reviews/new, topic map evidence-intake, Sources follow-up strip + claim-discipline callout (intake only, not a diligence trail), and enriched traffic Notes. Intake wizard launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Governance audit trail Evidence chrome (AUD)

/governance/audit ships Sources follow-up strip + claim-discipline callout (activity log, not a diligence pack), Category-1 contextual-help registry, pre-existing AuditPageHeader help (audit-trail), and enriched traffic Notes. Activity-log Evidence hard-caps without a signed-record package; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: System health Evidence chrome (ADY / HXX path fix)

/administration/system-health ships Sources follow-up strip + claim-discipline callout (operational readiness, not a diligence trail), Category-1 contextual-help registry, and enriched ADY traffic Notes. Owner workbook path ID corrected (was mislabeled HXX); legacy /health restored on HXX as redirect shim. Operational readiness launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Improvement plan detail Evidence chrome (PPP)

/planning/plans/[planId] ships OperatorPageHeader with PageContextualHelp, Category-1 registry for /planning/plans, Sources follow-up strip + claim-discipline callout (derived plan, not a diligence trail), and enriched traffic Notes. Plan-detail launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 — UI: Improvement planning empty-path composition (PLA)

`/insights/planning` empty path no longer renders zero KPI cards, empty themes/plans shells, or export. Guided CTA plus maturity/outcome orientation and priority-score explain (no fabricated sample plans). Claim-discipline callout is dismissible with a residual honesty line. Traffic Notes + owner score 54/100; no CPA / third-party pen-test implication.

## 2026-08-03 — UI: Architecture digests Evidence chrome (DI)

`/digests` ships Sources follow-up strip + claim-discipline callout (scheduled summaries, not a diligence trail), Category-1 contextual-help registry (pre-existing), DigestsPageHeader help, and enriched traffic Notes. Digest hub launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 — UI: Improvement planning Evidence chrome (PLA)

`/planning` ships Sources follow-up strip + claim-discipline callout (derived themes/plans, not a diligence trail), topic-map honesty (`how-it-works` / Improvement planning ? not Admin pilot-feedback mislabel), Category-1 contextual-help registry (pre-existing), and enriched traffic Notes. Aggregate planning launcher hard-caps higher Evidence; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Architecture scorecard Evidence chrome (SCX)

`/insights/architecture-scorecard` ships Sources follow-up strip + claim-discipline callout (directional ROI / not financial reporting), Category-1 contextual-help registry, denser header chrome with help beside the H1, and enriched traffic Notes under Insights (not Marketing). TB-1956ï¿½1960 remains Done; no CPA / third-party pen-test implication.

## 2026-08-03 ï¿½ UI: Governance dashboard Evidence chrome (GDX / TB-1668 topic slice)

`/governance/dashboard` ships Sources follow-up strip + claim-discipline callout, Category-1 contextual-help registry, and topic-map honesty (`how-it-works` / Workspace overview ï¿½ not governance-approval). Sibling fix: `/governance/alerts` maps to `alerts`. Demo redirect (BDA-107) unchanged. Remaining TB-1668 mount hubs still open.

## 2026-08-03 ï¿½ UI: Operator Overview home remounts page help chrome (HOM / TB-1667 slice)

`/` ships remounted `OperatorHomePageChrome` ï¿½ Overview title, refresh, and `PageContextualHelpButton` (topic map ? first-architecture-review) plus Category-1 `contextual-help-registry` for exact `/`. In-card PilotCommandCenter help stays suppressed to avoid double icons. Remaining TB-1667 hubs still open.

## 2026-08-03 ï¿½ UI/help: SOC 2 self-assessment specialty guide (HES / TB-1746 / TB-1749 / TB-1750)

`/help/soc2-self-assessment` ships `HelpSoc2SelfAssessmentGuideView` ï¿½ Trust Center / CAIQ-SIG / Procurement CTAs, Sources strip, job-matrix IA dual, orientation + claim-discipline chrome (self-assessment ? CPA Type I/II), and prepared `SOC2_SELF_ASSESSMENT_2026.md` (TB-1747/1748 strips retained). Help Center product-tier discovery + title honesty. Does not imply CPA SOC 2 or third-party pen-test publication.

## 2026-08-03 ï¿½ UI/help: API contracts Admin specialty guide (HG / TB-1386)

`/help/api-contracts` ships `HelpApiContractsGuideView` — title honesty “API contracts (technical reference)”, CLI / configuration / buyer Governance approval CTAs, Sources strip, orientation + claim discipline, and TB-1388-stripped `API_CONTRACTS.md`. Retired bookmark `/help/governance-api-contracts` permanently redirects here (Help alias Batch L). Admin-gated internal-runbook; not buyer governance FAQ. Does not imply CPA SOC 2 or third-party pen-test publication.

## 2026-08-02 ï¿½ UI/help: First value in 20 minutes Admin specialty guide (HEF / TB-1691ï¿½TB-1695)

`/help/first-value-20-minutes` ships `HelpFirstValue20GuideView` ï¿½ buyer first-architecture-review primary CTA, job-matrix IA dual, orientation + claim-discipline chrome, and the 20-minute section only from `FIRST_PILOT_OPERATOR_PATH.md` (sectionAnchors + TB-1693 strip). Admin-gated internal-runbook; not the default customer path. Does not imply CPA SOC 2 or third-party pen-test publication.

## 2026-08-02 ï¿½ UI/help: DPA template specialty guide (HDP / TB-1676ï¿½TB-1680)

`/help/dpa-template` ships `HelpDpaTemplateGuideView` ï¿½ Trust Center / Subprocessors / Procurement CTAs, Sources strip, orientation + claim-discipline chrome, full `DPA_TEMPLATE.md` deferred behind collapsed disclosure. Buyer ï¿½architecture reviewsï¿½ wording (TB-1680); Help Center product-tier discovery for DPA + subprocessors (TB-1679). Does not imply a countersigned DPA, CPA SOC 2, or third-party pen-test publication.

## 2026-07-30 ï¿½ UI/docs: signed review record vs decision vocabulary cleanup

Canonical pairing: **signed review record** = package locked at finalize; **decision** = disposition in Decision register. Removed "signed decision record" / "governance decision record" package synonyms from buyer/operator copy, empty states, glossary, and design-system language. ADR export wording unchanged.

## 2026-07-30 ï¿½ Retrieval: bound evidence search so proxy no longer 502s on AOAI/Search stalls

`GET /v1/retrieval/search` now has an overall query budget (`Retrieval:QueryBudget`, default 25s), Azure OpenAI embeddings use async + 15s network timeout, and Azure AI Search clients set `Retry.NetworkTimeout`. The UI proxy no longer retries `AbortError`/timeout transport failures (was up to ~180s). Stalls map to API 503 instead of proxy 502 ï¿½aborted due to timeoutï¿½ (observed on www.archlucid.net Search review evidence).

## 2026-07-29 ï¿½ UI: narrower ROI assumptions + create intake width

Architecture scorecard **ROI assumptions** section capped at `max-w-md` (small form no longer sits in a full-bleed card). Create architecture guided intake capped at `max-w-3xl`; initial review-focus card at `max-w-md`.

## 2026-07-29 ï¿½ GTM: **M-135** showcase naming hierarchy + **M-25** Azure Upwork listing

Scenario-first naming + PA Q4 Contoso/Northwind safe/toxic/gray matrix ([`SHOWCASE_NAMING_HIERARCHY.md`](go-to-market/SHOWCASE_NAMING_HIERARCHY.md)); paste-ready Upwork **Azure Architecture Readiness Review** ? Azure-first SKU ([`UPWORK_LISTINGS.md`](go-to-market/UPWORK_LISTINGS.md)).

## 2026-07-29 ï¿½ GTM: **M-133** Option D ï¿½ Enterprise Customer Intake long-term primary (ratified)

Owner note in [`DEMO_PREVIEW.md`](library/DEMO_PREVIEW.md): primary buyer sample name = Enterprise Customer Intake Modernization; Claims secondary; Contoso/Northwind forbidden in primary one-sentence. No rename-in-place; authoring/default flip stay **TB-980**/**TB-981**. Matrix ï¿½1b.

## 2026-07-29 ï¿½ GTM: **M-107** Option A ï¿½ Claims-static canonical anonymous proof funnel

Owner decision: primary cold proof = `/showcase/claims-intake-modernization`; welcome?`/see-it`?CTA + get-started + Why Verify use Claims (Contoso `/demo/preview` secondary). Matrix ï¿½1a + marketing UI alignment. Option D ratified separately as **M-133**.

## 2026-07-29 ï¿½ GTM: **M-134** sample-package funnel ID matrix + **M-24** Upwork listing draft

Honest co-primary surface?package?IDs map ([`SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md`](go-to-market/SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md)); Upwork **AI Architecture Governance Review** paste-ready copy ([`UPWORK_LISTINGS.md`](go-to-market/UPWORK_LISTINGS.md)).

## 2026-07-29 ï¿½ GTM: **M-34** / **M-22** / **M-23** ï¿½ named SKU talk track + paid pilot offer drafts

**Outcome.** New [`PAID_PILOT_OFFERS.md`](go-to-market/PAID_PILOT_OFFERS.md) locks the four service SKU names for outreach/SOWs, drafts **Option A** (ArchLucid AI & Cloud Architecture Readiness Review package) and **Option B** (30ï¿½60 day pilot with SKU-mapped milestones), and points conversion at the subscription order form. [`ORDER_FORM_TEMPLATE.md`](go-to-market/ORDER_FORM_TEMPLATE.md) gains **Addendum D** (prior SOW / named SKU / closeout / pilot credit). Cross-links: [`SERVICE_LED_OFFERS.md`](go-to-market/SERVICE_LED_OFFERS.md), [`BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md) outreach stage, [`QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md) productized offers. Owner still personalizes fees and obtains counsel review before customer send; closing the first engagement remains **G-COMMERCE-02**.

## 2026-07-29 ï¿½ Pricing: **M-200** Team repricing ï¿½ **$499**/month bundle, 10-seat cap, grandfathering deleted

**Outcome.** Owner decision (**M-200**, delegated 2026-07-29) fixes the Team/Professional value-ladder inversion. [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) ï¿½ **3.2**: interim bundled Team Stripe SKU raised **$249 ? $499**/month, framed as an explicit **~16% bundle discount** vs the ï¿½ 5.2 decomposition ($199 + 5 ï¿½ $79 = $594); new **10-seat hard cap** on Team (5 included + up to 5 add-on at $79) so an 11th seat requires **Professional**; **grandfathering clause deleted** ï¿½ the product is pre-launch with no subscribers, and future changes for active subscribers route through the ï¿½ 5.3 re-rate gates. ï¿½ **5.2** locked-prices JSON: Team `planMonthlyUsd` 499 + `maxArchitectSeats` 10; Professional `includedUsers` corrected **15 ? 20** to honor `includedArchitectSeats`. Resulting ladder is monotonic ï¿½ Professional beats Team per seat ($89.95 vs $99.80), per AI credit ($0.18 vs $0.20), and per review ($17.99 vs $24.95). `archlucid-ui/public/pricing.json` regenerated; cross-references updated in [`STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md), [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item 22 / *Resolved 2026-05-30 (Team self-serve Stripe SKU at launch)*, and `docs/architecture/ai_initiative_governance.md`. Engineering UI follow-through (add-on price render + catalog coherence test) remains **TB-1166**. This entry supersedes the 2026-05-01 **$249** + grandfathering entry below.

## 2026-05-18 ï¿½ Scope clarification: **Teams / webhooks / Service Bus / recipes** ? **V1.1** buyer contract

**Outcome.** **Microsoft Teams** incoming-webhook chat-ops, **CloudEvents** outbound webhooks, optional **Azure Service Bus** integration-event fan-out (**ï¿½2.8**), and **customer-operated** bridges under [`docs/integrations/recipes/`](../integrations/recipes/README.md) (**ï¿½3**) are **V1.1** **buyer-contract** obligations ï¿½ **not** V1 GA integration commitments. **V1 GA** posture: **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** PR & manifest decoration, **Azure extractor ZIP** (**ï¿½2.16**), and related **ï¿½2** surfaces. **ï¿½2.14** now explicitly pairs **Teams + Slack**. **No code changes** ï¿½ documentation alignment with *owner scope clarification 2026-05-18* in [`V1_SCOPE.md`](library/V1_SCOPE.md) and [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md).

## 2026-05-18 ï¿½ Scope: **First-party Jira / ServiceNow / Confluence / Slack** ? **V1.1** window

**Outcome.** Owner scope update (**2026-05-18**): first-party **ITSM** (**ï¿½2.13**), **Slack** (**ï¿½2.14**), and **Confluence** (**ï¿½2.15**) are **V1.1** product obligations ï¿½ **not** V1 GA gatekeepers. **V1** integration posture: **Microsoft Teams**, **webhooks**, **REST**, **customer-operated** recipes. **No code changes** in this entry ï¿½ doc alignment. *Resolved 2026-05-18 (First-party connectors ï¿½ V1.1 window)* in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md). Updated: [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) ï¿½2.13ï¿½ï¿½2.15, [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½6ï¿½ï¿½6a, [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), [`docs/library/CONNECTOR_READINESS_MATRIX.md`](library/CONNECTOR_READINESS_MATRIX.md), [`docs/library/ITSM_BRIDGE_V1_RECIPES.md`](library/ITSM_BRIDGE_V1_RECIPES.md), assessment + recipe cross-links, **`dist/procurement-pack/INTEGRATION_CATALOG.md`**. **Superseded (same day):** follow-on changelog entry *Scope clarification: Teams / webhooks / Service Bus / recipes* moves those surfaces to **V1.1** with first-party connectors ï¿½ see **newest-first** section above.

## 2026-05-09 ï¿½ Startup: **Real-mode deployment fingerprint** (Production / Staging hard fail)

**Outcome.** **`RealModeDeploymentFingerprintRules`** in **`ArchLucid.Host.Core`** rejects **`AzureOpenAI:DeploymentName`** that is blank or mirrors **`AgentExecutionTraceModelMetadata`** sentinels (plus the **`fallback:`** trace prefix) when **`AgentExecution:Mode=Real`** on Production- or Staging-like hosts, so execution traces remain forensically useful. Wired from **`ArchLucidConfigurationRules.CollectErrors`**. Tests: **`ArchLucid.Host.Composition.Tests/RealModeDeploymentFingerprintRulesTests`**, **`ArchLucid.Api.Tests`** (**`ArchLucidConfigurationRulesTests`**). Docs: **`docs/library/AGENT_TRACE_FORENSICS.md`**.

## 2026-05-07 ï¿½ Brand: **Architecture Proof Engine** + lead promise *Defensible architecture, on demand.*

**Outcome.** Buyer-facing category updated to **Architecture Proof Engine** (`archlucid-ui/src/lib/brand-category.ts`); homepage H1 and hero copy aligned; intermediate label **AI Architecture Review Board** and original **AI Architecture Intelligence** kept on the seam for SEO/metadata escape hatches (`BRAND_CATEGORY_LEGACY`, `BRAND_CATEGORY_LEGACY_ORIGINAL`). Docs updated: [`docs/brand/BRAND_SYSTEM.md`](brand/BRAND_SYSTEM.md), [`docs/go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md), [`docs/go-to-market/PRODUCT_DATASHEET.md`](go-to-market/PRODUCT_DATASHEET.md), [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md), [`docs/go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md`](go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md), [`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`](go-to-market/COMPETITIVE_LANDSCAPE.md), [`docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md). CI: [`scripts/ci/assert_brand_category_seam.py`](../scripts/ci/assert_brand_category_seam.py) now blocks **both** legacy phrases outside the seam; **`.github/workflows/ci.yml`** runs `--fail`. Tracker: [`docs/architecture/REBRAND_WORKSTREAM_2026_05_07.md`](architecture/REBRAND_WORKSTREAM_2026_05_07.md); prior wave archived in [`docs/archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md`](archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md).

## 2026-05-05 ï¿½ Policy: **Atlassian** sequencing ï¿½ **Confluence** before **Jira** (paired workstream)

**Outcome.** Owner policy (**2026-05-05**): **ServiceNow** remains first. **Atlassian** (**Confluence** + **Jira**) is **one engineering workstream** ï¿½ **Confluence** publish **before** **Jira** issue sync, **same** release tranche (*Resolved 2026-05-05 (Atlassian sequencing ï¿½ Confluence before Jira)* in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)). **Jira** is **not** a prerequisite for **Confluence**. Docs updated: [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) ï¿½2.13 / ï¿½2.15, [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½6, [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), [`docs/library/ITSM_BRIDGE_V1_RECIPES.md`](library/ITSM_BRIDGE_V1_RECIPES.md), [`docs/integrations/recipes/README.md`](integrations/recipes/README.md), [`docs/archive/assessments/ArchLucid_Assessment_FirstPrinciples.md`](archive/assessments/ArchLucid_Assessment_FirstPrinciples.md), **`dist/procurement-pack/INTEGRATION_CATALOG.md`**. **Supersedes** prior **ServiceNow ? Jira ? Confluence** ordering for **Atlassian** only.

## 2026-05-05 ï¿½ Scope: **Confluence** first-party documentation publish promoted to **V1 GA**

**Outcome.** Owner scope update (**2026-05-05**): **Confluence Cloud** one-way **page publish** (findings / **review** summaries) to **`Confluence:DefaultSpaceKey`**, **API token / basic auth** MVP, OAuth follow-on ï¿½ **in scope for V1 GA** per [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) **ï¿½2.15**. **Atlassian engineering order** after this policy change: **ServiceNow** ? **Confluence** ? **Jira** (paired); see *Resolved 2026-05-05 (Atlassian sequencing ï¿½ Confluence before Jira)* above. [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½6, [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) (**Resolved 2026-05-05 (Confluence ï¿½ promoted to V1 GA)**, **Improvement 3**, **item 11**), [`docs/library/ITSM_BRIDGE_V1_RECIPES.md`](library/ITSM_BRIDGE_V1_RECIPES.md), [`docs/archive/assessments/ArchLucid_Assessment_FirstPrinciples.md`](archive/assessments/ArchLucid_Assessment_FirstPrinciples.md), and **`dist/procurement-pack/INTEGRATION_CATALOG.md`** aligned. Supersedes prior **V1.1-only** Improvement 3 / catalog rows for *Confluence-only* deferral (**2026-04-24**).

## 2026-05-05 ï¿½ Scope: **Slack** first-party chat-ops promoted to **V1 GA**

**Outcome.** Owner scope update (**2026-05-05**): **Slack** outbound notification sink (**incoming webhook** / alert routing parity with **Microsoft Teams** ï¿½ same **`EnabledTriggersJson`**, **Key Vault** secret-name references, Authority-shaped payloads) is **in scope for V1 GA** per [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) **ï¿½2.14**. Removes **Slack** from the ï¿½3 ï¿½out of V1ï¿½ table; supersedes the prior *Resolved 2026-04-23* **V2-only** posture in [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) **ï¿½6a** (rewritten as a supersession note). [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) (ï¿½1 + roadmap row + build-your-own copy), [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) **item 11**, and [`docs/archive/assessments/ArchLucid_Assessment_FirstPrinciples.md`](archive/assessments/ArchLucid_Assessment_FirstPrinciples.md) aligned. **Not** newly committed for V1 unless separately promoted: **Slack App Directory** listing, OAuth install UX as first-class product, in-Slack **interactive** approve/ack.

## 2026-05-05 ï¿½ Phase 3 **PR B**: coordinator strangler formal closure (ADR supersession + tracker/CI retirement)

**Outcome.** [ADR 0029](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Lifecycle ï¿½ **PR B** checklist closed (**owner-approved early merge**). [ADR 0010](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) + [ADR 0021](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) **`Superseded by`** [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md). Removed **`docs/architecture/PHASE_3_PR_B_TODO.md`**, **`scripts/ci/assert_pr_b_tracker_in_sync.py`**, **`scripts/ci/tests/test_assert_pr_b_tracker_in_sync.py`**, and **`.github/workflows/coordinator-parity-daily.yml`**; **`ci.yml`** no longer runs the PR B tracker sync guard. Updated [`COORDINATOR_STRANGLER_INVENTORY.md`](architecture/COORDINATOR_STRANGLER_INVENTORY.md), [`COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md), **`PENDING_QUESTIONS`** item **35e** retrospective wording. Historical CHANGELOG rows that linked the removed files remain valid **historical record** (paths no longer exist).

## 2026-05-03 ï¿½ Docs: **`FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER`** runbook (planned LLC seller-of-record migration)

**Outcome.** Added [`docs/runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](docs/runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md) ï¿½ phased playbook to move ArchLucid commercial/vendor identity (**Partner Center**, **Stripe**, contracts, Trust Center/templates) toward **Francis Architecture, LLC** during V1, with explicit **non-superseding** wording until execution is logged here. [`docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md`](docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md) footnote + **Related** link; [`docs/PENDING_QUESTIONS.md`](docs/PENDING_QUESTIONS.md) scope block + items **8**/**9** clarification (sole-prop / founder resolutions remain authoritative until cutover completes).

## 2026-05-03 ï¿½ **Improvement 9** resolved: **`PRIVACY_POLICY.md`** owner-finalized (**no** obsolete `PRIVACY_NOTICE_DRAFT.md`); **`PENDING_QUESTIONS` item 37(c)** resolved (support-bundle **pre-forwarding** posture)

**Outcome.** **`docs/go-to-market/PRIVACY_POLICY.md`** reaffirmed **owner-approved / non-draft** canonical public privacy policy (**Last reviewed UTC** bumped to **2026-05-03**; **effective date** unchanged). **`docs/PENDING_QUESTIONS.md`** **`### Improvement 9`** row updated from deferral ? **Resolved 2026-05-03**; deprecated reference to **`docs/security/PRIVACY_NOTICE_DRAFT.md`** removed (file never existed in current tree ï¿½ marketing reads monorepo path via **`archlucid-ui/src/lib/privacy-policy-marketing.ts`**). **Item 37(c):** owner chose **`A`** ï¿½ **default shipped secret/env redaction** at bundle assembly + **manual review before every external forward**; **tenant-identifying/contact PII** crosses to **external support only when** **`ExecuteAuthority`** downloader **explicitly intends** inclusion; **`SupportBundleAssembler` README/`references.json`/`SupportBundleNextStepsBuilder` strings updated** accordingly. **Item 28 ï¿½ trial baseline UX:** **`baselineReviewCycleHours`** **soft-required** direction **Approved 2026-05-03**; **`TRIAL_BASELINE_PRIVACY_NOTE.md`** + signup copy path per **`PENDING_QUESTIONS.md`** (canonical buyer surface **`archlucid.net`**, GitHub **`main`** inspection-only bias). **`Item 40`:** **(i)(iii)(iv)** prerequisites for **`PerTenantFunnel:PerTenantEmission`** **Approved 2026-05-03** (balancing test posture, notice-only tenant-admin gate, **`60%`** dashboard target); **item 40 (ii)** deferral (**SQL retention ? V1.1**) unchanged. **`PerTenantFunnel:PerTenantEmission`** default remains **`false`** until explicitly enabled per env. **ADR 0031** (**cross-tenant pattern library**) **Accepted** (**2026-05-03**) ï¿½ see **`docs/architecture/adrs/0031-cross-tenant-pattern-library.md`** and **`docs/PENDING_QUESTIONS.md` item 14** updated.

## 2026-05-01 ï¿½ Assurance posture: **V2** third-party pen test ï¿½ **no vendor committed**; **V1** owner-conducted

**Outcome.** **Owner decision 2026-05-01:** **External** third-party penetration testing (vendor SoW, assessor deliverables, Trust Center row for that engagement) is **V2**. **V1** pen testing is **owner-conducted** ï¿½ no commitment to Aeronova or any other firm. Docs: **`docs/library/V1_DEFERRED.md`** ï¿½6c (rewritten), **`docs/library/V1_SCOPE.md`** ï¿½3 (pen-test row ? **V2**), **`docs/PENDING_QUESTIONS.md`** (items **2**, **5**, **20**, assessment cadence trigger), **`docs/trust-center.md`**, **`docs/go-to-market/trust-center.md`**, **`CURRENT_ASSURANCE_POSTURE.md`**, **`PROCUREMENT_FAQ.md`**, **`docs/security/pen-test-summaries/`** (`2026-Q2-SOW.md` template-only, **`README.md`**, **`2026-Q2-REDACTED-SUMMARY.md`**, **`2026-Q2-OWNER-CONDUCTED.md`), **`OWNER_SECURITY_ASSESSMENT_2026_Q2.md`**, **`SOC2_SELF_ASSESSMENT_2026.md`** (G-002), **`dist/procurement-pack/*` mirror. **Engineering:** default assessor display for **`security-trust publish`** ? **`ArchLucid internal`** (`SecurityTrustPublishCommandOptions.cs`); tests updated. **Rule for assessors:** *Independent weighted quality assessments for **V1** must **not** reduce readiness scores solely because a third-party pen test is not yet executed.*

## 2026-05-01 ï¿½ Support bundle: generated **next-steps.json** + README summary (CLI + API)

**Outcome.** **`SupportBundleNextStepsBuilder`** in **`ArchLucid.Core`** drives **`next-steps.json`** (and matching README bullets) for CLI **`support-bundle`** and in-product **`/v1/admin/support-bundle`**. CLI **`manifest.json`** **`bundleFormatVersion`** **1.2**; API assembler **`server-1.1`**. Docs: **`TROUBLESHOOTING.md`** bundle contents list; **`QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md`** ï¿½ **10** (resolved).

## 2026-05-01 ï¿½ Observability: Application Insights connection string fallback + export checklist

**Outcome.** **`ObservabilityExtensions`** reads **`Observability:AzureMonitor:ApplicationInsightsConnectionString`** as a third source for **Azure Monitor** OTel exporters (after **`APPLICATIONINSIGHTS_CONNECTION_STRING`** and **`ApplicationInsights:ConnectionString`**). **`OBSERVABILITY.md`** ï¿½ new **Export path configuration (OpenTelemetry)** (App Insights, OTLP, Prometheus scrape, console).

## 2026-05-01 ï¿½ Pricing: interim Stripe Team self-serve **$249** / month USD + grandfathering

**Outcome.** [`PRICING_PHILOSOPHY.md`](docs/go-to-market/PRICING_PHILOSOPHY.md) ï¿½ **3.2** records bundled Team Checkout (**$249** recurring) alongside unchanged ï¿½ **5.2** list decomposition for quotes/order forms; **grandfather** subscribers who start at **$249** until an explicit ArchLucid billing change or voluntary cancel/resubscribe; net-new post-cutoff rate **TBD**. Operational wiring unchanged (`Billing:Stripe:PriceIdTeam`). **Owner strike list:** new [`runbooks/STRIPE_OPERATOR_CHECKLIST.md`](docs/runbooks/STRIPE_OPERATOR_CHECKLIST.md); cross-linked from [`STRIPE_CHECKOUT.md`](docs/go-to-market/STRIPE_CHECKOUT.md), [`BILLING.md`](docs/library/BILLING.md), [`PENDING_QUESTIONS.md`](docs/PENDING_QUESTIONS.md) item **22**, and library assessments **`QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_68_20.md`** + **`QUALITY_ASSESSMENT_2026_04_30_INDEPENDENT_82_40.md`**.

---

## 2026-05-01 ï¿½ Docs: proof-pack **redaction profiles** (`internal-pilot`, `customer-approved-external`, `anonymous-benchmark`)

**Outcome.** New [`PROOF_PACK_REDACTION_PROFILES.md`](docs/library/PROOF_PACK_REDACTION_PROFILES.md) (mandatory removals + per-profile rules + attestation block). Cross-linked from [`PROOF_OF_VALUE_SNAPSHOT.md`](docs/library/PROOF_OF_VALUE_SNAPSHOT.md) ï¿½ **7**/**9**, [`PRODUCT_PACKAGING.md`](docs/library/PRODUCT_PACKAGING.md) (Pilot layer), and [`QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md`](archive/assessments/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md) ï¿½ **10**. **Procurement:** owner decision recorded ï¿½ strict placeholder detection **only** on **release/procurement** artifact builds, not every CI (`HOW_TO_REQUEST_PROCUREMENT_PACK.md`, same assessment ï¿½ **10**). **GTM:** same assessment ï¿½ V1 **primary** buyer CTA **Request quote** (sales-led); **Team** Stripe button **visible** for non-placeholder checkout URLs (incl. test) without requiring production-live declaration. **AI quality:** same assessment + [`AGENT_OUTPUT_EVALUATION.md`](docs/library/AGENT_OUTPUT_EVALUATION.md) ï¿½ **conservative** real-mode/release bar; **block** releases on insufficient reference evidence (not warn-only). **Manual QA:** [`quality/MANUAL_QA_CHECKLIST.md`](quality/MANUAL_QA_CHECKLIST.md) ï¿½ ï¿½ **8.4** (lay scores, threshold discipline, actions to keep scores high) + intro pointer.

---

## 2026-04-30 ï¿½ Quality batch: tier **403**/**404** split, SCIM audit + rotation telemetry, TB-002/**TB-003** gates

**Outcome.** **`CommercialTenantTierFilter`** returns **`403`** (**`PackagingTierInsufficient`**) for **`TenantTier.Standard`** minimum gates and keeps **`404`** obfuscation for **`Enterprise`** (**`PackagingTierProblemDetailsFactory`**). **`RoleOverriddenByScim`** durable audit plus **`AUDIT_COVERAGE_MATRIX.md`** anchor **`audit-core-const-count:146`**. **`archlucid_startup_config_warnings_total`** (**TB-002**) and **`archlucid_query_p95_ms`** + **`tests/performance/query-allowlist.json`** + **`scripts/ci/assert_query_performance.py`** (**TB-003**, CI dry-run **`continue-on-error`**). Docs: **`TENANT_TIER_AND_ROUTE_ENUMERATION.md`**, **`COMMERCIAL_ENFORCEMENT_DEBT.md`**, **`OBSERVABILITY.md`**. SCIM token rotation reminder job and admin-notification plumbing as in session (migrations/hosted service).

---

## 2026-04-29 ï¿½ Tests: golden decisioning **case-31** (compliance storage rule + security coverage + topology pillar gap)

**Outcome.** New hand-authored corpus under **`tests/golden-corpus/decisioning/case-31`** (`input.json` + expected finding/decision/audit JSON). **`GoldenCorpusRegressionTests`** expects **31** case directories. Docs: **`DECISIONING_GOLDEN_CORPUS.md`**, **`DECISIONING_TYPED_FINDINGS.md`**, **`FINDINGS_TYPED_SCHEMA.md`**.

---

## 2026-04-29 ï¿½ Docs: reference-customers **`PUBLICATION_CHECKLIST.md`** + README **DRAFT** template row (placeholders only; **Published** gated per ï¿½4.1).

---

## 2026-04-29 ï¿½ Tests: findings recommended-actions hydration, replay export branches, commit guards

**Outcome.** Added **`FindingsSnapshotRelationalReadOrderedRecommendedActionsDirectSqlIntegrationTests`** (SQL container: `FindingRecommendedActions` **`ORDER BY` SortOrder** via `FindingsSnapshotRelationalRead`). Added **`EndToEndReplayComparisonExportServiceExecutiveAndRelationshipDiffTests`** (sponsor Markdown/HTML, null report guard, manifest relationship subsections, PDF pre-render cancellation). Added **`AuthorityDrivenArchitectureRunCommitOrchestratorCommitRunAsyncGuardTests`** (`CommitRunAsync` null/whitespace, malformed run id, missing **`RunRecord`** ? **`RunNotFoundException`** + baseline audit). **`COVERAGE_GAP_ANALYSIS.md`** not refreshed (no Cobertura merge).

---

## 2026-04-29 ï¿½ Governance SoD: Entra JWT `tid`/`oid` actor keys (ADR 0034, migration 130)

**Outcome.** Eliminates segregation-of-duty **dual-display** bypass against Entra JWTs: **`IActorContext.GetActorId()`** canonicalizes **`jwt:{tid}:{oid}`** (`ActorContext`). **`dbo.GovernanceApprovalRequests`** additive **`RequestedByActorKey`** / **`ReviewedByActorKey`** (**`130_GovernanceApprovalRequests_ActorKeys.sql`** + **`ArchLucid.sql`** / rollback **R130**); **`GovernanceSegregationRules`** compares JWT keys when present. **`GovernanceWorkflowService`** + HTTP **`GovernanceController`** thread keys; **`GovernanceSelfApprovalBlocked`** carries actor-key fields for audit. Decision: [**ADR 0034**](architecture/adrs/0034-segregation-of-duties-entra-oid-actor-keys.md); owner row [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) (**item 13**, Option **B**). Tests: **`ActorContextTests`**, **`GovernanceSegregationRulesTests`**, **`GovernanceWorkflowSegregationAndPromotionPropertyTests`** (same JWT key / different displays).

---

## 2026-04-29 ï¿½ ADR 0030 PR A4: drop `dbo.GoldenManifestVersions` (migration 111)

**Outcome.** **Shipped PR A4** of [ADR 0030 ï¿½ Coordinator ? Authority pipeline unification](architecture/adrs/0030-coordinator-authority-pipeline-unification.md): **`ArchLucid.Persistence/Migrations/111_DropGoldenManifestVersions_Legacy.sql`** hard-drops legacy **`dbo.GoldenManifestVersions`** (owner **`docs/PENDING_QUESTIONS.md`** item **35d** ï¿½ no historical Coordinator-shape rows preserved; merge-time **no-rollback** acknowledgement). **`ArchLucid.sql`** already documented removal (ADR ï¿½ Lifecycle ï¿½ PR A4); rollback **`Rollback/R111_DropGoldenManifestVersions_Legacy.sql`** recreates an empty shell only. **`docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md`** updated post PR A3/A4; ADR 0030 **ï¿½ Component breakdown** + **ï¿½ Lifecycle** mark PR A4 **DONE 2026-04-29**.

---

## 2026-04-28 ï¿½ Quality plan: sponsor PDF, glossary surface, data-consistency alert default, TOGAF pack

**Outcome.** **`GET /v1/marketing/sponsor-brief.pdf`** serves a QuestPDF rendering of **`docs/EXECUTIVE_SPONSOR_BRIEF.md`** (`ExecutiveSponsorBriefPdfBuilder`, `SponsorBriefMarketingController`); **`RepositoryDocsMarkdownPath`** walks parents from **`IWebHostEnvironment.ContentRootPath`** so **`docs/ï¿½`** resolves in integration tests (`WebApplicationFactory`) and **`dotnet run`**. **`GET /v1/marketing/enterprise-comparison.pdf`** uses the same resolver. **`OpenApiContractSnapshotTests`** snapshot refreshed after **`sponsor-brief.pdf`** route. **`archlucid-ui`** adds **`src/lib/glossary.ts`** re-export and in-product glossary tooltips (checklist, runs list, governance dashboard shell, alerts hub, policy packs lead). **`ArchLucid.Api/appsettings.Production.json`** and **`appsettings.Staging.json`** ship **`DataConsistency:Enforcement:Mode=Alert`** (base **`appsettings.json`** Warn/default) with **`ArchLucidDataConsistencyAlertsRaised`** Prometheus rule and **`OBSERVABILITY.md`** note; **`ConfigurationKeyCatalog`** documents the profile split. **`GET /v1/audit/search`** rejects **`beforeEventId`** without **`beforeUtc`**. Sample **`templates/policy-packs/togaf-adm-gates/`** (ADM gate mapping README + JSON). **`docs/go-to-market/SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md`** adds throughput/FTE illustration. **`docs/library/V1_DEFERRED.md`** audit-row updated for composite keyset.

---

## 2026-04-28 ï¿½ Owner security self-assessment finalized (evidence-pack filename)

**Outcome.** **`docs/security/OWNER_SECURITY_ASSESSMENT_2026_Q2-DRAFT.md`** replaced by **`docs/security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`** (owner-conducted; **not** third-party audited; **Limitations** section). Evidence-pack ZIP entry **`OWNER_SECURITY_ASSESSMENT_2026_Q2.md`** embedded in **`ArchLucid.Application`**. Trust Center / procurement mirrored links updated (**`docs/trust-center.md`**, **`go-to-market/trust-center.md`**, **`CURRENT_ASSURANCE_POSTURE.md`**, **`dist/procurement-pack/*`**). Tests: **`EmbeddedResourceEvidencePackSourceProviderTests`**.

---

## 2026-04-27 ï¿½ Quote inbox notification, onboarding hub trim, healthcare trust pointer

**Outcome.** Successful **`POST /v1/marketing/pricing/quote-request`** (SQL persist) triggers **`IMarketingPricingQuoteSalesNotifier`** ? transactional email to **`Email:PricingQuoteSalesInbox`** (default **`sales@archlucid.net`**); **`Noop`** logs **would notify**. Config surface: **`ArchLucid.Api/appsettings.json`** `Email` section; runbook [`docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md). **`docs/START_HERE.md`** is the =40-line **entry tree**; depth moved to [`docs/library/START_HERE_DEPTH.md`](library/START_HERE_DEPTH.md). **`README.md`** leads with **`START_HERE`**; contributor persona table moved to [`docs/library/CONTRIBUTOR_PERSONA_TABLE.md`](library/CONTRIBUTOR_PERSONA_TABLE.md). **`docs/trust-center.md`** adds **Healthcare and PHI**; **`docs/go-to-market/TENANT_ISOLATION.md`** links to it. **`docs/PENDING_QUESTIONS.md`** item 13 notes inbox wiring.

---

## 2026-04-27 ï¿½ Independent weighted quality assessment (snapshot)

**Outcome.** Added [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_27_INDEPENDENT_66_74.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_27_INDEPENDENT_66_74.md): first-principles weighted readiness **66.74%** (**S(score ï¿½ weight) / 102**; the 46 quality weights sum to **102**). Owner context recorded: production site at **`https://archlucid.net`**, quote-request destination **`sales@archlucid.net`**, first pilot **~2026-05-15**, initial vertical **Medicare/Medicaidï¿½adjacent healthcare**, GTM via professional network. One **DEFERRED** improvement (V1.1 commerce un-hold); eight actionable items with Cursor prompts (onboarding consolidation, quote notification, trust-center healthcare paragraph, coverage, scorecard, templates, quality gate).

---

## 2026-04-27 ï¿½ Azure Marketplace publisher identity and landing page URL approved

**Outcome.** The owner confirmed the legal entity for the Partner Center publisher/seller identity as Joseph Francis (Sole Proprietorship) and the production landing page URL as `https://archlucid.net/signup`. `docs/PENDING_QUESTIONS.md` item 8 and `docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md` were updated to reflect these decisions.

---

## 2026-04-27 ï¿½ Stripe statement descriptor, policy text, and webhook owner approved

**Outcome.** The owner reviewed and approved the drafted Stripe chargeback, refund, and dunning policy text. The "pending legal sign-off" markers were removed from `docs/go-to-market/ORDER_FORM_TEMPLATE.md` and `docs/go-to-market/trust-center.md`. The owner also confirmed the Stripe statement descriptor as `ARCHLUCID PLATFORM` and designated Joseph Francis as the owner for webhook rotation and incident response. `docs/PENDING_QUESTIONS.md` item 9 was updated to reflect these approvals.

---

## 2026-04-26 ï¿½ DbUp migration filenames: unique `NNN_` prefixes (CI R2)

**Outcome.** Resolved duplicate **`NNN_`** prefixes that made DbUp ordering between same-number scripts undefined: **`017_GovernanceWorkflow.sql`** ? **`038_GovernanceWorkflow.sql`** (graph parents stay **`017_GraphSnapshots_ParentTables.sql`**); **`035_HostLeaderLeases.sql`** merged into **`035_AuditProvenanceConversationTables.sql`**; **`096_CheckJson_CorePayloadColumns.sql`** ? **`116_CheckJson_CorePayloadColumns.sql`** with rollback **`Rollback/R116_CheckJson_CorePayloadColumns.sql`**. **`GreenfieldBaselineMigrationRunner`** skips **`038_GovernanceWorkflow`** when workflow tables already exist; **`000_Baseline_2026_04_17.sql`** and **`ArchLucid.sql`** comments aligned. **CI:** **`scripts/ci/check_migration_numbering.py`** passes. **Manual:** catalogs that already recorded the old script names in **`dbo.SchemaVersions`** may need a one-off journal row rename or baseline replay policy review (same concern as [`QUALITY_IMPROVEMENT_DECISIONS_2026_04_20.md`](archive/assessments/QUALITY_IMPROVEMENT_DECISIONS_2026_04_20.md) ï¿½5.1).

---

## 2026-04-25 ï¿½ Retire rename legacy CI guards (workspace dirs + Terraform `archiforge` grep)

**Outcome.** Removed **`doc-markdown-links`** steps that ran **`check_no_legacy_archiforge_dirs.py`** and its unittest, and removed **`terraform-assert-no-archiforge-in-tf`** (repo-wide **`infra/**/*.tf`** `archiforge` grep). CI checkouts never recreate deleted **`ArchiForge.*`** workspace folders. **`dotnet-fast-core`** still greps **`archiforge`** in C#, TS/TSX, and narrow marketing/terraform-edge paths. Deleted **`scripts/ci/check_no_legacy_archiforge_dirs.py`** / **`test_check_no_legacy_archiforge_dirs.py`**. **`.gitignore`** still lists **`ArchiForge.*/`**. **Manual:** run **`rg "archiforge" infra --glob "*.tf"`** on Terraform changes under **`infra/`** (see **[V1_DEFERRED.md](library/V1_DEFERRED.md)** ï¿½3). Checklist **2026-04-25** row.

---

## 2026-04-24 ï¿½ Opt-in tour copy finalized

**Opt-in tour copy finalized.** Five-step operator tour ("Show me around") now renders approved copy without pending-approval markers. Step 3 renamed from "Inspect a run" to "Review and commit" for clarity.

---

## 2026-04-24 ï¿½ Audit matrix vs `AuditEventTypes` reconciliation + CI guard

**Outcome.** **`docs/library/AUDIT_COVERAGE_MATRIX.md`** appendix is reconciled with **`ArchLucid.Core/Audit/AuditEventTypes.cs`**: the Core registry no longer duplicates the five **`Run.*`** rows (they stay only under the **`AuditEventTypes.Run`** appendix), **`SupportBundleDownloaded`** now has a Core appendix row aligned with **`SupportBundleController`**, and **`<!-- audit-core-const-count:118 -->`** matches the true **`public const string`** count (**103** top-level + **5** `Run.*` + **10** `Baseline.*`). **CI:** the **`dotnet-fast-core`** bash `grep` guard is replaced by **`scripts/ci/assert_audit_const_count.py`**, which parses the marker, counts and classifies every const, cross-checks appendix first-column names, and prints **`MISSING_IN_MATRIX` / `EXTRA_IN_MATRIX` / `MARKER_MISMATCH` / `ROW_COUNT_MISMATCH`** diffs (including **`::error`** lines for GitHub Actions). **`doc-markdown-links`** runs the same script plus **`scripts/ci/tests/test_assert_audit_const_count.py`**.

---

## 2026-04-24 ï¿½ Contributor one-pager + CI line budget

**Outcome.** New **[`docs/CONTRIBUTOR_ON_ONE_PAGE.md`](CONTRIBUTOR_ON_ONE_PAGE.md)** (=80 lines, scope-first) covers install order, a **60-second** `archlucid try` check, an **I want toï¿½** pointer table, and **if broken** (`TROUBLESHOOTING.md`, support-bundle, doctor). **README** persona rows prepend that file as the **first** link without dropping existing targets. **`docs/READ_THIS_FIRST.md`** adds a time-pressed callout. **CI:** `scripts/ci/assert_contributor_on_one_page_size.py` + unit test under **`doc-markdown-links`**. **`assert_docs_root_size`** default **max** raised **30 ? 31** for the extra root markdown file.

---

## 2026-04-24 ï¿½ Sponsor banner first-commit pin for all tenants + SQL backfill script

**Outcome.** **`dbo.Tenants.TrialFirstManifestCommittedUtc`** is now written on the **first golden manifest commit for every tenant** (`ITenantRepository.TryMarkFirstManifestCommittedAsync`, renamed from the trial-only SQL guard). **`SqlTrialFunnelCommitHook`** still emits **`TrialFirstRunCompleted`** + trial histograms **only** when **`TrialExpiresUtc`** is set. **`GET /v1/tenant/trial-status`** already projected **`firstCommitUtc`** on both branches; operator **`EmailRunToSponsorBanner`** behavior unchanged. **Maintenance:** idempotent **`ArchLucid.Persistence/Scripts/Maintenance/Backfill-FirstManifestCommittedUtc.sql`** sets the column from **`MIN(dbo.GoldenManifests.CreatedUtc)`** where still null. **Tests:** **`SqlTrialFunnelCommitHookTests`**, InMemory non-trial **`TryMarkFirstManifestCommittedAsync`** case, Vitest fake-clock day badge. **Docs:** **`SPONSOR_BANNER_FIRST_COMMIT_BADGE.md`**, **`API_CONTRACTS.md`**, **`EXECUTIVE_SPONSOR_BRIEF.md`**. **Audit matrix:** **`audit-core-const-count:118`** unchanged (no new **`AuditEventTypes`**).

---

## 2026-04-24 ï¿½ Rebrand PR-2: `/welcome`, `/get-started`, `/pricing` use `BRAND_CATEGORY` seam

**Outcome.** Per [`docs/archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md`](archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md) **PR-2**, marketing routes **`/welcome`** (page metadata + `WelcomeMarketingPage` hero copy), **`/get-started`**, and **`/pricing`** now render the buyer-facing category via **`import { BRAND_CATEGORY } from "@/lib/brand-category"`** (no hardcoded legacy phrase under `archlucid-ui/src/app/` for those surfaces). Each pageï¿½s Next.js **`metadata.other["x-archlucid-brand-category-legacy"]`** carries **`BRAND_CATEGORY_LEGACY`** for the SEO escape hatch (same pattern as PR-1 **`/why`**). **Tests:** Vitest specs **`welcome-brand-category.test.tsx`**, **`get-started-brand-category.test.tsx`**, **`pricing-brand-category.test.tsx`** assert the brand-category paragraph **`textContent`** contains **`BRAND_CATEGORY`** and not **`BRAND_CATEGORY_LEGACY`**. **Out of scope:** architect workspace copy (PR-6), CI guard FAIL flip (PR-7), screenshot gallery refresh.

---

## 2026-04-24 ï¿½ First real value: `archlucid try --real` (Azure OpenAI + simulator fallback)

**Outcome.** Shipped a **local CLI** path for evaluators to run the existing **`archlucid try`** demo stack against **real Azure OpenAI** using a **single shell gate** (**`ARCHLUCID_REAL_AOAI=1`**) plus **`--real`**, with: CLI **preflight** on **`AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_DEPLOYMENT_NAME`**; additive **`docker-compose.real-aoai.yml`** (**`AgentExecution:Mode=Real`**, **`AzureOpenAI:MaxCompletionTokens`** default **1024** via **`AZURE_OPENAI_MAX_COMPLETION_TOKENS`**); **`POST .../execute`** carries **`X-ArchLucid-Pilot-Try-Real-Mode`** for **`FirstRealValueRunStarted` / `FirstRealValueRunCompleted`** audit + OTel counters; **simulator fallback** (unless **`--strict-real`**) with **`FirstRealValueRunFellBackToSimulator`**, persisted **`Runs.RealModeFellBackToSimulator`** + deployment snapshot, and a **warning callout** + **Execution provenance** footer on the first-value Markdown (**`ExecutionProvenanceFooterRenderer`**); startup **`AgentExecution:Mode=Real`** validation messages list the three env vars; **`ArchLucidConfigurationRules.LogAgentExecutionRealModeInformation`** logs INFO when Real + keys are present. **SQL:** migration **114** adds pilot columns on **`dbo.Runs`**. **API:** **`pilotTryRealModeFellBack`** query on **`seed-fake-results`**. **OpenAPI / NSwag:** SCIM admin token responses and **`seed-fake-results`** query param carry minimal schemas so generated clients compile (**no `default(void)!`**). **Audit matrix:** **`audit-core-const-count:118`**. **Docs:** **[`docs/library/FIRST_REAL_VALUE.md`](library/FIRST_REAL_VALUE.md)**, ADR **[`docs/architecture/adrs/0033-first-real-value-single-env-var-flip.md`](architecture/adrs/0033-first-real-value-single-env-var-flip.md)**, updates to **[`docs/library/CLI_USAGE.md`](library/CLI_USAGE.md)**, **[`docs/runbooks/AGENT_EXECUTION_FAILURES.md`](runbooks/AGENT_EXECUTION_FAILURES.md)**, **[`docs/library/CONFIGURATION_KEY_VAULT.md`](library/CONFIGURATION_KEY_VAULT.md)**, **[`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md)**, **[`docs/security/SYSTEM_THREAT_MODEL.md`](security/SYSTEM_THREAT_MODEL.md)**.

## 2026-04-24 ï¿½ SCIM 2.0 inbound provisioning (Enterprise automation)

**Outcome.** Shipped an RFC 7644-aligned **SCIM 2.0 Service Provider** for inbound user/group lifecycle: dedicated controllers under `/scim/v2`, **`ScimBearer`** authentication with **Argon2id**-hashed per-tenant tokens (admin mint/revoke at `/v1/admin/scim/tokens`), SQL persistence (`dbo.ScimTenantTokens`, `dbo.ScimUsers`, `dbo.ScimGroups`, `dbo.ScimGroupMembers`) plus **`EnterpriseSeatsLimit` / `EnterpriseSeatsUsed`** on `dbo.Tenants` (migration **113**), hand-rolled **filter** + **flat PATCH** evaluators, default **group?role** mapping with `Scim:GroupRoleMappingOverrides`, and **seven** new **`AuditEventTypes.Scim*`** constants (matrix marker **`audit-core-const-count:115`**). **Layering:** SCIM repository contracts + filter AST live in **`ArchLucid.Core.Scim`** so `ArchLucid.Persistence` does not reference `ArchLucid.Application` (avoids a circular dependency). **Tests:** parser/patch/token/group-mapper/seat unit coverage, architecture source guards for SCIM anonymity + `ScimBearer` registration, JWT-hosted integration assert **401** without SCIM bearer, OpenAPI snapshot refreshed. **Docs:** ADR [`docs/architecture/adrs/0032-scim-v2-service-provider.md`](architecture/adrs/0032-scim-v2-service-provider.md), buyer + operator SCIM docs, threat model, integration catalog + pricing + V1 scope updates.

## 2026-04-24 ï¿½ First-tenant onboarding telemetry funnel (Improvement 12 / Prompt 12)

**Outcome.** Shipped Improvement 12 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 12. The marketing claim that a real tenant can reach a first finding inside 30 minutes is now **measurable** end-to-end, with a privacy posture (aggregated-only by default) that does not require an owner privacy decision before any data flows.

**Why aggregated-only by default.** The fastest way to substantiate the 30-minute claim is to count signups, opt-ins, run starts, run commits, and first-finding views as cardinality-bounded App Insights `customMetrics` rows ï¿½ that gives the funnel curve the dashboard needs without joining to any tenant identifier. The owner-only feature flag `Telemetry:FirstTenantFunnel:PerTenantEmission` (default **`false`** per the proposed Q40 default) gates two privacy-sensitive behaviors: adding a `tenant_id` tag to the metric, and inserting per-tenant rows into `dbo.FirstTenantFunnelEvents`. Until the owner answers Q40, the flag stays off everywhere ï¿½ including production ï¿½ and the privacy notice stays marked DRAFT. Neither mode ever captures `userId` or IP.

**What shipped.** **(1) Typed event vocabulary.** New [`ArchLucid.Core/Diagnostics/FirstTenantFunnelEventNames.cs`](../ArchLucid.Core/Diagnostics/FirstTenantFunnelEventNames.cs) defines the six funnel events (`signup`, `tour_opt_in`, `first_run_started`, `first_run_committed`, `first_finding_viewed`, `thirty_minute_milestone`) with an `IsValid` validator used by both the application layer and the API controller ï¿½ one source of truth across UI, API, application, and SQL. **(2) Configuration seam.** New [`ArchLucid.Core/Configuration/FirstTenantFunnelOptions.cs`](../ArchLucid.Core/Configuration/FirstTenantFunnelOptions.cs) (section `Telemetry:FirstTenantFunnel`) carries the single `PerTenantEmission` boolean. Bound via `IOptionsMonitor<T>` so an owner flip takes effect at the next emit without restart. **(3) Aggregated counter.** [`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`](../ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs) gains `FirstTenantFunnelEventsTotal` (`archlucid_first_tenant_funnel_events_total`) and a `RecordFirstTenantFunnelEvent` helper that always tags `event` and conditionally tags `tenant_id` only when the caller passes `recordPerTenant: true`. **(4) Application emitter.** New [`ArchLucid.Application/Telemetry/FirstTenantFunnelEmitter.cs`](../ArchLucid.Application/Telemetry/FirstTenantFunnelEmitter.cs) (interface in same folder) increments the counter every call; when `PerTenantEmission` is on, additionally persists a row through `IFirstTenantFunnelEventStore`. SQL append failures are logged at Warning and **swallowed** so a transient DB hiccup never breaks the aggregated metric or the caller. **(5) Persistence seam.** New [`ArchLucid.Persistence/Telemetry/IFirstTenantFunnelEventStore.cs`](../ArchLucid.Persistence/Telemetry/IFirstTenantFunnelEventStore.cs) with two implementations: [`SqlFirstTenantFunnelEventStore`](../ArchLucid.Persistence/Telemetry/SqlFirstTenantFunnelEventStore.cs) (Dapper, validates event name in code as a defense-in-depth layer over the SQL `CHECK` constraint) and [`NoopFirstTenantFunnelEventStore`](../ArchLucid.Persistence/Telemetry/NoopFirstTenantFunnelEventStore.cs) for the in-memory storage provider. The interface lives in `ArchLucid.Persistence` (not `ArchLucid.Application`) because the SQL implementation must live alongside its sibling Dapper repositories ï¿½ `ArchLucid.Persistence` does not reference `ArchLucid.Application`. **(6) SQL ï¿½ minimal table.** New migration [`ArchLucid.Persistence/Migrations/112_FirstTenantFunnelEvents.sql`](../ArchLucid.Persistence/Migrations/112_FirstTenantFunnelEvents.sql) creates `dbo.FirstTenantFunnelEvents` (`EventId BIGINT IDENTITY PK`, `TenantId UNIQUEIDENTIFIER NOT NULL FK ? dbo.Tenants(Id)`, `EventName NVARCHAR(64)`, `OccurredUtc DATETIME2(7) DEFAULT SYSUTCDATETIME()`) with a `CHECK` constraint over the six allowed event names and two non-clustered indexes (`(TenantId, OccurredUtc DESC)` for per-tenant lookups, `(OccurredUtc DESC)` for time-windowed scans). Schema is intentionally **minimal** ï¿½ no `UserId`, no IP, no user-agent ï¿½ to honor the GDPR Art. 6(1)(f) data-minimisation argument in the privacy notice. Rollback at [`ArchLucid.Persistence/Migrations/Rollback/R112_FirstTenantFunnelEvents.sql`](../ArchLucid.Persistence/Migrations/Rollback/R112_FirstTenantFunnelEvents.sql); master DDL [`ArchLucid.Persistence/Scripts/ArchLucid.sql`](../ArchLucid.Persistence/Scripts/ArchLucid.sql) updated. **(7) API surface.** [`ArchLucid.Api/Controllers/Admin/ClientErrorTelemetryController.cs`](../ArchLucid.Api/Controllers/Admin/ClientErrorTelemetryController.cs) gains `POST /v1/diagnostics/first-tenant-funnel` accepting [`FirstTenantFunnelEventRequest`](../ArchLucid.Api/Models/FirstTenantFunnelEventRequest.cs) (the body carries **only** the event name; the controller infers `tenantId` from `IScopeContextProvider` so the client can never spoof or leak the wrong tenant). Marked `[AllowAnonymous]` because the `signup` event must fire before the user is authenticated; rate-limited by the existing controller-level `EnableRateLimiting("fixed")`. OpenAPI snapshot regenerated. **(8) DI wiring.** New partial [`ServiceCollectionExtensions.FirstTenantFunnel.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.FirstTenantFunnel.cs) binds `FirstTenantFunnelOptions` and registers the emitter as scoped. The store is wired by the storage-provider registrar ï¿½ `SqlStorageProviderRegistrar` ? `SqlFirstTenantFunnelEventStore`, `InMemoryStorageProviderRegistrar` ? `NoopFirstTenantFunnelEventStore` ï¿½ so a host that runs entirely in-memory never touches SQL even if the per-tenant flag is mistakenly flipped on (it would log warnings on every emit but still emit aggregated counters). **(9) UI instrumentation.** New [`archlucid-ui/src/lib/first-tenant-funnel-telemetry.ts`](../archlucid-ui/src/lib/first-tenant-funnel-telemetry.ts) (fire-and-forget POST, never throws, uses `keepalive: true` so events sent during a navigation are not dropped). Wired into five surfaces: [`SignupForm`](../archlucid-ui/src/components/marketing/SignupForm.tsx) (fires `signup` after a successful POST `/v1/register`), [`OptInTourLauncher`](../archlucid-ui/src/components/tour/OptInTourLauncher.tsx) (fires `tour_opt_in` when the user clicks "Show me around"), [`NewRunWizardClient`](../archlucid-ui/src/app/%28operator%29/runs/new/NewRunWizardClient.tsx) (fires `first_run_started` after the API returns a run id), [`CommitRunButton`](../archlucid-ui/src/components/CommitRunButton.tsx) (fires `first_run_committed` after a successful commit), [`FindingExplainPanel`](../archlucid-ui/src/components/FindingExplainPanel.tsx) (fires `first_finding_viewed` after the audit data loads). The 30-minute milestone is computed **client-side** from `localStorage` ï¿½ when `first_finding_viewed` lands within 30 minutes of the recorded `signup` timestamp, the client also fires `thirty_minute_milestone` once per browser. This avoids a server-side timer / hosted service for what is fundamentally a UX measurement. **(10) Dashboard.** New [`infra/modules/first-tenant-funnel-dashboard/`](../infra/modules/first-tenant-funnel-dashboard/README.md) (sibling to Improvement 11's golden-cohort module) provisions an Azure Monitor Workbook with four tiles: totals by event, conversion-vs-signup percentages, the 30-minute success-rate vs target, and a daily funnel volume line chart. Reads only the aggregated counter (`customMetrics.archlucid_first_tenant_funnel_events_total`) so the dashboard is correct in either flag mode. `terraform validate` against `azurerm 4.x` passes. **(11) Tests.** New [`FirstTenantFunnelEmitterTests`](../ArchLucid.Application.Tests/Telemetry/FirstTenantFunnelEmitterTests.cs) (5 tests: aggregated mode emits no `tenant_id` tag and writes no row; per-tenant mode emits the tag and persists the row with the clock-provided timestamp; per-tenant mode with a failing store still records the aggregated counter and does not throw; unknown event name throws; cancellation propagates). New API tests in [`ClientErrorTelemetryControllerTests`](../ArchLucid.Api.Tests/ClientErrorTelemetryControllerTests.cs) (4 new tests: happy path emits scoped tenant id; unauthenticated `Guid.Empty` scope still 204s; unknown event 400s; missing event 400s) ï¿½ including the explicit assertion that the controller body never reads a tenant id from the request. New UI test [`first-tenant-funnel-telemetry.test.ts`](../archlucid-ui/src/lib/first-tenant-funnel-telemetry.test.ts) (5 tests: body never contains `tenantId`/`tenant_id`/`userId`; every event is posted; 30-minute milestone fires when first_finding_viewed lands within the window; no milestone outside the window; milestone fires at most once per browser). **(12) Privacy.** New [`docs/security/PRIVACY_NOTE.md`](security/PRIVACY_NOTE.md) created from scratch (the file did not previously exist ï¿½ this is the stop-and-ask resolution from the prompt) and marked **DRAFT ï¿½ OWNER REVIEW PENDING** at the top. The funnel is recorded as the first named processing activity in ï¿½3.A under GDPR Art. 6(1)(f) (legitimate interest), with the legitimate-interest balancing test framing, the data minimisation argument (aggregated-only default; `tenantId`-only when flipped; never `userId` / IP), and the proposed retention default. **(13) Pending question.** New [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item **Q40** captures the four owner decisions still needed before flipping the per-tenant flag in any environment (legitimate-interest sign-off, retention window, opt-in policy, dashboard target). **(14) CI guard.** [`scripts/ci/controller_action_audit_allowlist.txt`](../scripts/ci/controller_action_audit_allowlist.txt) gains the new endpoint (mutating but pure-telemetry ï¿½ no `IAuditService.LogAsync`).

**Stop-and-ask boundaries respected.** This PR does **not** default the per-tenant flag to `true` (default is `false` per the proposed Q40 default). It does **not** capture `userId` or IP in either mode (the API model is event-name only; the SQL schema has no columns for them; the metric never tags them). The pre-existing `docs/security/PRIVACY_NOTE.md` did not exist; per the explicit prompt instruction the assistant stopped, asked, and then created the file from scratch with the funnel as the first named processing activity, marking the file DRAFT pending owner review.

**Why instrument the existing components instead of an event-bus pattern.** A pub/sub event bus would let any future caller fire funnel events, but it adds (a) a new bus contract that has to be versioned, (b) an extra hop where events can be lost or buffered, and (c) a debugging surface for "why did this event not show up?". For five well-known UI sites and one server-side controller, direct calls to the emitter (and to the typed client helper from the UI) keep the call graph one click deep. If the funnel grows to dozens of events the trade-off changes; today, simplicity wins.

**Why store the 30-minute milestone in `localStorage` rather than a server-side timer.** The success metric is **per-browser-session** by definition (a tenant who signs up, leaves for two hours, then returns and views a finding has not had a 30-minute first-finding experience). A server-side timer would have to track wall-clock state per `tenantId` and decide at scrape time whether to emit ï¿½ that is more state, more code, and more to invalidate when the user does the wizard twice. `localStorage` keeps the decision local to the actual session and naturally bounds the milestone to "first time only".

**Verification (run locally, all green):**
- `dotnet build ArchLucid.Host.Composition/ArchLucid.Host.Composition.csproj` ? 0 warnings, 0 errors.
- `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~FirstTenantFunnelEmitterTests"` ? 5 passed.
- `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~ClientErrorTelemetryControllerTests"` ? 12 passed.
- `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~OpenApiContractSnapshotTests"` ? 1 passed (snapshot regenerated and re-asserted).
- `npx vitest run src/lib/first-tenant-funnel-telemetry.test.ts src/components/tour/OptInTour.test.tsx` ? 16 passed.
- `npx vitest run src/components/marketing/SignupForm.test.tsx src/components/CommitRunButton.test.tsx src/app/'(operator)'/runs/new/NewRunWizardClient.test.tsx` ? 8 passed (no regressions in instrumented components).
- `terraform validate infra/modules/first-tenant-funnel-dashboard` ? `Success! The configuration is valid.`

---

## 2026-04-24 ï¿½ Azure OpenAI cost-and-latency dashboard + dual-band kill-switch for the golden-cohort real-LLM gate (Improvement 11 / Prompt 11)

**Outcome.** Shipped Improvement 11 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 11. Owner Q15 (2026-04-23 sixth pass) approved the **$50/month** Azure OpenAI budget for the golden-cohort real-LLM gate **conditional on the kill-switch being shipped**; this PR is the safety + visibility layer that makes the budget approval honourable.

**Why a dual-band kill-switch.** The legacy probe carried a single 90% kill threshold ï¿½ there was no "yellow" warning state, so the first signal an operator received was a hard skip. Q15 / the prompt asked for two bands so the owner gets advance warning before the cohort goes offline: **warn at 80%** (cohort still runs, GitHub issue auto-opened) and **kill at 95%** (cohort skipped for the rest of the calendar month, workflow does **not** count as failure). These ratios are now the **Q15-conditional rule** documented in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) Q15.

**What shipped.** **(1) Probe ï¿½ dual thresholds.** [`tests/golden-cohort/budget.config.json`](../tests/golden-cohort/budget.config.json) gains `warnThresholdPercent: 80`; `killSwitchThresholdPercent` moves from 90 ? 95. [`scripts/golden_cohort_budget_probe.py`](../scripts/golden_cohort_budget_probe.py) `_compute_exit_code` learns the warn band and emits new `EXPORT_WARN_THRESHOLD_USD` / `EXPORT_WARN_THRESHOLD_PCT` / `EXPORT_KILL_THRESHOLD_PCT` lines. The legacy single-threshold path is preserved (warn-percent defaults to None) so a config without `warnThresholdPercent` keeps working ï¿½ useful for ad-hoc operator probes and for the backwards-compat self-test. **(2) Workflow ï¿½ warn vs kill dispatch.** [`.github/workflows/golden-cohort-nightly.yml`](../.github/workflows/golden-cohort-nightly.yml) `cohort-real-llm-gate` job now (a) runs the cohort tests on **exit 0 OR exit 1** (warn band still proceeds), (b) runs an issue-creation step on exit 1 OR exit 2 ï¿½ `gh issue create` with a date-stamped title so multiple runs in the same day dedupe, (c) writes a per-scenario p50/p95/p99 latency JSON to `${RUNNER_TEMP}/golden-cohort-latency.json` (path injected via `ARCHLUCID_GOLDEN_COHORT_LATENCY_REPORT_PATH`) and uploads it as the `golden-cohort-latency` artefact even on test failure, and (d) needs a new `issues: write` permission for the auto-issue step. **(3) Terraform Workbook module.** New [`infra/modules/golden-cohort-cost-dashboard/`](../infra/modules/golden-cohort-cost-dashboard/README.md) (versions / variables / providers / main / outputs / README + `workbook.tpl.json`) provisions an Azure Monitor Workbook against an existing App Insights workspace with four tiles: month-to-date Azure OpenAI spend, per-scenario p50/p95/p99 latency bar chart, daily token-count line chart, and a kill-switch banner showing the warn/kill percent. The Workbook is **read-only by default** (`isLocked: true`) ï¿½ only the cohort-ops role on the subscription can edit; modifying queries means PR'ing the JSON template. The two threshold variables are pinned by `validation { condition = ... == 80 / 95 }` so a `terraform plan` that desyncs from the CI guard fails at plan time. `terraform fmt -check -recursive` and `terraform validate` (azurerm 3.100+) both pass. **(4) Merge-blocking CI guard.** New [`scripts/ci/assert_golden_cohort_kill_switch_present.py`](../scripts/ci/assert_golden_cohort_kill_switch_present.py) refuses to merge any PR that (a) removes / weakens the threshold ratios in `budget.config.json` away from 80 / 95, (b) removes the budget-probe step from the nightly workflow, (c) drops the downstream `if: steps.budget.outputs.exit_code == ...` gate, or (d) deletes the probe script itself. Wired into `.github/workflows/ci.yml` `doc-markdown-links` job immediately after the `BillingProductionSafetyRules` guard (same Q-decision-conditional pattern). **(5) Tests.** New self-test [`scripts/ci/tests/test_assert_golden_cohort_kill_switch_present.py`](../scripts/ci/tests/test_assert_golden_cohort_kill_switch_present.py) (10 tests: passes against real repo, passes on synthetic valid fixture, fails when budget config missing, fails when warn / kill threshold missing, fails when warn weakened to 50%, fails when kill weakened to 110%, fails when workflow missing, fails when workflow drops the probe reference, fails when workflow drops the exit-code gate, fails when probe script deleted). The probe's existing smoke tests in [`scripts/ci/test_golden_cohort_budget_probe.py`](../scripts/ci/test_golden_cohort_budget_probe.py) were rewritten to assert the new dual-band semantics (5 tests: under-warn returns 0, warn band returns 1, kill band returns 2, legacy single-threshold config still works, warn-threshold export lines emitted) ï¿½ these are also the prompt-mandated unit tests for threshold-ratio parsing. **(6) Runbooks.** New [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) with the operator response playbook (one-line diff to flip the gate from optional to required after the deployment exists; WARN vs KILL decision tree; how to read the Workbook tiles; what NOT to automate per the stop-and-ask boundaries). [`docs/runbooks/GOLDEN_COHORT_BUDGET.md`](runbooks/GOLDEN_COHORT_BUDGET.md) updated to reflect the dual-band semantics, new `EXPORT_WARN_*` lines, and the cap-vs-ratio distinction (cap is owner-editable; ratios are pinned by the CI guard). **(7) PENDING_QUESTIONS.** Item 25 annotated `Budget portion fully Resolved 2026-04-24 (Prompt 11 / Improvement 11 shipped)` with a pointer to the new runbook + guard. Q15 row in the resolved table updated to reflect the shipped state. The Q15-conditional rule line at the bottom of the document now explicitly names the 80% / 95% ratios and the merge-blocking guard.

**Stop-and-ask boundaries respected.** This PR does **not** provision the dedicated Azure OpenAI deployment (owner-only operational task per Q15 ï¿½ the Terraform module provisions only the Workbook); does **not** inject the Azure OpenAI secret into the workflow (owner-only via the protected GitHub Environment); does **not** flip `cohort-real-llm-gate` from `if:` (optional) to no-`if:` (required) ï¿½ that is documented as the one-line diff in the new runbook ï¿½ 2 and remains an owner-only separate PR after the deployment exists.

**Why a Workbook (not a Grafana dashboard)?** The repo already has Managed Grafana wired in `infra/terraform-monitoring/`, so the alternative was real. Rejected because (a) the data sources we need (Cost Management `ActualCost` for the cohort resource, `customMetrics` from App Insights) are already first-class in Azure Monitor; pulling them into Grafana means a new data-source credential and an extra hop; (b) Workbooks support `isLocked: true` declaratively in JSON, matching the prompt's "read-only-by-default; only cohort-ops can edit" requirement without a separate RBAC dance; (c) the cohort-ops audience is platform engineers who already live in the Azure portal for Cost Management ï¿½ pulling them into Grafana is friction.

**Why two thresholds instead of three (e.g., 80 / 90 / 95)?** Three thresholds would require either (a) a third workflow step that does something other than warn-or-skip, which has no defined semantics in Q15, or (b) collapsing 90 into either warn or kill, in which case why have it. The 80/95 split matches the prompt's exact `>= 80%` / `>= 95%` wording.

**Why is the cap variable but the ratios pinned?** Spend is a business decision; threshold ratios are the **safety contract**. If usage genuinely needs $100/month for a quarter, that's a cap-raise PR + security review ï¿½ but the ratios still mean "warn at 80% of whatever cap you picked, kill at 95%". Decoupling the two means the safety contract survives cap changes intact. The CI guard enforces only the ratios; it deliberately does not assert the cap value.

**Verification (run locally, all green):**
- `python scripts/ci/assert_golden_cohort_kill_switch_present.py` ? `OK: golden-cohort kill-switch shipped (warn=80%, kill=95%)`.
- `python -m unittest scripts.ci.tests.test_assert_golden_cohort_kill_switch_present` ? 10 passed.
- `python -m unittest scripts.ci.test_golden_cohort_budget_probe` ? 5 passed.
- `terraform fmt -check -recursive infra/modules/golden-cohort-cost-dashboard` ? clean.
- `terraform -chdir=infra/modules/golden-cohort-cost-dashboard validate` ? `Success! The configuration is valid.`

---

## 2026-04-24 ï¿½ Coordinator ? Authority pipeline unification PR A3 (ADR 0030, Improvement 8 / Prompt 8)

**Outcome.** Shipped **PR A3** of [ADR 0030 ï¿½ Coordinator ? Authority pipeline unification](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) per [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 8. Owner **Decision A (2026-04-23)** ï¿½ recorded in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item 35 ï¿½ unblocked the full Authority FK-chain rewrite of `DemoSeedService` + `ReplayRunService`; owner **Decision B (2026-04-23)** pinned `Demo:SeedDepth = quickstart | vertical` as the seed-density flag. **What shipped.** **(1) Demo + replay rewrites.** [`DemoSeedService`](../ArchLucid.Application/Bootstrap/DemoSeedService.cs) and [`ReplayRunService`](../ArchLucid.Application/ReplayRunService.cs) now emit only the Authority FK chain (`IAuthorityCommittedManifestChainWriter`); the legacy `ICoordinatorDecisionTraceRepository.CreateManyAsync` call site is gone. [`DemoSeedService.BuildManifest`](../ArchLucid.Application/Bootstrap/DemoSeedService.cs) takes a new `richSeed` flag ï¿½ **quickstart** writes the one-of-each minimum (1 service + 1 datastore + 1 service-to-datastore relationship); **vertical** writes the production-realistic depth (Checkout API + Payment Gateway + Orders DB + 3 typed relationships including the cross-service edge). Aliases `full` and `production-realistic` continue to map to `vertical`; everything else (including legacy `skeleton`) maps to `quickstart`. **(2) Coordinator interfaces + concretes deleted.** `ICoordinatorGoldenManifestRepository`, `ICoordinatorDecisionTraceRepository`, the four in-memory + SQL concretes (`InMemoryCoordinatorGoldenManifestRepository`, `InMemoryCoordinatorDecisionTraceRepository`, the `Coordinator` branches of `GoldenManifestRepository` + `DecisionTraceRepository`), the legacy `ArchitectureRunCommitOrchestrator` concrete, `RunCommitPathSelector`, `LegacyRunCommitPathOptions`, the `Coordinator:LegacyRunCommitPath` configuration knob in `appsettings.json` + the test-factory overrides, and the `Program.cs` warning that surfaced the legacy flag are all gone. `IArchitectureRunCommitOrchestrator` is now wired directly to `AuthorityDrivenArchitectureRunCommitOrchestrator` in [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs); the coordinator-shape repository registrations are gone from [`ServiceCollectionExtensions.CoordinatorAndArtifacts.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.CoordinatorAndArtifacts.cs). **(3) Read-side collapse.** [`UnifiedGoldenManifestReader`](../ArchLucid.Persistence/Reads/UnifiedGoldenManifestReader.cs) is now authority-only (the legacy `ICoordinatorGoldenManifestRepository` fallback was already dead since PR A4 dropped `dbo.GoldenManifestVersions`); [`RunDetailQueryService`](../ArchLucid.Application/RunDetailQueryService.cs) reads decision traces only from `IDecisionTraceRepository` keyed by `RunRecord.DecisionTraceId`. **(4) Authority FK chain round-trips relationships.** Per owner Decision A, the Authority FK chain must preserve the full contract manifest. [`Decisioning.Manifest.Sections.TopologySection`](../ArchLucid.Decisioning/Manifest/Sections/TopologySection.cs) grew a typed `List<ManifestRelationship> Relationships` collection; [`ContractGoldenManifestMapper.ToAuthorityModel`](../ArchLucid.Decisioning/Manifest/Mapping/ContractGoldenManifestMapper.cs) copies relationships into it on save; [`AuthorityCommitProjectionBuilder.BuildAsync`](../ArchLucid.Decisioning/Manifest/AuthorityCommitProjectionBuilder.cs) projects them back into `Cm.GoldenManifest.Relationships` (replacing the historical `Relationships = []` hardcode). The `Topology` section serialises as a single JSON blob (`TopologyJson` column) so no SQL migration is required for this round-trip. The Relationships row leaves the known-empty allow-list ([`AUTHORITY_PROJECTION_KNOWN_EMPTY.json`](architecture/AUTHORITY_PROJECTION_KNOWN_EMPTY.json)) in this PR. **(5) Test discipline rewritten.** [`DualPipelineRegistrationDisciplineTests`](../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) now asserts the **opposite** invariant ï¿½ the legacy coordinator interfaces are gone from the production graph; `IGoldenManifestRepository` and `IDecisionTraceRepository` resolve to concretes inside `ArchLucid.Decisioning.*` or `ArchLucid.Persistence.*`; `IArchitectureRunCommitOrchestrator` resolves to `AuthorityDrivenArchitectureRunCommitOrchestrator`. The 6 coordinator-shape repository contract test files, `DualPipelineInternalReadPathTests.cs`, `CoordinatorAuditDurableTests.cs`, `ArchitectureRunCommitPipelineIntegrationTests.cs`, `ArchitectureRunServiceExecuteCommitTests.cs`, and the two `RunLifecycleState*PropertyTests.cs` files were deleted (every assertion they made was on deleted types or on the legacy-vs-authority branching that no longer exists). The remaining mocking tests (`ArchitectureRunServiceCreateRunIdempotencyTests`, `ArchitectureRunServiceAuditTests`, `RunDetailQueryServiceTests`, `RunDetailQueryServiceApplicationTests`, `ReplayRunServiceTests`) now mock `IArchitectureRunCommitOrchestrator` + `IDecisionTraceRepository` directly. **(6) New integration coverage.** New [`DemoSeedDepthIntegrationTests`](../ArchLucid.Api.Tests/DemoSeedDepthIntegrationTests.cs) drives `DemoSeedService` through both `Demo:SeedDepth` modes via `WebApplicationFactory` overrides and asserts each commits a manifest with non-empty Services + Datastores + Relationships (`quickstart` ? 1+1+1; `vertical` ? 2+1+3 with the Payment Gateway service present), proving the FK chain preserves contract relationships end-to-end. **(7) OpenAPI snapshot regenerated.** [`ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`](../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json) was regenerated via `ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`; the diff is additive (FindingInspect schemas that had drifted in earlier PRs are now captured) and the `OpenApiContractSnapshotTests` snapshot test passes. **(8) ADR + governance updates.** [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Component breakdown PR A3 row is marked **DONE 2026-04-24** with the full shipped-list inline; ï¿½ Lifecycle PR A3 row is marked DONE; the header `Supersedes:` line now lists ADR 0022. [ADR 0022 ï¿½ Coordinator interface family retirement blocked](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) flips to **Superseded by ADR 0030 on 2026-04-24** (per ADR 0030 ï¿½ Lifecycle; the per-sub-PR gate-evidence framing it introduced is now history). [`scripts/ci/data/coordinator_reference_ceiling.json`](../scripts/ci/data/coordinator_reference_ceiling.json) ceilings drop to the residual comment-only references (`ICoordinatorGoldenManifestRepository = 2`, `ICoordinatorDecisionTraceRepository = 5`) ï¿½ the interfaces themselves are gone; the remaining counts are explanatory comments in production files referencing the historical names. [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item 35 owner Decision A is annotated `Shipped 2026-04-24 (PR A3)` with a pointer to this changelog entry. [`ArchLucid.Core/Configuration/DemoOptions.cs`](../ArchLucid.Core/Configuration/DemoOptions.cs) `SeedDepth` XML doc is updated to describe the `quickstart | vertical` choice and the `full` / `production-realistic` synonyms. **PR A4 stays separate.** Per the prompt's stop-and-ask boundary, the `dbo.GoldenManifestVersions` SQL drop migration (PR A4 ï¿½ already a no-op since the table is gone) is **not** bundled into this PR; the next session will execute it as a clean rollback boundary. **Why ship the coordinator-shape contract tests dead instead of porting them.** The 6 contract test files were specifically testing that two repository implementations (in-memory + SQL) behaved identically against the same interface. Deleting the interface deletes the contract; there is nothing to port. The authority-side `IGoldenManifestRepository` already has its own contract suite. **Why amend `TopologySection` rather than read relationships from `GraphSnapshot.Edges`.** `GraphSnapshot.Edges` carries `EdgeId / FromNodeId / ToNodeId / EdgeType / Weight`, which is a structurally different shape from `ManifestRelationship` (`RelationshipId / SourceId / TargetId / RelationshipType / Description`). Mapping graph edges to typed relationships would require lossy guessing of `RelationshipType`; round-tripping the contract `ManifestRelationship` rows through `TopologyJson` is byte-stable and matches how `Services` + `Datastores` already round-trip. **Stop-and-ask boundaries respected:** PR A3 and PR A4 stayed in separate PRs; the OpenAPI snapshot was regenerated rather than skipped. **Verification:** `dotnet build ArchLucid.sln -c Debug` ? 0 warnings, 0 errors; `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~DemoSeedDepthIntegrationTests"` ? 2 passed (quickstart + vertical); `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~OpenApiContractSnapshotTests"` ? 1 passed; full suite verification queued.

---

## 2026-04-24 ï¿½ In-product opt-in tour + `/admin/support` support-bundle download UI (Improvement 7, owner Q8 / Q9 / decisions F + G)

**Outcome.** Shipped Improvement 7 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 7 ï¿½ two long-pending operator capabilities now have UI surfaces: (a) a **first-tenant guided path** via an opt-in tour launched from the architect workspace home page, and (b) a **SaaS self-sufficiency** lever via an in-product support-bundle download at `/admin/support`. **API:** new endpoint [`POST /v1/admin/support-bundle`](../ArchLucid.Api/Controllers/Admin/SupportBundleController.cs) on a new `SupportBundleController` gated `[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]` per [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item 37 owner **decision F** (broader than Tenant Admin only ï¿½ matches the existing `/v1/admin/*` policy convention) and rate-limited via the existing `expensive` policy. The endpoint returns a streaming `application/zip` response with a generated `archlucid-support-bundle-<UTC stamp>Z.zip` file name. **Why a NEW controller (not `AdminController`)?** `AdminController` is class-attributed with `AdminAuthority`, which is **stricter** than the policy decision F prescribed; hosting this endpoint there would force a per-action override that contradicts the class-level guard. **Backed by** new application-layer service [`ISupportBundleAssembler`](../ArchLucid.Application/Support/ISupportBundleAssembler.cs) / [`SupportBundleAssembler`](../ArchLucid.Application/Support/SupportBundleAssembler.cs) which assembles the ZIP from the running host's perspective (host build identity from `Assembly`, environment-variable snapshot via [`SupportBundleSensitivePatternRedactor`](../ArchLucid.Application/Support/SupportBundleSensitivePatternRedactor.cs), references to API endpoints + correlation tips). **File-name conventions deliberately mirror** the CLI `SupportBundleArchiveWriter` constants (`README.txt`, `manifest.json`, `build.json`, `environment.json`, `references.json`) so a support engineer reading either bundle cannot tell which side produced it. **Why not call the CLI's `SupportBundleCollector` directly?** That collector probes `/health`, `/version`, and `/openapi/v1.json` over HTTP via `ArchLucidApiClient` ï¿½ running it inside the host would mean the API calling itself over the loopback adapter, doubling the HTTP plumbing for no signal gain. The server-side variant emits the host-side equivalents instead. **Layering note:** `ArchLucid.Cli` already references `ArchLucid.Application`, so the redactor is **ported** (not referenced from CLI) to keep the dependency arrow correct; a future PR can collapse the two by moving the CLI redactor into `ArchLucid.Application` and having the CLI delegate to it (the pattern set is intentionally byte-identical so that move is mechanical). **Redaction (mandatory):** every text section is filtered through `SupportBundleSensitivePatternRedactor.RedactSensitivePatterns` before being written to the archive ï¿½ bearer tokens, `X-Api-Key` headers, and password-shaped `key=value` pairs become `[REDACTED]`. Environment variables whose names match the secret-shaped pattern list (`PASSWORD`, `SECRET`, `API_KEY`, `APIKEY`, `TOKEN`, `CREDENTIAL`, `PRIVATE_KEY`, `CONN`, `CONNECTIONSTRING`) show `(set)` / `(not set)` only. **UI ï¿½ `/admin/support`:** new operator page [`(operator)/admin/support/page.tsx`](../archlucid-ui/src/app/%28operator%29/admin/support/page.tsx) with a single **Download support bundle** button (`data-testid="admin-support-download-bundle"`) that POSTs the endpoint, parses the `Content-Disposition` filename, and streams the ZIP to a browser download via `URL.createObjectURL`. The page also surfaces the still-open redaction-policy sub-question (item 37 part c) so operators don't assume the default policy is final. **Discoverability:** the prompt asked us to link from `/admin/api-keys` ï¿½ that page **does not exist** in the operator UI today, so we instead added a discoverable link from the operator-home **Operate** section (last bullet) pointing at `/admin/support`. **UI ï¿½ opt-in tour:** new component family in [`archlucid-ui/src/components/tour/`](../archlucid-ui/src/components/tour/) ï¿½ `TourStepPendingApproval.tsx` (removed 2026-04-24 when copy was approved; see **Opt-in tour copy finalized** above) had wrapped each step's body and rendered a visible `<<tour copy ï¿½ pending owner approval>>` marker (`data-testid="tour-pending-approval-marker"`); [`OptInTour.tsx`](../archlucid-ui/src/components/tour/OptInTour.tsx) is the controlled five-step modal (Back / Next / Finish, ARIA dialog role); [`OptInTourLauncher.tsx`](../archlucid-ui/src/components/tour/OptInTourLauncher.tsx) is the **only** way the tour opens ï¿½ it owns the local `isOpen` state and the **Show me around** button (`data-testid="opt-in-tour-launcher"`). The launcher is mounted on the operator-home header in [`(operator)/page.tsx`](../archlucid-ui/src/app/%28operator%29/page.tsx). **Per owner Q9 the tour NEVER auto-launches** ï¿½ the launcher does not check the LocalStorage flag on mount, and `OptInTour` defensively renders `null` when `isOpen=false`. The dismissal flag (`archlucid.optInTour.dismissed.v1` in `localStorage`) is a defensive marker for any future auto-launch path; the explicit button always re-opens the tour. **Per owner Q8 every step renders the pending-approval marker** ï¿½ the wording for all five steps is the assistant's first cut clearly labelled DRAFT, and the `TourStepPendingApproval` wrapper has **no prop to hide the marker** (deliberate ï¿½ that would let the marker silently disappear via config, which Q8 forbade). Removal protocol is documented inline: when the owner approves a step's copy, swap the wrapper for a plain fragment for that step. **Tests:** new application unit tests in [`ArchLucid.Application.Tests/Support/`](../ArchLucid.Application.Tests/Support/) ï¿½ [`SupportBundleAssemblerTests`](../ArchLucid.Application.Tests/Support/SupportBundleAssemblerTests.cs) (7 tests: null request guard, every canonical entry name present, generated file-name shape, README includes requester + tenant display, null requester / tenant fall back to placeholders, manifest declares server source + bundle-format version, cancellation token honored) and [`SupportBundleSensitivePatternRedactorTests`](../ArchLucid.Application.Tests/Support/SupportBundleSensitivePatternRedactorTests.cs) (12 tests: bearer / X-Api-Key / password redaction, null+empty handling, environment-variable name classification across six representative names, URL userinfo stripping, null+empty URL guard). New integration tests in [`ArchLucid.Api.Tests/SupportBundleEndpointTests.cs`](../ArchLucid.Api.Tests/SupportBundleEndpointTests.cs) (3 tests: `Reader` role returns **403** ï¿½ the prompt-mandated "ExecuteAuthority required" assertion; ApiKey-mode without a key returns **401**; happy path returns a 200 ZIP with every canonical entry plus a `Content-Disposition` filename starting `archlucid-support-bundle-`). New Vitest spec [`OptInTour.test.tsx`](../archlucid-ui/src/components/tour/OptInTour.test.tsx) (11 tests: `DRAFT_TOUR_STEPS` contains exactly five steps with non-empty title + body; **all five steps render the pending-approval marker** ï¿½ the prompt-mandated owner Q8 assertion; tour does NOT render dialog when `isOpen=false`; tour renders step 0 when `isOpen=true`; close button persists the dismissal flag; Next advances through every step then shows Finish on the last step; **launcher does NOT render the dialog on mount** ï¿½ the prompt-mandated owner Q9 "no auto-launch" assertion; launcher renders the dialog only after the button is clicked; launcher re-opens the tour even when the dismissal flag is already present; first step renders the marker via the launcher path). **Doc surgery:** [`docs/library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) gains two new rows under "Operate (governance and trust)" ï¿½ one mapping `POST /v1/admin/support-bundle` to `/admin/support` (Execute), one mapping the opt-in tour to the operator-home **Show me around** button. [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item 37 annotated `Shipped 2026-04-24 (parts a + b)` with a pointer to this changelog entry; **part c (the pre-forwarding redaction policy) remains owner-pending** and is now surfaced both on the `/admin/support` page and in the bundle README so operators can see the open question without grepping docs. **DI wiring:** [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs) registers `SupportBundleAssembler` as a singleton (stateless and read-only ï¿½ same lifetime treatment as the evidence-pack singletons added with Improvement 6). **Stop-and-ask boundaries enforced by tests:** the Vitest spec fails if the launcher ever renders the dialog before a click (auto-launch regression ï¿½ owner Q9), and fails if any of the five steps drops the pending-approval marker (owner Q8). **Out of scope of this entry:** any auto-launch path or first-sign-in interception (forbidden by Q9 ï¿½ even tagging the dismissal flag as a soft trigger is deferred until the owner approves a launch policy); replacing draft tour copy with finalized wording (owner Q8 ï¿½ the assistant's first cut MUST stay marked); the pre-forwarding redaction policy for the support bundle (item 37 part c ï¿½ open at owner level); a UI on `/admin/api-keys` (the page does not exist in this codebase ï¿½ discoverability is handled via the operator-home Operate link instead). **Verification:** `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~Support"` ? 19 passed; `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~SupportBundleEndpoint"` ? 3 passed; `npx vitest run src/components/tour/OptInTour.test.tsx` ? 11 passed; `dotnet build ArchLucid.Api/ArchLucid.Api.csproj` ? 0 warnings, 0 errors; `npx eslint src/app/'(operator)'/page.tsx src/app/'(operator)'/admin/support/page.tsx src/components/tour` ? clean.

---

## 2026-04-24 ï¿½ Trust Center evidence-pack ZIP endpoint (Improvement 6)

**Outcome.** Shipped Improvement 6 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 6 ï¿½ procurement teams can now pull every Trust Center artefact in **one** anonymous download instead of clicking ten GitHub links. The content was already in-repo; the lever is consolidation. **API:** new endpoint [`GET /v1/marketing/trust-center/evidence-pack.zip`](../ArchLucid.Api/Controllers/Marketing/TrustCenterEvidencePackController.cs) on a new `TrustCenterEvidencePackController`, gated `[AllowAnonymous]` (deliberate ï¿½ the Trust Center is a public procurement artefact; gating it behind auth would defeat the purpose) and rate-limited via the existing `fixed` policy. The response carries `Content-Type: application/zip`, `Cache-Control: public, max-age=3600`, and a strong `ETag` whose value is the SHA-256 of the included files' content (length-prefixed `(name, content)` pairs in canonical order ï¿½ see [`EvidencePackEtag`](../ArchLucid.Application/Marketing/EvidencePackEtag.cs) for the exact encoding and the unit-test rationale for length prefixing). Clients sending matching `If-None-Match` receive `304 Not Modified` with no body. **Backed by** [`IEvidencePackBuilder`](../ArchLucid.Application/Marketing/IEvidencePackBuilder.cs) / [`EvidencePackBuilder`](../ArchLucid.Application/Marketing/EvidencePackBuilder.cs) which (a) reads source bytes from [`EmbeddedResourceEvidencePackSourceProvider`](../ArchLucid.Application/Marketing/EmbeddedResourceEvidencePackSourceProvider.cs), (b) computes the content-driven ETag over the source entries only (NOT the README, so we can extend the README without invalidating cached ETags for unchanged source content), (c) auto-generates a `README.md` index that lists every entry with its first-16-hex SHA-256 fingerprint and explicitly calls out the V1.1-gated stop-and-ask boundaries (no redacted pen-test summary, no PGP key), and (d) writes the ZIP with a pinned `LastWriteTime` of `2026-01-01T00:00:00Z` so the bytes are byte-for-byte reproducible across runs and hosts. The artefact is then cached via `IMemoryCache` for 1 hour keyed by `TrustCenterEvidencePackController.CacheKey`. **Why embed the source files instead of reading `docs/`?** The endpoint must work in three environments: dev (`dotnet run`), integration tests (`WebApplicationFactory<Program>` where `ContentRootPath` resolves to the API project, not the test bin dir), and published Docker images (where the `docs/` tree is not shipped). `<EmbeddedResource Include="..\docs\..." LogicalName="ArchLucid.Application.Marketing.EvidencePack.<zipName>" />` in [`ArchLucid.Application.csproj`](../ArchLucid.Application/ArchLucid.Application.csproj) is the only resolution that works in all three ï¿½ same pattern the email templates already use. **ZIP contents (canonical order, prompt-mandated):** `README.md` (auto-generated index), `DPA-template.md`, `SUBPROCESSORS.md`, `SLA-summary.md`, `security.txt` (copy of the RFC 9116 file at `archlucid-ui/public/.well-known/security.txt`), `CAIQ-Lite.md` (`docs/security/CAIQ_LITE_2026.md` ï¿½ the prompt asked for `.xlsx` if present; no `.xlsx` exists in repo so the `.md` ships per the prompt's fallback), `SIG-Core.md`, `OWNER_SECURITY_ASSESSMENT_2026_Q2-DRAFT.md`, `PEN_TEST_SOW_2026_Q2.md` (the SoW from `docs/security/pen-test-summaries/2026-Q2-SOW.md`, **not** the redacted summary ï¿½ V1.1-gated per `docs/PENDING_QUESTIONS.md` Q10), `AUDIT_COVERAGE_MATRIX.md`. **Stop-and-ask boundaries enforced by tests:** `OrderedZipNames_DoesNotIncludeStopAndAskBoundaryArtefacts` (unit) and `Get_DoesNotIncludePenTestRedactedSummaryOrPgpKey` (integration) both fail if a future change adds a name containing `REDACTED` or `PGP`. **UI surgery:** [`docs/trust-center.md`](trust-center.md) gains a "Download the evidence pack" section (above the posture summary) with a buyer-friendly description of what's inside and what's deliberately omitted. The marketing route [`archlucid-ui/src/app/(marketing)/trust/page.tsx`](../archlucid-ui/src/app/%28marketing%29/trust/page.tsx) gains a primary blue **Download evidence pack (ZIP)** button (`data-testid="trust-center-evidence-pack-download"`) directly under the page header. **DI wiring:** [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs) registers `EmbeddedResourceEvidencePackSourceProvider` and `EvidencePackBuilder` as singletons (both are stateless and read-only ï¿½ singleton lets the embedded resource bytes load once per process). **Tests:** new application unit tests in [`ArchLucid.Application.Tests/Marketing/`](../ArchLucid.Application.Tests/Marketing/) ï¿½ [`EvidencePackEtagTests`](../ArchLucid.Application.Tests/Marketing/EvidencePackEtagTests.cs) (8 tests: quoted hex SHA-256 shape, deterministic across invocations, content sensitivity, name sensitivity, order sensitivity, length-prefix collision rejection, null arg guards), [`EvidencePackBuilderTests`](../ArchLucid.Application.Tests/Marketing/EvidencePackBuilderTests.cs) (6 tests: README prepended in canonical order, README mentions every source file and the stop-and-ask boundaries, ETag invariant under build-timestamp change, byte-identical ZIP for unchanged sources, ETag matches `EvidencePackEtag.Compute`, throws when provider returns no entries), and [`EmbeddedResourceEvidencePackSourceProviderTests`](../ArchLucid.Application.Tests/Marketing/EmbeddedResourceEvidencePackSourceProviderTests.cs) (3 tests: every canonical entry resolves and is non-empty, the canonical name list has the nine expected procurement artefacts, no `REDACTED` / `PGP` artefacts leak into the canonical list). New integration tests in [`ArchLucid.Api.Tests/TrustCenterEvidencePackEndpointTests.cs`](../ArchLucid.Api.Tests/TrustCenterEvidencePackEndpointTests.cs) (6 tests on the live `WebApplicationFactory<Program>`: ZIP contains every expected entry, redacted summary + PGP excluded, anonymous access works without auth headers, ETag and `Cache-Control: public, max-age=3600` set correctly, `If-None-Match` returns 304, ETag value matches `EvidencePackEtag.Compute` over the embedded sources). **Doc surgery:** [`docs/library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) gains a row under "Operate (governance and trust)" mapping `GET /v1/marketing/trust-center/evidence-pack.zip` to the marketing `/trust` page. **Out of scope of this entry:** any signing of the ZIP (the prompt asked only for ETag-based integrity); any per-buyer customization of contents (the same artefact ships to every requester ï¿½ that is the point); the redacted pen-test summary (V1.1-gated per Q10); the PGP key (V1.1-gated). **Verification:** `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~Marketing"` ? 17 passed; `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~TrustCenterEvidencePackEndpointTests"` ? 6 passed; `dotnet build ArchLucid.Api/ArchLucid.Api.csproj` ? 0 warnings, 0 errors.

---

## 2026-04-24 ï¿½ Governance dry-run / what-if mode for policy threshold changes (Improvement 5, owner Q37 / Q38)

**Outcome.** Shipped Improvement 5 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 5 ï¿½ operators can now preview the impact of proposed policy-pack threshold changes against historic runs without actually committing them. **API:** new endpoint [`POST /v1/governance/policy-packs/{id}/dry-run`](../ArchLucid.Api/Controllers/Governance/GovernanceController.cs) gated `[Authorize(Policy = ReadAuthority)]` (read auth is sufficient ï¿½ no real commit happens) accepts `{ proposedThresholds: {...}, evaluateAgainstRunIds: [...] }` plus optional `?page=`/`?pageSize=` query parameters and returns a per-run delta showing what the proposed threshold WOULD have done. Backed by [`IPolicyPackDryRunService`](../ArchLucid.Application/Governance/IPolicyPackDryRunService.cs) / [`PolicyPackDryRunService`](../ArchLucid.Application/Governance/PolicyPackDryRunService.cs) which (a) clamps page size to `[1, 100]` with a default of 20 (owner Q38), (b) loads each requested run via the existing `IRunDetailQueryService` so the dry-run uses the same detail surface as the per-run value report, (c) computes per-run severity counts and threshold outcomes against the four supported keys (`maxCriticalFindings`, `maxHighFindings`, `maxTotalFindings`, `maxTimeToCommitMinutes` ï¿½ see [`PolicyPackDryRunSupportedThresholdKeys`](../ArchLucid.Contracts/Governance/PolicyPackDryRunSupportedThresholdKeys.cs)), and (d) emits a single `GovernanceDryRunRequested` audit row through `DurableAuditLogRetry.TryLogAsync` so a transient SQL outage cannot block the response while still capturing the simulation. Per-run failures (missing / unknown run id) are flagged on the row as `runMissing` and counted in `deltaCounts.runMissing` rather than failing the entire request ï¿½ same isolation pattern as the recent-deltas aggregator. **Redaction (PENDING_QUESTIONS Q37 ï¿½ mandatory):** the `proposedThresholds` payload is serialised to JSON and run through the existing [`IPromptRedactor`](../ArchLucid.Core/Llm/Redaction/IPromptRedactor.cs) pipeline before being written to `AuditEvent.DataJson` ï¿½ no code path in the service bypasses it. The redacted JSON is also surfaced on the response (`proposedThresholdsRedactedJson`) so the UI can show the operator exactly what was persisted. **UI:** new operator page [`(operator)/governance/policy-packs/[id]/page.tsx`](../archlucid-ui/src/app/%28operator%29/governance/policy-packs/%5Bid%5D/page.tsx) hosts the dry-run modal [`GovernanceDryRunModal.tsx`](../archlucid-ui/src/components/governance/GovernanceDryRunModal.tsx) which collects a JSON object of proposed thresholds, a comma-or-whitespace-separated list of run ids, and an optional page size (default 20, max 100, both clamped client-side via [`POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE`](../archlucid-ui/src/types/policy-pack-dry-run.ts) / `POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE`). Result panel renders the delta-counts headline and the redacted JSON in a `<pre>` block so the operator can confirm PII never reaches the audit row. **Audit catalog surgery:** new constant [`AuditEventTypes.GovernanceDryRunRequested`](../ArchLucid.Core/Audit/AuditEventTypes.cs); [`docs/library/AUDIT_COVERAGE_MATRIX.md`](library/AUDIT_COVERAGE_MATRIX.md) marker bumped to `audit-core-const-count:107` and the matching event row added to both the main and appendix tables (with the redaction-pipeline requirement called out inline). **Tests:** new application unit tests in [`ArchLucid.Application.Tests/Governance/PolicyPackDryRunServiceTests.cs`](../ArchLucid.Application.Tests/Governance/PolicyPackDryRunServiceTests.cs) cover the page-size default + clamp, the page lower-bound clamp, the redaction pipeline being invoked on proposed thresholds, the would-block tally using proposed thresholds, missing-run handling, and that the persisted audit row carries the redacted payload. New integration test in [`ArchLucid.Api.Tests/PolicyPackDryRunIntegrationTests.cs`](../ArchLucid.Api.Tests/PolicyPackDryRunIntegrationTests.cs) (with [`PolicyPackDryRunIntegrationApiFactory.cs`](../ArchLucid.Api.Tests/PolicyPackDryRunIntegrationApiFactory.cs) replacing `IAuditRepository` with an in-memory capturing implementation) sends a request with a known PII pattern (email + SSN) and asserts the persisted `DataJson` contains `[REDACTED]` and **not** the raw values ï¿½ the integration-level guarantee the prompt asked for. New Vitest spec [`GovernanceDryRunModal.test.tsx`](../archlucid-ui/src/components/governance/GovernanceDryRunModal.test.tsx) asserts the default page-size constant is exactly 20 (owner Q38), the modal prefills the input with 20, the redacted JSON marker is rendered in the result panel on success, and an empty run-ids list short-circuits without an API call. **Out of scope of this entry:** any UI affordance to commit the proposed thresholds (deliberately read-auth gated ï¿½ the operator must use the existing publish flow); any new threshold key beyond the four already supported (extending the supported set is a follow-on with new contracts + service-level mapping). **Verification:** `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~PolicyPackDryRunIntegrationTests"` ? 3 passed; `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~PolicyPackDryRunServiceTests"` ? 7 passed; `npx vitest run src/components/governance/GovernanceDryRunModal.test.tsx` ? 5 passed.

---

## 2026-04-23 ï¿½ Brand-neutral content seam + V1 rebrand workstream PR-1 (`/why` flipped, WARN-mode CI guard shipped) (Improvement 4, owner Q6 / Q7)

**Outcome.** Shipped Improvement 4 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 4 ï¿½ the **brand-neutral content seam** plus the **first** of seven workstream PRs that flip every buyer-facing surface from "AI Architecture Intelligence" to "AI Architecture Review Board" (owner Q6 / Q7, Resolved 2026-04-23 sixth pass ï¿½ see [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)). **Seam (single point of truth):** new file [`archlucid-ui/src/lib/brand-category.ts`](../archlucid-ui/src/lib/brand-category.ts) exports `BRAND_CATEGORY` (= `"AI Architecture Review Board"`) and `BRAND_CATEGORY_LEGACY` (= `"AI Architecture Intelligence"`, kept exported deliberately so SEO redirect handlers and analytics tag mappers can still resolve the historical phrase for ~30 days post-PR-7; the stop-and-ask boundary in Prompt 4 explicitly forbids removing it in any PR before that window expires). JSDoc header documents the rebrand recipe ï¿½ `npm run rebrand-check` (or `python scripts/ci/assert_brand_category_seam.py` from repo root) lists every surface that still hardcodes the legacy phrase. **Flagship surface flipped (PR-1 only):** [`archlucid-ui/src/app/(marketing)/why/WhyArchlucidMarketingView.tsx`](../archlucid-ui/src/app/%28marketing%29/why/WhyArchlucidMarketingView.tsx) imports `BRAND_CATEGORY` and renders `{BRAND_CATEGORY}` in the lead paragraph; the lead paragraph also gains a `data-testid="why-brand-category-paragraph"` hook so the new Vitest assertion is unambiguous. The legacy phrase is preserved for SEO via [`archlucid-ui/src/app/(marketing)/why/page.tsx`](../archlucid-ui/src/app/%28marketing%29/why/page.tsx)'s `metadata.other["x-archlucid-brand-category-legacy"]` (renders as a hidden `<meta>` in the page head, invisible to users but discoverable by SEO crawlers and the future redirect handler). **CI guard (WARN through PR-6, FAIL in PR-7):** new merge-blocking script [`scripts/ci/assert_brand_category_seam.py`](../scripts/ci/assert_brand_category_seam.py) (wired into [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) under `doc-markdown-links` immediately after the BillingProductionSafetyRules guard) scans every file under `archlucid-ui/src/app/`, `docs/EXECUTIVE_SPONSOR_BRIEF.md`, `docs/go-to-market/COMPETITIVE_LANDSCAPE.md`, `docs/trust-center.md`, `templates/briefs/**/brief.md`, and `docs/library/PRODUCT_PACKAGING.md`. Allow-list rule: a scoped file may legitimately mention the legacy phrase IF it also references `BRAND_CATEGORY_LEGACY` (the SEO escape hatch); the seam itself (`archlucid-ui/src/lib/brand-category.ts`) is unconditionally allow-listed because it IS the export site. **Default mode is WARN** (lists offenders on stderr but exits 0) so PR-1 through PR-6 can land without the build going red on offenders that the workstream will fix in order; PR-7 flips the wiring to `--fail`. As of this PR, two known offenders are surfaced: [`archlucid-ui/src/app/(marketing)/welcome/page.tsx`](../archlucid-ui/src/app/%28marketing%29/welcome/page.tsx) (the page-metadata `description`) and [`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`](go-to-market/COMPETITIVE_LANDSCAPE.md) ï¿½ both flipped in PR-2 / PR-3 of the workstream tracker. **NPM script:** `npm run rebrand-check` (in `archlucid-ui/package.json`) calls the same Python guard so UI engineers get a one-command answer without a repo-root context switch. **Tests:** new Vitest assertion in [`archlucid-ui/src/app/(marketing)/why/WhyArchlucidMarketingView.test.tsx`](../archlucid-ui/src/app/%28marketing%29/why/WhyArchlucidMarketingView.test.tsx) renders the view, locates the brand-category paragraph by `data-testid`, asserts its `textContent` contains `BRAND_CATEGORY` and does **not** contain `BRAND_CATEGORY_LEGACY` (so a regression that re-hardcodes the legacy phrase fails this spec immediately, not just the markdown CI guard). Snapshot regenerated to capture the new value. New self-test [`scripts/ci/tests/test_assert_brand_category_seam.py`](../scripts/ci/tests/test_assert_brand_category_seam.py) materializes a temp fixture tree (seam + scoped files) and asserts seven invariants: (1) passes with no offenders, (2) passes when legacy string co-exists with `BRAND_CATEGORY_LEGACY` (the escape hatch), (3) WARN mode exits 0 but lists offenders on stderr, (4) `--fail` mode exits non-zero on any offender, (5) `templates/briefs/**/brief.md` is in scope, (6) the seam itself is always allow-listed, (7) the script exits non-zero in any mode if the seam file is missing. **Workstream tracker (new):** [`docs/archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md`](archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md) lists the seven-PR sequence: PR-1 (this PR ï¿½ seam + `/why` + WARN-mode CI), PR-2 (`/welcome` + `/get-started` + `/pricing`), PR-3 (`EXECUTIVE_SPONSOR_BRIEF.md` + `COMPETITIVE_LANDSCAPE.md`), PR-4 (per-vertical briefs), PR-5 (`trust-center.md` + `PRODUCT_PACKAGING.md`), PR-6 (in-product operator-shell copy), PR-7 (closing ï¿½ flip CI guard from WARN to FAIL, optionally delete tracker). **PENDING_QUESTIONS surgery:** question 39 marked Resolved for the schedule sub-decision (V1 confirmed) and the name sub-decision ("AI Architecture Review Board" confirmed), with the workstream tracker linked from the surfaced section so future sessions follow PR-2..PR-7 from the tracker rather than re-asking the schedule. **Out of scope of this PR (per Prompt 4 stop-and-ask boundaries):** in-product operator-shell copy (PR-6 only ï¿½ the operator-shell governance pages and nav labels stay on the legacy phrase until that PR); removing `BRAND_CATEGORY_LEGACY` from the seam (must stay exported through the SEO redirect window); flipping the CI guard to FAIL mode (PR-7 only). **Verification:** `python scripts/ci/assert_brand_category_seam.py` ? exits 0 with WARN listing the two known offenders; `python -m unittest discover -s scripts/ci/tests -p "test_assert_brand_category_seam.py"` ? 7 passed; `npx vitest run src/app/'(marketing)'/why/WhyArchlucidMarketingView.test.tsx` ? 3 passed (incl. the new BRAND_CATEGORY assertion); `npx vitest run src/app/'(marketing)'/why/why-marketing-axe.test.tsx` ? 1 passed (a11y unaffected by the copy change); `python scripts/ci/check_md_links.py` ? green; `python scripts/ci/assert_docs_root_size.py` ? 28/30.

---

## 2026-04-23 ï¿½ `BeforeAfterDeltaPanel` three-placement wiring + new aggregated `/v1/pilots/runs/recent-deltas` endpoint (Improvement 3, owner Q29)

**Outcome.** Shipped Improvement 3 from [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md`](archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md) ï¿½Prompt 3 ï¿½ the `BeforeAfterDeltaPanel` is now reachable from **all three** owner-Q29 placements (top of `/runs`, sidebar widget, inline on `/runs/{runId}`) using a single shared component dispatched by a `variant` prop, backed by one new aggregated endpoint so the panels do not fan out one HTTP call per run. **Component surgery (additive ï¿½ zero change for existing callsites):** [`archlucid-ui/src/components/BeforeAfterDeltaPanel.tsx`](../archlucid-ui/src/components/BeforeAfterDeltaPanel.tsx) gains a `variant?: 'cycle' | 'top' | 'sidebar' | 'inline'` prop defaulting to `cycle` (the legacy trial-onboarding "review-cycle delta" card, untouched), plus three new variant components co-located in [`archlucid-ui/src/components/BeforeAfterDelta/`](../archlucid-ui/src/components/BeforeAfterDelta/) ï¿½ [`BeforeAfterDeltaTopPanel`](../archlucid-ui/src/components/BeforeAfterDelta/BeforeAfterDeltaTopPanel.tsx) (median delta on findings + median time-to-committed-manifest across the most recent N committed runs, with a per-run row strip beneath the headline so the median is auditable at a glance), [`BeforeAfterDeltaSidebarPanel`](../archlucid-ui/src/components/BeforeAfterDelta/BeforeAfterDeltaSidebarPanel.tsx) (compact two-column rendering of the same medians for the sidebar slot), and [`BeforeAfterDeltaInlinePanel`](../archlucid-ui/src/components/BeforeAfterDelta/BeforeAfterDeltaInlinePanel.tsx) (single-run delta vs the most recent prior committed run for the **same architecture request**, with a "no prior commit yet for this request" hint when this is the first commit on the request ï¿½ information for the operator, not a broken panel). All three variants share [`useDeltaQuery`](../archlucid-ui/src/components/BeforeAfterDelta/useDeltaQuery.ts) which centralises URL shape, `mergeRegistrationScopeForProxy` header dance, and loading/error/cancellation state. **Why median, not mean:** the same reason the server-side aggregator chooses median ï¿½ one noisy outlier run (long debugging session, first run on a new tenant, etc.) cannot inflate the headline. **API surface:** new endpoint [`GET /v1/pilots/runs/recent-deltas?count=N`](../ArchLucid.Api/Controllers/Pilots/PilotsController.cs) on `PilotsController`, gated `[Authorize(Policy = ReadAuthority)]` (same gate as the per-run `pilot-run-deltas` sibling), `count` defaults to 5 and is server-clamped to `[1, 25]` via [`IRecentPilotRunDeltasService`](../ArchLucid.Application/Pilots/IRecentPilotRunDeltasService.cs) constants ï¿½ the hard ceiling exists because the panel is a "headline" surface, not exhaustive listing, and per-run delta computation cost dominates above ~25 rows. Backed by [`RecentPilotRunDeltasService`](../ArchLucid.Application/Pilots/RecentPilotRunDeltasService.cs) which reuses existing reads (`IRunDetailQueryService.ListRunSummariesAsync` + `IPilotRunDeltaComputer.ComputeAsync`) so the numbers in the panel match the per-run value report exactly ï¿½ no new persistence path, no shadow data shape. Filters to runs with a `CurrentManifestVersion` so the aggregate never mixes in-flight and committed runs. Returns [`RecentPilotRunDeltasResponse`](../ArchLucid.Contracts/Pilots/RecentPilotRunDeltasResponse.cs) with server-computed median aggregates over `TotalFindings` and `TimeToCommittedManifestTotalSeconds`. Per-row failures (missing detail, delta computer throws) are logged-and-skipped so a single bad run cannot blank the whole panel. **Wiring:** [`archlucid-ui/src/app/(operator)/runs/page.tsx`](../archlucid-ui/src/app/%28operator%29/runs/page.tsx) inserts `<BeforeAfterDeltaPanel variant="top" />` above the existing trial-onboarding `RunsIndexBeforeAfterPanel` (the two panels coexist ï¿½ different audiences, no overlap); [`archlucid-ui/src/components/SidebarNav.tsx`](../archlucid-ui/src/components/SidebarNav.tsx) adds a collapsible **Recent activity** card at the top of the sidebar (collapsed-by-default the first time so a brand-new operator does not see a sad-empty card pushing nav links down) wrapping `<BeforeAfterDeltaPanel variant="sidebar" />`; [`archlucid-ui/src/app/(operator)/reviews/[runId]/page.tsx`](../archlucid-ui/src/app/%28operator%29/runs/%5BrunId%5D/page.tsx) renders `<BeforeAfterDeltaPanel variant="inline" runId={runId} />` above the artifacts table, gated on a committed manifest existing. **Path note:** the prompt nominated `archlucid-ui/src/components/operator-shell/Sidebar.tsx`, but the operator shell's sidebar component is `SidebarNav.tsx` directly under `components/` ï¿½ wired there so the change is actually visible. **Tests:** new Vitest specs in [`archlucid-ui/src/components/BeforeAfterDelta/__tests__/`](../archlucid-ui/src/components/BeforeAfterDelta/__tests__/) ï¿½ one spec per variant (`BeforeAfterDeltaTopPanel.test.tsx`, `BeforeAfterDeltaSidebarPanel.test.tsx`, `BeforeAfterDeltaInlinePanel.test.tsx`) plus formatter unit tests (`formatDelta.test.ts`) ï¿½ sharing a single fetch handler module [`sharedRecentDeltasHandler.ts`](../archlucid-ui/src/components/BeforeAfterDelta/__tests__/sharedRecentDeltasHandler.ts) (MSW-style ergonomics without adding the MSW dep ï¿½ the operator-shell bundle stays narrow). Inline-variant spec proves the most-recent-prior-commit-on-the-same-request rule, the no-prior hint, and the 25-row lookback window. New unit tests in [`ArchLucid.Application.Tests/Pilots/RecentPilotRunDeltasServiceTests.cs`](../ArchLucid.Application.Tests/Pilots/RecentPilotRunDeltasServiceTests.cs) cover committed-only filtering, newest-first ordering, count clamping (zero / negative ? 1, excessive ? 25), per-run failure isolation, and the median computation on odd / even / empty samples. New integration tests in [`ArchLucid.Api.Tests/RecentPilotRunDeltasEndpointTests.cs`](../ArchLucid.Api.Tests/RecentPilotRunDeltasEndpointTests.cs) hit the live HTTP surface in the integration host: 200 OK with default count 5, explicit count respected, `count=9999` clamped to 25, `count=-3` clamped to 1, and JSON envelope camel-case property assertion. **Doc surgery:** [`docs/library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) Core Pilot ï¿½ essential row added for `GET /v1/pilots/runs/recent-deltas` mapped to all three placements. **Out of scope of this entry:** any new `Decisioning.Models.RunDeltaSummary[]` model (the prompt named one ï¿½ used the existing `PilotRunDeltas` numbers projected through new contracts in `ArchLucid.Contracts.Pilots` so the aggregated payload matches the per-run sibling 1:1); any auto-comparison between unrelated requests (the inline variant deliberately scopes to same-`requestId` priors ï¿½ use `/compare` for cross-request comparison). **Verification:** `npx vitest run src/components/BeforeAfterDelta src/components/BeforeAfterDeltaPanel.test.tsx` ? 25 passed; `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~RecentPilotRunDeltasService"` ? 9 passed; `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~RecentPilotRunDeltasEndpointTests"` ? 5 passed.

---

## 2026-04-23 ï¿½ Trial funnel TEST-mode end-to-end on staging: CLI `--staging`, Playwright spec, nightly workflow, billing-safety-rules CI guard (Improvement 2)

**Outcome.** Shipped Improvement 2 from [`docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](archive/root-superseded-2026-05-01/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md) ï¿½3 ï¿½ the trial signup funnel end-to-end on staging in **Stripe TEST mode** for a sales-engineer-led product evaluation. Live keys remain V1.1-deferred per owner Q17 (no `sk_live_*` traffic, no Marketplace publication, no DNS cutover; see [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½ 6b). **CLI surface (sales-engineer pre-flight):** new convenience flag `archlucid trial smoke --staging` ([`ArchLucid.Cli/Commands/TrialSmokeCommandOptions.cs`](../ArchLucid.Cli/Commands/TrialSmokeCommandOptions.cs)) auto-targets `https://staging.archlucid.net` and emits a single greppable line via [`TrialSmokeOneLineSummaryFormatter`](../ArchLucid.Cli/Commands/TrialSmokeOneLineSummaryFormatter.cs) ï¿½ `PASS|FAIL host=ï¿½ correlation=ï¿½ tenant=ï¿½ welcomeRun=ï¿½ failed=ï¿½` ï¿½ sourced from the `X-Correlation-ID` response header on the first `POST /v1/register` so an oncall responder has one grep token to span logs / audit events. Backwards-compatible: the long-form per-step output is unchanged unless `--staging` or `--one-line` is passed. Combining `--staging` with a non-staging `--api-base-url` is a parse-time error. **UI surface (end-to-end Playwright):** new spec [`archlucid-ui/e2e/trial-funnel-test-mode.spec.ts`](../archlucid-ui/e2e/trial-funnel-test-mode.spec.ts) with its own dedicated config [`playwright.trial-funnel-test-mode.config.ts`](../archlucid-ui/playwright.trial-funnel-test-mode.config.ts) drives a real browser through `/signup` ? `/signup/verify` ? operator wizard step 1 ? step 7 ? commit ? value report on `signup.staging.archlucid.net`. **Skip-by-default:** the spec self-skips when `STRIPE_TEST_KEY` is unset so it is safe on a developer laptop without staging credentials, and gracefully self-skips again when the LocalIdentity dev-verify endpoint is missing on the target environment. **Path note:** the prompt nominated `archlucid-ui/tests/e2e/...`, but the operator-shell convention (and both existing Playwright configs) is `archlucid-ui/e2e/`; the spec ships there so it is actually picked up ï¿½ flagged in the spec header. **Correlation propagation:** every API response is observed via `page.on("response")` and the last seen id is included in failure output for support. **Nightly automation:** new workflow [`.github/workflows/trial-funnel-test-mode.yml`](../.github/workflows/trial-funnel-test-mode.yml) runs the CLI smoke and the Playwright spec against staging on a `20 4 * * *` cron (also `workflow_dispatch`). On failure it POSTs a single-line summary (including the correlation id) to a placeholder `STAGING_ONCALL_WEBHOOK_URL` repo secret; if the secret is unset the workflow soft no-ops with a printed summary instead of failing on missing credentials, so the workflow can land before the owner picks the final webhook URL. Playwright traces / reports are uploaded as `trial-funnel-test-mode-playwright-traces` artifacts on failure (7-day retention). **CI guard (merge-blocking):** new script [`scripts/ci/assert_billing_safety_rules_shipped.py`](../scripts/ci/assert_billing_safety_rules_shipped.py) (wired into [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) under `doc-markdown-links`) refuses to merge if [`BillingProductionSafetyRules`](../ArchLucid.Host.Core/Startup/Validation/Rules/BillingProductionSafetyRules.cs) is removed or its three production-only checks are weakened ï¿½ specifically: the `sk_live_` prefix check, the `Billing:AzureMarketplace:LandingPageUrl` Partner Center landing-page check, and the `Billing:AzureMarketplace:MarketplaceOfferId` GA offer-id check ï¿½ and also fails if [`ArchLucidConfigurationRules`](../ArchLucid.Host.Core/Startup/Validation/ArchLucidConfigurationRules.cs) no longer references the class (so the checks would silently stop running on boot). Pure source-text guard ï¿½ no compilation needed ï¿½ runnable in any CI with Python 3.12. Self-test [`scripts/ci/tests/test_assert_billing_safety_rules_shipped.py`](../scripts/ci/tests/test_assert_billing_safety_rules_shipped.py) materializes a temp fixture tree, asserts the script passes against the real repo, and asserts non-zero exit on six distinct weakening shapes (missing file, removed method, removed `sk_live_` literal, removed offer-id message, missing wiring, file replaced with stub). **Tests:** new unit tests in [`ArchLucid.Cli.Tests/TrialSmokeCommandOptionsTests.cs`](../ArchLucid.Cli.Tests/TrialSmokeCommandOptionsTests.cs) (covers `--staging` auto-baseurl + auto-one-line, conflicting baseurl rejection, redundant matching baseurl accepted, standalone `--one-line`); new tests in [`ArchLucid.Cli.Tests/TrialSmokeRunnerTests.cs`](../ArchLucid.Cli.Tests/TrialSmokeRunnerTests.cs) for `X-Correlation-ID` propagation through the runner on both happy and failure paths; and a new dedicated test class [`ArchLucid.Cli.Tests/TrialSmokeOneLineSummaryFormatterTests.cs`](../ArchLucid.Cli.Tests/TrialSmokeOneLineSummaryFormatterTests.cs) for the formatter (PASS / FAIL shapes, `<none>` token for missing fields, null guards). The pre-existing [`ArchLucid.Host.Composition.Tests/BillingProductionSafetyRulesTests.cs`](../ArchLucid.Host.Composition.Tests/BillingProductionSafetyRulesTests.cs) already exercises the rule semantics at unit-test depth, so the new guard's contract is enforced at two layers: (i) C# unit tests for what the rules do, (ii) a Python source-text guard for the rules continuing to ship. **Doc surgery:** [`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`](runbooks/TRIAL_FUNNEL_END_TO_END.md) gains a new ï¿½ 9.1 **Sales-engineer playbook** (pre-call checklist, demo script, soft- vs. hard-reset shapes, stop-and-ask boundaries, two `PASS`-but-still-wrong failure shapes), ï¿½ 8 automated-verification table extended with rows for the `--staging` preset, the staging UI smoke, and the new CI guard, and ï¿½ 9 quick-start updated to lead with `--staging`. **Pending question 22** in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) updated to point at this work as the V1 deliverable that makes the V1.1 commerce un-hold safe (live keys still owner-only). **Out of scope of this entry:** any Stripe LIVE configuration, any Marketplace publication (stays Status: Draft per V1_DEFERRED ï¿½ 6b), any DNS cutover for `archlucid.net` / `signup.archlucid.net`. **Verification:** `python scripts/ci/assert_billing_safety_rules_shipped.py` ? 0 against the real repo; `python -m unittest discover -s scripts/ci/tests -p "test_assert_billing_safety_rules_shipped.py"` ? 7 passed; `dotnet test ArchLucid.Cli.Tests --filter "FullyQualifiedName~TrialSmoke"` ? 26 passed; `python scripts/ci/check_md_links.py` ? green; `python scripts/ci/assert_docs_root_size.py` ? 28/30.

---

## 2026-04-23 ï¿½ Buyer-facing first-30-minutes path: repo stub + marketing /get-started route (Improvement 1, Q1ï¿½Q5)

**Outcome.** Shipped Improvement 1 from [`docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](archive/root-superseded-2026-05-01/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md) ï¿½3 ï¿½ the buyer-facing first-30-minutes path ï¿½ across two surfaces in a single PR, sourced from owner sixth-pass decisions Q1ï¿½Q5 in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md). **Voice (Q1):** consultative / pragmatic, architect-to-architect ï¿½ used in both the repo stub at [`docs/BUYER_FIRST_30_MINUTES.md`](BUYER_FIRST_30_MINUTES.md) (~30 lines, audience-banner-first, no marketing puffery) and the marketing route at [`archlucid-ui/src/app/(marketing)/get-started/page.tsx`](../archlucid-ui/src/app/%28marketing%29/get-started/page.tsx). **Vertical-picker labels (Q2):** sourced from the existing [`templates/briefs/`](../templates/briefs/) folder slugs as the visible labels via a single source-of-truth file [`archlucid-ui/src/app/(marketing)/get-started/get-started-verticals.ts`](../archlucid-ui/src/app/%28marketing%29/get-started/get-started-verticals.ts) (`financial-services`, `healthcare`, `public-sector`, `public-sector-us`, `retail`, `saas`). **Note on Q2 wording:** the owner answer in PENDING_QUESTIONS Q2 enumerates `manufacturing` rather than the on-disk `retail` and `saas`; the on-disk slug set is the authoritative input to the CI sync guard, so the picker ships the actual six folder slugs and the discrepancy is flagged here for the owner's next pass on Q2. **Screenshots (Q3):** placeholder image slots only (`/get-started/step-{n}-placeholder.png`) ï¿½ real anonymized-tenant capture is a follow-on owner task once the owner names `tenantId` / `runId`. **Placeholder copy (Q4):** every owner-blocked sentence on both surfaces carries the q35-style marker `<<placeholder copy ï¿½ replace before external use>>`. **"Talk to a human" CTA (Q5):** intentionally omitted ï¿½ V1.1 deferred per Q5; the V1 sales-led motion routes through the existing Request a quote button on `/pricing`. **Email capture:** none in this PR (V1 commercial motion is sales-led). **CI guard:** new merge-blocking script [`scripts/ci/assert_buyer_first_30_minutes_in_sync.py`](../scripts/ci/assert_buyer_first_30_minutes_in_sync.py) (wired into `.github/workflows/ci.yml` under `doc-markdown-links`) enforces two invariants when either buyer surface is touched ï¿½ (a) the picker's vertical slugs must equal the on-disk `templates/briefs/` slug set exactly, (b) every prose paragraph in the buyer files must either contain the q35 marker or be an exact match for an entry in the script's small allow-list of consultative scaffolding sentences (intros, audience banner, no-install footer). **Tests:** Vitest spec [`get-started.test.tsx`](../archlucid-ui/src/app/%28marketing%29/get-started/get-started.test.tsx) asserts all five steps render with placeholder image slots, the picker exposes one button per `templates/briefs/` slug (read from disk so the test catches drift the same way the CI guard does), and no "talk to a human" CTA renders. Self-test [`scripts/ci/tests/test_assert_buyer_first_30_minutes_in_sync.py`](../scripts/ci/tests/test_assert_buyer_first_30_minutes_in_sync.py) materializes a temporary fixture tree and asserts the script exits non-zero when (1) picker labels diverge from `templates/briefs/` slugs, (2) a paragraph appears without the q35 marker and is not on the allow-list. Markdown link integrity (`scripts/ci/check_md_links.py`) green across the new doc. **Doc surgery:** [`docs/START_HERE.md`](START_HERE.md) "Audience split" row now points buyers at `BUYER_FIRST_30_MINUTES.md` first; the buyer-data-flow section gains a new step 1 pointing at the same canonical entry. **Pending question 36** in `docs/PENDING_QUESTIONS.md` updated ï¿½ the wiring is Resolved; the only owner-blocked follow-on is real-tenant screenshot capture (Q3). **Out of scope of this entry:** any commerce wiring (V1 motion stays sales-led), any auto-launch tour (Q9 opt-in only), the rebrand workstream (Improvement 4 ï¿½ separate PR), the trial funnel TEST-mode end-to-end (Improvement 2 ï¿½ separate PR).

---

## 2026-04-23 ï¿½ Assessment ï¿½4 owner Q&A: 11 decisions on items 29, 31ï¿½38 + two cross-cutting (no re-score)

**Outcome.** Owner decision (2026-04-23, fifth pass ï¿½ same day as the Jira, ServiceNow + Slack, reference-customer, and commerce un-hold scope resolutions below): the eleven open owner-only questions in [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) ï¿½4 (items 29, 31ï¿½38) plus two cross-cutting items (Trust Center "Recent assurance activity" update timing, "AI Architecture Intelligence" category-name openness) were resolved in a single Q&A. Item 30 (Marketplace publisher legal entity name on customer statements) is **deferred to the V1.1 commerce un-hold** and is not in this batch. **No re-score** ï¿½ these are implementation-detail decisions that do not move any of the 25 weighted qualities; they unblock the implementation PRs for Improvements 3, 5, 7, 8, 9, and 10. **Decision list:** **(29)** `BeforeAfterDeltaPanel` placement ? **all three** placements (top of `/runs` list, sidebar widget, inline per-`/runs/[runId]`); **(31)** `/why` comparison artefact ? **both** inline page section AND downloadable PDF; **(32)** Microsoft Teams trigger set ? **all five** (`run.committed`, `governance.approval.requested`, `alert.raised`, `compliance.drift.escalated`, `seat.reservation.released`); **(33)** golden-cohort baseline ? **lock SHAs today** from a single approved simulator run via `archlucid golden-cohort lock-baseline --write`; **(34)** stale `IMPROVEMENTS_COMPLETE.md` at repo root ? **delete** (git history preserves it); **(35)** board-pack PDF cover narrative ? **assistant-drafted placeholder** (`<<sponsor cover narrative ï¿½ owner approval before external use>>`); **(36)** monthly exec-digest cadence default for new tenants ? **opt-out** (existing tenants stay 'Weekly' via the three-step migration shape ï¿½ see migration safety note below); **(37)** governance dry-run audit metadata ? **capture override count AND payload** with the existing `LlmPromptRedaction`-style PII redaction pipeline mandatory; **(38)** governance dry-run pagination cap ? **20-default / 100-max** (matches assistant default); **(cross-cutting)** Trust Center "Recent assurance activity" ? **update immediately** on Aeronova pen test redacted-summary delivery (no comms draft gate); **(cross-cutting)** "AI Architecture Intelligence" category-name ? **open to repositioning** toward "AI Architecture Review Board" (surfaces new pending question 39 for the rebrand workstream schedule). **Two safe-default overrides flagged:** **(q36)** opt-out monthly digest means new tenants receive Monthly emails by default ï¿½ the unsubscribe link in `/settings/exec-digest` is the documented remediation; the V1 migration MUST use the three-step shape (add column with backfill default `'Weekly'`, drop the backfill constraint, add a forward-looking new-row default `'Monthly'`) so SQL Server's `ADD ï¿½ NOT NULL DEFAULT` behavior does not silently flip every existing tenant to Monthly. **(q37)** capture override payload means anyone with `ReadAuditAuthority` in the same tenant can see proposed policy override values; payload capture is **conditional** on the redaction pipeline being applied (if redaction is bypassed in a future change to the audit write path, payload capture must be turned off until redaction is restored). **Doc updates:** [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) gains a **Resolved 2026-04-23 (assessment ï¿½4 items 29, 31ï¿½38 + two cross-cutting ï¿½ 11 decisions)** section and a new pending question **39** (rebrand workstream schedule); [`docs/archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md) Prompt 1 (replacement) updated with the three-step migration shape + opt-out monthly default; Prompt 4 (replacement) updated with the override-payload capture rule + redaction-pipeline requirement + audit-test assertion change. **Out of scope of this decision:** the rebrand workstream itself (gated on owner approval via new pending question 39); the executed pen test summary publication and PGP key generation (still live V1 obligations); the V1.1 commerce un-hold (item 30 stays open until V1.1 planning starts).

---

## 2026-04-23 ï¿½ Buyer packaging: two layers (Pilot / Operate) + two UI surfaces (Visibility / Capability)

**Outcome.** Collapsed the **three** buyer-facing product narratives into **two** ï¿½ **Pilot** (former Core Pilot path) and **Operate** (analysis + governance in one layer; governance/write shaping still **Execute+** where documented). Collapsed **four** UI shaping concepts into **two** code seams ï¿½ **Visibility** (`useNavSurface()` composition: nav + `LayerHeader` / layer guidance) and **Capability** (`useOperateCapability()` + `OperateCapabilityHints`). **Nav group ids** in `archlucid-ui/src/lib/nav-config.ts`: `pilot`, `operate-analysis`, `operate-governance` (href and API policy names unchanged). **Backward compatibility:** `@deprecated` re-exports keep **`useEnterpriseMutationCapability`** / **`EnterpriseControlsContextHints`** / **`enterpriseMutationCapabilityFromRank`** for one minor release; Vitest **`archlucid-ui/src/lib/deprecation-shims.test.ts`** asserts **`@deprecated`** TSDoc on those shims. **Docs:** `docs/library/PRODUCT_PACKAGING.md` and `docs/library/V1_SCOPE.md` ï¿½2/ï¿½4 headings; `docs/EXECUTIVE_SPONSOR_BRIEF.md`; repo `README.md`, `archlucid-ui/README.md`, `dist/procurement-pack/README.md`; historical three-layer copy archived under **`docs/archive/PRODUCT_PACKAGING_THREE_LAYERS_2026_04_23.md`**. **CI:** new job **`two-layer-naming-lint`** + **`scripts/ci/assert_two_layer_naming.py`** (fails if buyer docs under `docs/` outside `docs/archive` and `docs/architecture/adrs` contain the two retired three-layer buyer labels enforced by that script). **Tests renamed/retargeted:** `OperateCapabilityHints.authority.test.tsx`, `operate-authority-ui-shaping.test.tsx`, updated seam regression files and `LayerHeader.test.tsx`.

---

## 2026-04-23 ï¿½ Commerce un-hold (Stripe live + Marketplace go-live) deferred to V1.1; assessment re-scored 70.53% ? 71.71%

**Outcome.** Owner decision (2026-04-23, fourth pass ï¿½ same day as the Jira, ServiceNow + Slack, and reference-customer scope resolutions below): the **commerce un-hold** milestone ï¿½ Stripe **live** API keys flipped on, the Azure Marketplace SaaS offer transitioned to `Published` in Partner Center, and DNS cutover for `signup.archlucid.net` to the production Front Door custom domain ï¿½ is **explicitly out of scope for V1, in scope for V1.1**. V1 GA does **not** wait on live commerce, and V1 quality assessments **must not** charge points against Adoption Friction, Decision Velocity, or Commercial Packaging Readiness for the absence of live keys / a `Published` listing. The V1 commercial motion is **sales-led**: `/pricing` displays numbers, `ORDER_FORM_TEMPLATE.md` drives quote-to-cash, and the trial funnel runs in **Stripe TEST mode on staging** as a sales-engineer-led product evaluation. **No code changes** in this entry ï¿½ pure scope and messaging alignment, plus a re-score of the open 2026-04-21 assessment. **What stays in V1:** all wiring (`BillingStripeWebhookController`, `BillingMarketplaceWebhookController`, `BillingCheckoutController`, `BillingProductionSafetyRules` startup gate, `[RequiresCommercialTenantTier]` 402 filter, Marketplace alignment doc, `/pricing` page) **plus the trial funnel TEST-mode end-to-end work (Improvement 2 in the open assessment) ï¿½ not deferred, stays a live V1 obligation**. **Doc updates:** [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½ 6b gains a second row for commerce un-hold alongside the reference-customer row added earlier today; [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) ï¿½ 3 gains a new "Out of scope for V1" row mirroring the ITSM / chat-ops deferral pattern; [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) gains a **Resolved 2026-04-23 (Commerce un-hold scope)** section, items 8 / 9 / 22 release-window-pinned to V1.1; [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) gains a new **ï¿½0.3 Commerce-un-hold-deferral re-score addendum** that re-scores **ï¿½1.2 Adoption Friction** (60 ? 70), **ï¿½1.12 Decision Velocity** (55 ? 70), and **ï¿½1.15 Commercial Packaging Readiness** (60 ? 75); the weighted total moves from **70.53% ? 71.71%** (Commercial bucket 70.18% ? 73.18%, Enterprise unchanged at 69.16%, Engineering unchanged at 71.84%); the **ï¿½2.1 Top weaknesses** ranking removes the "Marketplace listing not live" entry and rewords the trial-funnel weakness to scope it to TEST-mode staging (the V1 obligation); the **ï¿½2.2 Top monetization blockers** drops "Marketplace listing not published", "Stripe live keys not flipped", and "No public price page transition from displayed to transactable" ï¿½ three runner-ups promote to maintain a list of 5; **ï¿½2.5 Most Important Truth** updated from two owner-controlled V1 events to **one** (pen test execution + redacted-summary publication), with a new V1.1 sentence listing both the reference customer and the commerce un-hold; **ï¿½3 Improvement 2** stays actionable but its owner-gate note is updated ï¿½ "Switching from Stripe TEST to live keys" is now explicitly V1.1-deferred, not just owner-only; **ï¿½3 Improvement 4** (Marketplace + Stripe live readiness) is converted to **DEFERRED ï¿½ V1.1** with no Cursor prompt; a new **Improvement 10 ï¿½ Governance dry-run / what-if mode** is added to keep the actionable improvement count at 8; the companion [`docs/archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md) replaces Prompt 4 with a paste-ready prompt for Improvement 10. **Out of scope of this decision:** the executed pen test summary publication, PGP key generation, the trial-funnel TEST-mode work (Improvement 2), and the board-pack PDF endpoint (Improvement 9) **all remain live V1 obligations**. Calendar date for V1.1 is **not** pinned.

---

## 2026-04-23 ï¿½ First public reference customer deferred to V1.1; assessment re-scored 68.60% ? 70.53%

**Outcome.** Owner decision (2026-04-23, third pass ï¿½ same day as the Jira and ServiceNow + Slack scope resolutions below): the **first named, public reference customer** milestone is **explicitly out of scope for V1, in scope for V1.1**. V1 GA does **not** wait on at least one `docs/go-to-market/reference-customers/README.md` row reaching `Status: Published`, and V1 quality assessments **must not** charge points against the qualities most affected by its absence. The CI guard [`scripts/ci/check_reference_customer_status.py`](../scripts/ci/check_reference_customer_status.py) **stays in `continue-on-error: true` warn-mode** for the entire V1 window ï¿½ flipping it to merge-blocking is a V1.1 task, not a V1 hardening task. The `-15%` reference discount in [`docs/go-to-market/PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) ï¿½ 5.3 stays **notional** for V1; re-rate becomes a candidate at V1.1. **No code changes** in this entry ï¿½ pure scope and messaging alignment, plus a re-score of the open 2026-04-21 assessment. **Doc updates:** [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½ 6b (new "Commercial ï¿½ V1.1 candidates" section listing the reference-customer milestone with a connector-style table and four rules); [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) gains a **Resolved 2026-04-23 (Reference-customer publication scope)** section, item 19's earlier resolution row updated to point at the deferral, and item 27 (aggregate ROI bulletin) noted as implicitly slipping to V1.1 because it waits on the first `Published` row; [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) gains a new **ï¿½0.2 Reference-customer-deferral re-score addendum** that re-scores **ï¿½1.1 Marketability** (62 ? 75), **ï¿½1.4 Proof-of-ROI Readiness** (65 ? 75), **ï¿½1.5 Differentiability** (65 ? 70), **ï¿½1.6 Trustworthiness** (58 ? 63), and **ï¿½1.16 Procurement Readiness** (62 ? 66); the weighted total moves from **68.60% ? 70.53%** (Commercial bucket 65.83% ? 70.18%, Enterprise bucket 68.24% ? 69.16%, Engineering bucket 71.84% unchanged); the **ï¿½2.1 Top weaknesses** ranking and **ï¿½2.2 Top monetization blockers** drop the reference-customer entry to the bottom of those lists with an explicit "(deferred to V1.1 ï¿½ not held against V1 readiness)" annotation; **ï¿½2.5 Most Important Truth** updated to drop "the first paying tenant approves a published case study" from the three owner-controlled events that move the score; **ï¿½3 Improvement 1** is converted to **DEFERRED ï¿½ V1.1** with no Cursor prompt, and a new **Improvement 9 ï¿½ Quarterly board-pack PDF endpoint + monthly digest preset** is added to keep the actionable improvement count at 8; the companion [`docs/archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md) replaces Prompt 1 with a paste-ready prompt for Improvement 9. **Out of scope of this decision:** the Marketplace listing live, Stripe live keys flipped, executed pen test summary publication, and PGP key generation **remain live V1 obligations** ï¿½ none are deferred by this entry. Calendar date for V1.1 is **not** pinned; pinning requires a separate owner entry.

---

## 2026-04-23 ï¿½ ServiceNow scoped to V1.1; Slack scoped to V2 (Teams stays shipped in V1)

**Outcome.** Owner decisions (2026-04-23, second pass ï¿½ same day as the Jira-scope resolution below): the **ServiceNow** ITSM connector is **explicitly out of scope for V1, in scope for V1.1**, and the **Slack** chat-ops connector is **explicitly out of scope for V1 and V1.1, in scope for V2**. **Microsoft Teams is not retracted** ï¿½ it remains the V1 first-party chat-ops surface (already shipped: `POST/GET/DELETE /v1/integrations/teams/connections`, `dbo.TenantTeamsIncomingWebhookConnections` with `EnabledTriggersJson`, six production triggers, Logic Apps Standard fan-out under `infra/terraform-logicapps/workflows/teams-notifications/`, see [`docs/integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md`](integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md)). The decisions tighten previously open-ended messaging (ServiceNow had no release window; Slack was not on any roadmap row) into named release windows so buyer-facing copy stops reading as "someday" and engineering planning has real buckets. **No code changes** in this entry ï¿½ pure scope and messaging alignment across five docs. **ServiceNow V1.1 minimum-viable shape:** one-way (finding ? ServiceNow `incident` with correlation back-link); whether the same release also ships `cmdb_ci` mapping is an open V1.1-planning question; two-way status sync (ServiceNow ? ArchLucid) is **not** committed for V1.1. **Slack V2 minimum-viable shape:** parity with the shipped Microsoft Teams connector ï¿½ same per-tenant `EnabledTriggersJson` opt-in matrix, secrets held in Azure Key Vault with only a secret-name reference in SQL, the same canonical event-type catalog, no parallel notification model; in-Slack action affordances (acknowledge / approve from Slack) are stretch for V2, not committed. **Doc updates:** [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) ï¿½3 gains two new rows ("ServiceNow connectors" pointing at V1.1; "Slack connectors" pointing at V2); [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½6 ITSM table gains a ServiceNow row; new [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½6a "Chat-ops connectors ï¿½ V2 candidates" lists Slack with the rule "Microsoft Teams stays shipped in V1; this decision does not retract or downgrade Teams"; [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) ï¿½2 gains a ServiceNow row at **`[V1.1 ï¿½ planned]`** and a Slack row at **`[V2 ï¿½ planned]`** (also bumped *Last reviewed* to 2026-04-23); [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) gains a **Resolved 2026-04-23 (ServiceNow + Slack connector scope)** section, free-text question **11 ("Workflow-integration sequencing")** updated to drop ServiceNow from its deferral list, and the existing Jira *Affects* row updated to cross-reference the new ServiceNow + Slack resolution. **Out of scope of this decision:** Confluence remains deferred without a release window; Azure DevOps Work Items stays at `[Planned]`; Discord / Mattermost / other chat-ops surfaces are intentionally **not** promoted to V2 by this decision. Calendar dates for V1.1 and V2 are **not** pinned; pinning either requires a separate owner entry.

---

## 2026-04-23 ï¿½ Jira connector scoped to V1.1 (out of V1)

**Outcome.** Owner decision (2026-04-23): the **Atlassian Jira** first-party connector ï¿½ finding ? Jira issue creation plus bi-directional status sync ï¿½ is **explicitly out of scope for V1** and **explicitly in scope for V1.1**. The decision tightens previously open-ended "Planned" messaging into a named release window so buyer-facing copy stops reading as "someday" and engineering planning has a real bucket. **No code changes** in this entry ï¿½ pure scope and messaging alignment across four docs. **Doc updates:** [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) ï¿½3 gains a new "Jira connectors (ITSM bridge)" row in the V1 non-goals table, marked **V1.1 candidate** with the V1 fallback path (CloudEvents webhooks + REST API + Azure DevOps Work Items); [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) gains a new **ï¿½6 ï¿½ ITSM connectors ï¿½ V1.1 candidates** section with a connector-by-connector table and three rules (release-window-not-date, no-widening-without-decision, must-consume-Authority-events); [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) ï¿½2 promotes the Jira row from `[Planned]` to **`[V1.1 ï¿½ planned]`** with cross-links back to the scope contract and deferred inventory; [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) gains a **Resolved 2026-04-23 (Jira connector scope)** section so future sessions stop re-asking. **Out of scope of this decision:** Confluence and ServiceNow remain deferred per the existing Resolved 2026-04-21 entry; **Azure DevOps Work Items** is intentionally **not** promoted to V1.1 by this decision and stays at `[Planned]`. Calendar date for V1.1 is **not** pinned; that requires a separate owner entry.

---

## 2026-04-23 ï¿½ Durable audit: `AuthorityCommittedChainPersisted` for demo seed + replay commit

**Outcome.** `IAuthorityCommittedManifestChainWriter.PersistCommittedChainAsync` (authority SQL FK chain for trusted-baseline demo and for replay commit) previously left no **`dbo.AuditEvents`** row. **New** top-level constant **`AuditEventTypes.AuthorityCommittedChainPersisted`** in [`ArchLucid.Core/Audit/AuditEventTypes.cs`](../ArchLucid.Core/Audit/AuditEventTypes.cs). **Helper** [`ArchLucid.Application/Authority/AuthorityCommittedChainDurableAudit.cs`](../ArchLucid.Application/Authority/AuthorityCommittedChainDurableAudit.cs) (`TryLogAsync`) serializes a sanitized payload (`LogSanitizer` on `source` / `projectSlug`), sets **`CorrelationId`** from **`Activity.Current?.Id`** or a deterministic `source:runId` fallback, and swallows audit failures after a warning (same posture as `CoordinatorRunFailedDurableAudit`). **Call sites:** [`DemoSeedService`](../ArchLucid.Application/Bootstrap/DemoSeedService.cs) after each successful chain persist (`source: "demo-seed"`); [`ReplayRunService`](../ArchLucid.Application/ReplayRunService.cs) after **`IArchLucidUnitOfWork.CommitAsync`** on the commit-replay path (`source: "replay-commit"`). **DI:** `DemoSeedService` gains **`IAuditService`** + **`IActorContext`**; **`ReplayRunService`** gains **`IAuditService`**, **`IActorContext`**, **`ILogger<ReplayRunService>`** (composition unchanged otherwise). **Tests:** [`ArchLucid.Api.Tests/DemoSeedAuthorityChainAuditIntegrationTests.cs`](../ArchLucid.Api.Tests/DemoSeedAuthorityChainAuditIntegrationTests.cs) **`SeedAsync_authority_chain_audit_is_idempotent_against_sql`** (`Suite=Core`, **`GreenfieldSqlApiFactory`** + **`/health/ready`** so DbUp creates **`dbo.AuditEvents`** ï¿½ the default **`ArchLucidApiFactory`** uses **`StorageProvider=InMemory`** and never materializes that table; **`SkippableFact`** when SQL is unavailable); **`ReplayRunServiceTests`** (Application + Api) updated ctor wiring. **Docs:** [`docs/library/AUDIT_COVERAGE_MATRIX.md`](library/AUDIT_COVERAGE_MATRIX.md) (`audit-core-const-count:106`, durable table + appendix + **Last reviewed** + known-gaps addendum), [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) ï¿½2 one-line pointer.

---

## 2026-04-23 ï¿½ `archlucid-ui`: operator Security & Trust route dedupe (Next.js build)

**Outcome.** Next.js App Router cannot register two `page.tsx` files that resolve to the same URL. The signed-in **Security & Trust** surface moved from **`/security-trust`** to **`/workspace/security-trust`** ([`archlucid-ui/src/app/(operator)/workspace/security-trust/page.tsx`](../archlucid-ui/src/app/(operator)/workspace/security-trust/page.tsx)); the public marketing page stays at **`/security-trust`**. [`archlucid-ui/src/lib/nav-config.ts`](../archlucid-ui/src/lib/nav-config.ts) Operate (governance and trust) link updated. [`docs/library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) operator path updated. **`PilotOutcomeCard`:** invalid C#-style `is null` in TSX was already corrected to `=== null` ([`archlucid-ui/src/components/PilotOutcomeCard.tsx`](../archlucid-ui/src/components/PilotOutcomeCard.tsx)). **CI:** [`scripts/ci/assert_archlucid_ui_app_router_unique_paths.py`](../scripts/ci/assert_archlucid_ui_app_router_unique_paths.py) runs in **`docker-build-smoke`** and **`ui-unit`** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) so route-group collisions fail before `next build` / Docker.

---

## 2026-04-23 ï¿½ Contributor-doc folder move + SaaS-framing follow-on Q&A (9 owner decisions)

**Outcome.** Direct continuation of the 2026-04-23 SaaS-framing reconciliation (entry below). Six contributor / internal-operator docs were moved out of `docs/` root and `docs/library/` into a new **`docs/engineering/`** folder so a buyer who lands on the repo cannot accidentally open a Docker-required page. Files moved: [`engineering/FIRST_30_MINUTES.md`](engineering/FIRST_30_MINUTES.md), [`engineering/INSTALL_ORDER.md`](engineering/INSTALL_ORDER.md), [`engineering/BUILD.md`](engineering/BUILD.md), [`engineering/CONTAINERIZATION.md`](engineering/CONTAINERIZATION.md), [`engineering/DEVCONTAINER.md`](engineering/DEVCONTAINER.md), [`engineering/DEPLOYMENT.md`](engineering/DEPLOYMENT.md). All four newly moved files (BUILD, CONTAINERIZATION, DEVCONTAINER, DEPLOYMENT) gained the same explicit **Audience banner** that FIRST_30_MINUTES and INSTALL_ORDER already carried, framing each as "ArchLucid contributor / internal-operator only ï¿½ customers never run Docker, SQL, .NET, Node, or Terraform; customer entry is `archlucid.net`." Internal markdown links inside the moved files were rewritten so relative paths stay correct from the new depth (e.g., `../library/X.md`, `../onboarding/X.md`, `../../infra/X`). **Stub redirects** were left at all six old paths (`docs/FIRST_30_MINUTES.md`, `docs/INSTALL_ORDER.md`, `docs/library/BUILD.md`, etc.) so existing bookmarks, GitHub issue links, and CLI output continue to resolve. **Canonical entry points** updated to point at the new paths: [`START_HERE.md`](START_HERE.md) contributor spine table, repo-root [`README.md`](../REPOSITORY_README.md) (now opens with an explicit "Audience" banner directing buyers to the website-only path), [`dist/procurement-pack/README.md`](../dist/procurement-pack/README.md) (heavily reframed ï¿½ buyer entry is now `archlucid.net`, contributor docs are an explicit "engineer reviewing this pack" sidebar), and [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) ï¿½0.1 + ï¿½1.2 (justification reframed as "contributor friction only"). **CI script** [`scripts/ci/check_onboarding_spine_line_budget.py`](../scripts/ci/check_onboarding_spine_line_budget.py) updated to the new spine paths. **CLI output** [`ArchLucid.Cli/Commands/DoctorCommand.cs`](../ArchLucid.Cli/Commands/DoctorCommand.cs) `PrintSaaSProfileHints` updated to point at the new doc location. **Owner Q&A captured.** Nine in-session decisions recorded in [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) "Resolved 2026-04-23 (SaaS-framing follow-on Q&A ï¿½ 9 decisions)" ï¿½ covering the contributor-folder move (this entry), the **ADR 0030 PR A3/A4 unblock path** (build the full Authority FK chain in demo-seed + replay; **tier the seeded data by preset** ï¿½ `quickstart` gets a minimum FK-satisfying skeleton, `vertical` presets get production-realistic snapshots / decision traces / evidence), the **buyer-facing first-30-minutes doc** (both repo doc + marketing route, **vertical-picker-first** preset before any sample run), and the **in-product support-bundle download** (`/admin/support` page in the operator UI, gated on `ExecuteAuthority`). Items **36** and **37** in `PENDING_QUESTIONS.md` are now **partially resolved** ï¿½ only the customer-facing copy (item 36 brand voice) and the support-bundle redaction policy (item 37 redaction rules) remain owner-controlled. **No source code changes** ï¿½ all moves are documentation + one CI script + one CLI string. ADR 0030 PR A3 and A4 remain explicitly **deferred** until the demo-seed / replay rewrite is scheduled in a separate session.

---

## 2026-04-23 ï¿½ SaaS-framing reconciliation (no customer ever installs Docker / SQL / Terraform)

**Outcome.** Owner clarification ï¿½ *"the user will never have to install Docker or SQL because this is a SaaS product"* ï¿½ applied to docs and plans without rewriting toolchain content. **Assessment ï¿½0.1 addendum** added to [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) re-rates **ï¿½1.2 Adoption Friction** (Docker-only `FIRST_30_MINUTES.md` is contributor tooling, **not** evaluator path ? friction closer to **50/100**, raises **Improvement 2** priority above Improvement 1), **ï¿½1.27 Azure / SaaS Deployment Readiness** (`apply-saas.ps1` is **internal ArchLucid operator** path ï¿½ not a "buyer onboarding path"), and **ï¿½1.30 Customer Self-Sufficiency** (re-defined as **in-product self-service**, closer to **60/100** until support-bundle download is exposed in UI). [`docs/archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md) gains a **SaaS audience guard** at the top forbidding any prompt from instructing the assistant to write customer-facing copy that asks the customer to install Docker, .NET, Node, Terraform, or run any local CLI. [`START_HERE.md`](START_HERE.md) gains an explicit **Audience split** ï¿½ buyers / evaluators / sponsors take a **website-only** path (`EXECUTIVE_SPONSOR_BRIEF.md` ? `ARCHITECTURE_ON_ONE_PAGE.md` ? `archlucid.net/signup`) while the five-document spine is now labelled **contributor / internal-engineer**. Audience banners added to [`FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md) and [`INSTALL_ORDER.md`](INSTALL_ORDER.md) so a buyer who URL-jumps in is routed back to `START_HERE.md`. **Pending questions:** new items **36** (buyer-facing first-30-minutes doc ï¿½ owner copy approval) and **37** (in-product support-bundle download) appended to [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md). **No code changes.** Internal contributor / operator runbooks (`apply-saas.ps1`, `REFERENCE_SAAS_STACK_ORDER.md`, devcontainer, demo-seed) keep their full Docker / SQL / Terraform content unchanged ï¿½ the SaaS framing only forbids those tools from appearing on the **buyer's** path, never inside the build / deploy pipeline.

---

## 2026-04-23 ï¿½ Documentation surface compression (buyer spine + `docs/library/` + root cap)

**Outcome.** Canonical buyer / evaluator entry is **[`docs/START_HERE.md`](START_HERE.md)** (five-document spine table + journey + pointers). Most former `docs/*.md` root pages moved to **[`docs/library/`](library/)** with markdown links rewritten; superseded **Cursor / quality** packs (except the latest **68.60** pair) moved under **[`docs/archive/quality/2026-04-23-doc-depth-reorg/`](archive/quality/2026-04-23-doc-depth-reorg/)** with archive banners. **Thin stubs** remain at [`FIRST_5_DOCS.md`](FIRST_5_DOCS.md), [`FIRST_FIVE_DOCS.md`](FIRST_FIVE_DOCS.md), [`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md), [`FIRST_RUN_WALKTHROUGH.md`](FIRST_RUN_WALKTHROUGH.md) (full wizard + checklist bodies live under `docs/library/`). **Phase-3 receipt stubs:** [`docs/evidence/phase3/gate-verification.md`](evidence/phase3/gate-verification.md) and [`docs/evidence/phase3/pr-a2-cohort-parity.md`](evidence/phase3/pr-a2-cohort-parity.md) ? live gate narrative in [`COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md#phase-3-gate-status) (former archive series deleted). **Inventory:** [`REPO_DIGEST.md`](library/REPO_DIGEST.md) for orientation; run `python scripts/generate_doc_inventory.py` for a full `docs/**/*.md` table (excluding `docs/archive/`). **CI:** [`scripts/ci/assert_docs_root_size.py`](../scripts/ci/assert_docs_root_size.py) (=30 `docs/*.md`) + [`scripts/ci/check_md_links.py`](../scripts/ci/check_md_links.py) alias of `check_doc_links.py`; [`doc-markdown-links`](../.github/workflows/ci.yml) now depends on **`docs-root-size`**. **README:** opener collapsed to try-path + three anchor links + deeper-index pointer; legacy body unchanged inside `<details>`. **Migration script (audit / replay):** [`scripts/migrate_docs_root_to_library.py`](../scripts/migrate_docs_root_to_library.py).

---

## 2026-04-23 ï¿½ ADR 0030 PR A2: `RunCommitPathSelector` + authority manifest version reads + known-empty CI guard

**Outcome.** **`Coordinator:LegacyRunCommitPath`** (`LegacyRunCommitPathOptions`) selects **`ArchitectureRunCommitOrchestrator`** vs **`AuthorityDrivenArchitectureRunCommitOrchestrator`** through **`RunCommitPathSelector`** as `IArchitectureRunCommitOrchestrator`; shipped default remains **`false`** in [`ArchLucid.Api/appsettings.json`](../ArchLucid.Api/appsettings.json). **`IGoldenManifestRepository.GetByContractManifestVersionAsync`** (SQL + in-memory + caching decorator) resolves authority rows by `MetadataJson` **Version** within scope; **`UnifiedGoldenManifestReader`** prefers authority-by-version (and injects **`IScopeContextProvider`** for **`GetByVersionAsync`**) before the legacy JSON table. **CI:** [`scripts/ci/assert_authority_projection_known_empty.py`](../scripts/ci/assert_authority_projection_known_empty.py) + unittest + [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) step. **Tests:** composition + dual-pipeline registration expectations updated; golden-manifest contract test for version lookup. **Deferred (separate change set):** ADR 0030 **PR A3** (remove coordinator repos / flip dual-pipeline discipline) and **PR A4** (`dbo.GoldenManifestVersions` hard drop) ï¿½ blocked on migrating **trusted-baseline demo seed** and **replay** off coordinator-only inserts because `dbo.GoldenManifests` enforces FK chains to snapshots and traces.

---

## 2026-04-22 ï¿½ Composed `useNavSurface()` hook collapses the four UI shaping surfaces into one route-scoped call (assessment improvement 7)

**Outcome.** New [`archlucid-ui/src/lib/use-nav-surface.ts`](../archlucid-ui/src/lib/use-nav-surface.ts) (+ [`use-nav-surface.test.ts`](../archlucid-ui/src/lib/use-nav-surface.test.ts)) exposes a single hook **`useNavSurface(routeKey)`** returning `{ links, mutationCapability, layerGuidance, contextHints, callerAuthorityRank, showExtended, showAdvanced, mounted }` for the current operator route. The four underlying surfaces (`nav-shell-visibility.ts`, `enterprise-mutation-capability.ts`, `layer-guidance.ts`, `EnterpriseControlsContextHints.tsx`) stay live as the implementation detail and remain individually exported ï¿½ no consumer of the per-surface hooks is broken. **Migrations:** [`LayerHeader.tsx`](../archlucid-ui/src/components/LayerHeader.tsx), [`policy-packs/page.tsx`](../archlucid-ui/src/app/(operator)/policy-packs/page.tsx), [`alerts/page.tsx`](../archlucid-ui/src/app/(operator)/alerts/page.tsx), and [`governance/dashboard/page.tsx`](../archlucid-ui/src/app/(operator)/governance/dashboard/page.tsx) now resolve their `mutationCapability` and (for `LayerHeader`) rank cue through `useNavSurface(...)` instead of calling each surface directly. **Tests:** new equivalence test asserts the composed surface produces identical `links`, `mutationCapability`, `layerGuidance`, and rank-cue strings to the four underlying surfaces called directly across every rank ï¿½ tier combination. Existing seam regression tests (`authority-seam-regression`, `authority-execute-floor-regression`, `authority-shaped-ui-regression`, `authority-shaped-layout-regression`, `nav-config.structure`, `LayerHeader`, `EnterpriseControlsContextHints.authority`, `enterprise-authority-ui-shaping`) all stay green; the two page-level mutation suites grew a `useNavSurface` mock so the existing `mutateCapability.current` ref still drives every migrated page. **Docs:** [`docs/PRODUCT_PACKAGING.md`](library/PRODUCT_PACKAGING.md) ï¿½3 *Four UI shaping surfaces* gains a new "Composed surface (preferred ï¿½ `useNavSurface`)" subsection. **Drive-by fix:** removed a pre-existing duplicate `TenantCostEstimateResponse` import in [`archlucid-ui/src/lib/api.ts`](../archlucid-ui/src/lib/api.ts) that was blocking the affected vitest suites from running.

---

## 2026-04-22 ï¿½ Baseline mutation audit durable-echo tests + audit-coverage matrix updated to 105 Core constants (assessment improvement 5)

**Outcome.** [`docs/AUDIT_COVERAGE_MATRIX.md`](library/AUDIT_COVERAGE_MATRIX.md) now records **0 open gaps**: the previously-flagged baseline-only flows (governance approve/decline/finalize, run create/cancel) are confirmed to dual-write to `IAuditService.LogAsync` alongside `IBaselineMutationAuditService.RecordAsync`. **CI anchor** moved from `audit-core-const-count:104` to `:105`, with the new `LlmTenantDailyBudgetApproaching` constant (raised by `LlmDailyTenantBudgetTracker`) added to the **Operations ? durable audit** table and the appendix registry. **Unit coverage:** [`BaselineMutationAuditServiceArchitectureDurableEchoTests`](../ArchLucid.Application.Tests/Audit/BaselineMutationAuditServiceArchitectureDurableEchoTests.cs) asserts `BaselineMutationAuditService.RecordAsync` emits the paired `IAuditService.LogAsync` events for architecture baseline lifecycle paths (run created/started/execute/completed/failed, plus resilience when `LogAsync` throws). **No production code change** ï¿½ this is a documentation correction + test reinforcement tied to the matrix.

---

## 2026-04-22 ï¿½ Trust Center "Recent assurance activity" section + public `/security-trust` marketing page (assessment improvement 6)

**Outcome.** [`docs/go-to-market/trust-center.md`](go-to-market/trust-center.md) gains a **Recent assurance activity** table (engagement metadata only ï¿½ vendor, scope, completed UTC, summary access) covering the **2026-Q2 Aeronova pen test (NDA-only summary)**, **internal owner security self-assessment**, **accessibility self-attestation 2026-04-22**, and **quarterly staging chaos calendar (2026-04-29 / 2026-07-29 / 2026-10-28; production chaos out-of-scope per item 34)**. Mirrored in new public marketing route **`/security-trust`** via [`archlucid-ui/src/lib/security-trust-content.ts`](../archlucid-ui/src/lib/security-trust-content.ts) + [`archlucid-ui/src/components/marketing/MarketingSecurityTrustView.tsx`](../archlucid-ui/src/components/marketing/MarketingSecurityTrustView.tsx) + [`archlucid-ui/src/app/(marketing)/security-trust/page.tsx`](../archlucid-ui/src/app/(marketing)/security-trust/page.tsx). **Tests:** [`MarketingSecurityTrustView.test.tsx`](../archlucid-ui/src/components/marketing/MarketingSecurityTrustView.test.tsx) asserts all four rows render, no redacted/customer-name leakage, NDA notice present, chaos row flagged as production-out-of-scope. **Procurement pack:** regenerated via `scripts/build_procurement_pack.py` so [`dist/procurement-pack/trust-center.md`](../dist/procurement-pack/trust-center.md) and [`dist/procurement-pack.zip`](../dist/procurement-pack.zip) reflect the new section. **Cross-link:** [`docs/security/pen-test-summaries/README.md`](security/pen-test-summaries/README.md) "Related" line now describes the public table. **Owner gate:** wording for the chaos row is intentionally conservative ("Calendar published 2026-04-22; first run 2026-04-29 staging") ï¿½ replace with completed-run wording after the first run lands its closing report.

---

## 2026-04-22 ï¿½ Assessment batch: audit Cosmos parity, public showcase API + marketing page, commercial tier guards, SaaS probe workflow, golden-cohort MTD ledger, tenant cost estimate

**Outcome.** **Audit:** Cosmos `IAuditRepository` filtered queries now match SQL keyset semantics (`BeforeEventId` + `ORDER BY occurredUtc, eventId`). **Showcase:** `IPublicShowcaseCommitPageClient`, `GET /v1/marketing/showcase/{runKey}` (GUID / `N` / `contoso-baseline` slugs), shared `DemoCommitPagePreviewMapper`, Next.js `(marketing)/showcase/[runId]`, Playwright `live-api-marketing-showcase.spec.ts`. **Commercial packaging:** `[RequiresCommercialTenantTier(Standard)]` on advisory + compare/replay controllers; `CommercialPackagingMetadataTests`. **Docs:** superseded 2026-04-21 assessment variants moved to `docs/archive/assessments/` with banners; `PENDING_QUESTIONS.md` links updated; `REFERENCE_SAAS_STACK_ORDER.md` documents `ARCHLUCID_STAGING_BASE_URL`. **Ops:** new `.github/workflows/hosted-saas-probe.yml` + README badge; `golden_cohort_budget_probe.py --usage-ledger`, committed `tests/golden-cohort/usage-mtd.json`, nightly job appends + uploads artifact, `GoldenCohortRealLlmGateTests`, CI unittest `test_golden_cohort_usage_ledger`. **Billing UX:** `Billing:UnitRates`, `ITenantCostEstimateService`, `GET /v1/tenant/cost-estimate`, operator **Tenant cost** settings page.

---

## 2026-04-22 ï¿½ README front-door collapse + opener link-density CI guard (improvement 2)

**Outcome.** Root [`README.md`](../REPOSITORY_README.md) now opens with a short try-path, links to [`FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md) and [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md), and folds the prior long-form README into a single **Deeper docs** `<details>` block. [`docs/FIRST_5_DOCS.md`](FIRST_5_DOCS.md) intro tightened. [`docs/CORE_PILOT.md`](CORE_PILOT.md), [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md), and [`docs/V1_SCOPE.md`](library/V1_SCOPE.md) openings simplified with **Related** link blocks; [`docs/V1_SCOPE.md`](library/V1_SCOPE.md) run-lifecycle bullet no longer points at the dual-pipeline navigator. **CI:** new [`scripts/ci/check_readme_density.py`](../scripts/ci/check_readme_density.py) (max **12** markdown inline links above the first `details` HTML block) + [`scripts/ci/test_check_readme_density.py`](../scripts/ci/test_check_readme_density.py) in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). **Cross-links:** deep links that targeted removed README fragments now point at [`API_CONTRACTS.md`](library/API_CONTRACTS.md#security-schemes-swashbuckle), [`CLI_USAGE.md`](library/CLI_USAGE.md#commands), [`OPERATOR_QUICKSTART.md`](library/customer-facing/OPERATOR_QUICKSTART.md#local-api-example), or [`INSTALL_ORDER.md`](INSTALL_ORDER.md) (see `docs/TROUBLESHOOTING.md`, `docs/onboarding/*`, `docs/INSTALL_ORDER.md`, `docs/archive/ONBOARDING_*`).

---

## 2026-04-22 ï¿½ ADR 0031 ï¿½ cross-tenant pattern library drafted in full for owner sign-off (per decision 2026-04-22)

**Outcome.** New [`docs/architecture/adrs/0031-cross-tenant-pattern-library.md`](architecture/adrs/0031-cross-tenant-pattern-library.md) (**Status: Proposed**) records architecture for optional **anonymised industry pattern guidance** (committed-manifest fingerprints, **k = 5**, dedicated service principal + materialised aggregate surface, nightly ETL, **RLS unchanged** on tenant tables). [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item **14** and the **Cross-tenant pattern library** resolved row point at ADR 0031. [`docs/go-to-market/DPA_TEMPLATE.md`](go-to-market/DPA_TEMPLATE.md) gains **Section 10 ï¿½ Cross-tenant patterns opt-in** (Signature renumbered to **Section 11**). [`docs/architecture/adrs/README.md`](architecture/adrs/README.md) lists ADR 0030 / 0031. **`dist/procurement-pack`** / **`dist/procurement-pack.zip`** regenerated via `scripts/build_procurement_pack.py`. **No application code, SQL migrations, controllers, or UI** ï¿½ design-only.

---

## 2026-04-22 ï¿½ PGP key generation recipe scaffolded; owner-self custodian (items 10 / 21)

**Outcome.** Documents the **executable** custodian path for coordinated-disclosure OpenPGP material on **`security@archlucid.net`**: new [`docs/security/PGP_KEY_GENERATION_RECIPE.md`](security/PGP_KEY_GENERATION_RECIPE.md) (Ed25519/ECC preferred, RSA 4096 fallback, interactive and optional batch `gpg` flows, export to `archlucid-ui/public/.well-known/pgp-key.txt`, rotation, revocation, where private material may live). **[`SECURITY.md`](../library/contributor-reference/SECURITY.md)** PGP section points at the recipe and reserves a **Key ID** line for post-publication fingerprint. **[`trust-center.md`](go-to-market/trust-center.md)** Contact adds a one-line cross-reference (publication still **pending**). **CI:** [`scripts/ci/assert_pgp_key_present.py`](../scripts/ci/assert_pgp_key_present.py) now **warn-only** when `pgp-key.txt` is absent (stderr: pending owner publication) and **validates ASCII-armored public key** shape when the file exists; unit tests updated. **Owner gate:** generate the key, commit `pgp-key.txt`, record fingerprint in `SECURITY.md` / recipe table.

---

## 2026-04-22 ï¿½ Public `/accessibility` page + `accessibility@archlucid.net` alias + annual self-attestation cadence (decisions from 2026-04-22 owner Q&A)

**Outcome.** Implements accessibility items **12** and **26** from [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md): public **WCAG 2.1 AA self-attestation** (no formal VPAT) on marketing route **`/accessibility`**, sourced at build time from root [`ACCESSIBILITY.md`](../ACCESSIBILITY.md) via [`archlucid-ui/src/lib/accessibility-marketing-policy.ts`](../archlucid-ui/src/lib/accessibility-marketing-policy.ts) + [`MarketingAccessibilityContentSection`](../archlucid-ui/src/components/marketing/MarketingAccessibilityContentSection.tsx). **Mailbox:** `accessibility@archlucid.net` documented as an alias to the same custodian as `security@` ([`docs/security/ACCESSIBILITY_MAILBOX.md`](security/ACCESSIBILITY_MAILBOX.md)); [`SECURITY.md`](../library/contributor-reference/SECURITY.md), [`trust-center.md`](go-to-market/trust-center.md), and [`archlucid-ui/public/.well-known/security.txt`](../archlucid-ui/public/.well-known/security.txt) list both contacts. **Policy text:** `ACCESSIBILITY.md` gains **Last reviewed: 2026-04-22** and **Review cadence** (annual; next window **2027-04-22**; calendar reminder alongside the quality-assessment cadence). **CI:** [`scripts/ci/assert_marketing_accessibility_in_sync.py`](../scripts/ci/assert_marketing_accessibility_in_sync.py) + `archlucid-ui/scripts/accessibility-marketing-dump-sections.ts` in **`doc-markdown-links`**. **Tests:** Vitest axe on [`AccessibilityMarketingPublicView`](../archlucid-ui/src/components/marketing/AccessibilityMarketingPublicView.tsx); Playwright [`marketing-accessibility-public.spec.ts`](../archlucid-ui/e2e/marketing-accessibility-public.spec.ts). **Docker:** copies `ACCESSIBILITY.md` into `go-to-market-samples/` for standalone builds. **Owner gate:** provision the live alias in the tenant that already hosts `security@`.

---

## 2026-04-22 ï¿½ Trust Center wording fixes (SOC 2 $1M ARR, pen-test NDA-gated only, production chaos production-never)

**Outcome.** Aligns public and operator-facing copy with owner Q&A **2026-04-22** ([`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) items **6**, **20**, **34**) ï¿½ **no** edits to [`docs/security/SOC2_SELF_ASSESSMENT_2026.md`](security/SOC2_SELF_ASSESSMENT_2026.md) or [`docs/security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`](security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md). **[`trust-center.md`](go-to-market/trust-center.md):** SOC 2 row notes cite **~$1M ARR** for Type 1 readiness; pen-test section states **NDA-only** redacted summaries + `security@archlucid.net` and drops the **`SecurityAssessmentPublished`** public-badge narrative. **[`GAME_DAY_CHAOS_QUARTERLY.md`](runbooks/GAME_DAY_CHAOS_QUARTERLY.md):** new ï¿½ **Production stance (2026-04-22)** plus aligned checklist / blast-radius / RACI / workflow bullets (**production never**; ADR to reopen). **[`.github/workflows/simmy-chaos-scheduled.yml`](../.github/workflows/simmy-chaos-scheduled.yml):** YAML comment above the `production` dispatch fail-fast (logic unchanged). **`archlucid-ui` `/security-trust`:** static NDA posture strip + **Badges legend** row **NDA-gated security assessment** (audit publication strip removed).

---

## 2026-04-22 ï¿½ Commerce un-hold scaffolding (statement descriptor + publisher identity + chargeback policy + price list public-cutover note)

**Outcome.** Scaffolds **Q2 2026 commerce un-hold** decisions from [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) *Resolved 2026-04-22 (assessment owner Q&A ï¿½ 16 decisions)* (items **22**, **9**, **8** / **9d**, **13**) for legal review ï¿½ **no live Stripe or Marketplace keys**, no Partner Center IDs committed. **Stripe:** [`docs/runbooks/STRIPE_WEBHOOK_INCIDENT.md`](runbooks/STRIPE_WEBHOOK_INCIDENT.md) gains ï¿½ **Statement descriptor** (`ARCHLUCID PLATFORM` prefix) and replaces implicit 90-day rotation framing with **owner self, quarterly + on-incident** cadence plus `Billing:Stripe:WebhookSigningSecretRotatedUtc` + `CHANGELOG` rotation headings. **Marketplace identity:** new [`docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md`](runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md) (display name **`ArchLucid`**, placeholders `<<MPN_ID>>` / `<<OFFER_ID>>`, footnote on legal entity vs display name, cross-link to `assert_marketplace_pricing_alignment.py`). **Chargeback / refund / dunning:** new ï¿½ **9** in [`ORDER_FORM_TEMPLATE.md`](go-to-market/ORDER_FORM_TEMPLATE.md) and a short **Commercial terms** block in [`trust-center.md`](go-to-market/trust-center.md) ï¿½ both carry **pending legal sign-off** disclaimers. **Public pricing UI:** [`archlucid-ui/src/components/marketing/MarketingPricingPublicCutoverNotice.tsx`](../archlucid-ui/src/components/marketing/MarketingPricingPublicCutoverNotice.tsx) + Vitest snapshot; wired on [`archlucid-ui/src/app/(marketing)/pricing/page.tsx`](../archlucid-ui/src/app/(marketing)/pricing/page.tsx). **Gate:** legal sign-off before commerce un-hold; MPN + Offer ID remain owner-provided.

---

## 2026-04-22 ï¿½ ADR 0030 PR A4 = hard drop; ADR 0029 ï¿½ Lifecycle ï¿½ PR B inline checklist + standalone PHASE_3_PR_B_TODO.md (per decisions 35d / 35e from 2026-04-22 owner Q&A)

**Outcome.** Aligns documentation with owner Q&A items **35d** and **35e**: [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) **PR A4** is now an explicit **hard drop** (no historical `dbo.GoldenManifestVersions` rows preserved; backfill / archival branch removed; ï¿½ Operational considerations marks **PR A4 backfill ï¿½ N/A**; ï¿½ Owner sub-decisions gains row **35d**). [ADR 0029](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Lifecycle gains the authoritative **PR B ï¿½ audit-constant retirement checklist** (inline checkboxes). New working surface [`architecture/PHASE_3_PR_B_TODO.md`](architecture/PHASE_3_PR_B_TODO.md) mirrors that checklist plus a **Working notes** section. **CI:** `scripts/ci/assert_pr_b_tracker_in_sync.py` plus `scripts/ci/tests/test_assert_pr_b_tracker_in_sync.py` in **`ci.yml`** `doc-markdown-links` job ï¿½ script step is **warn-only** (`continue-on-error: true`); strict contradiction mode is opt-in via `ARCHLUCID_PR_B_TRACKER_STRICT=1`. **Docs:** [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) resolution rows for **35d** / **35e** point at the ADR + tracker paths above. **No application code touched.**

---

## 2026-04-22 ï¿½ Procurement pack v2: canonical ZIP manifest + CLI + CI dry-run guard

**Outcome.** Hardens the **buyer procurement ZIP** so one command assembles a **reviewer-aligned** document set. **Canonical list** lives in `scripts/procurement_pack_canonical.json` (includes `SECURITY.md`, `trust-center.md`, `DATA_SUBPROCESSORS.md` ? sourced from `SUBPROCESSORS.md`, `DPA_TEMPLATE.md`, `INTEGRATION_CATALOG.md`, `AUDIT_COVERAGE_MATRIX.md`, `MULTI_TENANT_RLS.md`, `ACCESSIBILITY.md`, `SECURITY.txt` from `archlucid-ui/public/.well-known/security.txt`, owner assessment excerpt, **pen-test placeholder** (*pending Q2 2026 third-party engagement*), **SOC 2 deferred** statement, `API_CONTRACTS.md`, `INTEGRATION_EVENTS_AND_WEBHOOKS.md`, `CUSTOMER_TRUST_AND_ACCESS.md`, `V1_SCOPE.md`, `README.md`, `BREAKING_CHANGES.md`, `PROCUREMENT_PACK_COVER.md`). **Build:** `scripts/build_procurement_pack.py` (invoked by refreshed `.sh` / `.ps1`) writes **`manifest.json`** (path, source, **bytes**, **SHA-256**), **`versions.txt`** (git SHA, UTC build time, CLI **1.0.0** from `ArchLucid.Cli.csproj`), **`redaction_report.md`** (explicit omissions, e.g. CAIQ/SIG/SLA excerpt). **Missing canonical source = exit 1** (fail loud). **CLI:** `archlucid procurement-pack [--out <zip>] [--dry-run]`. **CI:** `scripts/ci/assert_procurement_pack_buildable.py` in **`ci.yml`** `doc-markdown-links` job. **Docs:** `trust-center.md` ï¿½ *Get the procurement pack*, `HOW_TO_REQUEST_PROCUREMENT_PACK.md`, `PROCUREMENT_PACK_COVER.md` scaffold (no deal-specific names in repo).

---

## 2026-04-22 ï¿½ Golden cohort Simulator baseline lock (item 33) + CI regression guard

**Outcome.** Ships the **owner-approved** Simulator-only baseline for `tests/golden-cohort/cohort.json`: all **20** rows carry real **SHA-256** fingerprints from `archlucid golden-cohort lock-baseline --write` against a Simulator API host. **Lock date (UTC):** 2026-04-22. **Repository tree SHA at Simulator lock capture:** `eda94855c62d5a1a91fd189bf2e4b8b4d0546397` (same value recorded in `tests/golden-cohort/README.md`). **`FakeScenarioFactory`** now uses **SHA-256ï¿½derived stable hex ids** plus a **fixed synthetic `CreatedUtc`** so Simulator agent payloads are repeatable (supports drift + `GoldenCohortSimulatorDeterminismTests`). **Nightly:** `.github/workflows/golden-cohort-nightly.yml` runs **contract** every night and **simulator drift** when repository variable **`ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED`** is **`true`** (owner sets this in GitHub Actions variables after merge). **CI:** `scripts/ci/assert_golden_cohort_baseline_locked.py` + `scripts/ci/test_assert_golden_cohort_baseline_locked.py` fail merge when the locked flag is on and any row still uses the **64-zero** placeholder. **Tests:** `ArchLucid.AgentRuntime.Tests/GoldenCohort/GoldenCohortSimulatorDeterminismTests.cs` asserts **N=10** identical Simulator JSON per cohort row. **Docs:** `tests/golden-cohort/README.md` records the lock run and tree SHA at capture. **Not in scope:** `ARCHLUCID_GOLDEN_COHORT_REAL_LLM`, Azure OpenAI provisioning, and the disabled `cohort-real-llm-gate` job (items **15** / **25**).

---

## 2026-04-22 ï¿½ Assessment owner Q&A (16 decisions; PENDING_QUESTIONS snapshot only)

**Outcome.** Records the owner answers to a structured Q&A round driven by the latest independent quality assessment. **No production code touched** ï¿½ this is a decision snapshot for downstream implementation PRs to pull from. **Items closed:** **6** (SOC 2 revisit ARR = **$1M** band), **9** (Stripe statement descriptor = **`ARCHLUCID PLATFORM`**, chargeback/refund/dunning text = assistant scaffolds for legal sign-off, webhook secret rotation = owner self / quarterly + on-incident), **8** (Marketplace publisher display name = **`ArchLucid`**; MPN ID and Offer ID = owner-to-provide-later), **22** (un-hold = **single-window cutover** in **Q2 2026**), **12** (publication = **public `/accessibility` page**, mailbox = **`accessibility@archlucid.net`** routed to the same custodian as `security@`), **26** (**self-attestation only**, **annual** "Last reviewed" cadence), **13** (public price list = **publish with Marketplace go-live**), **34** (production Simmy = **never** for v1), **10 / 21** (PGP custodian = **owner self**; assistant scaffolds the gpg recipe doc now), **19** (first PLG row owner = **owner solo**), **20** (pen-test summary publication = **NDA-gated only**), **14** (cross-tenant pattern library implementing ADR = **assistant drafts in full**), **15 / 25** (golden-cohort real-LLM monthly token budget = **$50/month** ceiling with kill-switch), **35d** (`dbo.GoldenManifestVersions` drop = **(i) hard drop**, pre-release waiver-aligned), **35e** (PR B tracker = **both** standalone `PHASE_3_PR_B_TODO.md` **and** ADR 0029 ï¿½ Lifecycle inline checklist). **Items still open:** **28** (soft-required `baselineReviewCycleHours` at signup ï¿½ owner deferred). **Implication for sequencing:** the **Q2 2026** commerce calendar puts a hard external deadline on **PR A2 + PR A3** (Authority pipeline unification) ï¿½ both must merge well before the first paying customer. **Docs:** [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) ï¿½ new *Resolved 2026-04-22 (assessment owner Q&A ï¿½ 16 decisions)* table at the top, with sub-tables per topic.

---

## 2026-04-22 ï¿½ Quarterly staging chaos game day calendar + Simmy cron (2026-04-29, 2026-07-29, 2026-10-28)

**Outcome.** Turns documented chaos capability into a **recurring staging** practice: [`docs/quality/game-day-log/README.md`](quality/game-day-log/README.md) lists **2026-04-29** (first scenario: SQL pool exhaustion under trial-signup load), **2026-07-29**, and **2026-10-28** with RTO/RPO pointers and closing-report links. **Closing scaffold:** [`docs/quality/game-day-log/2026-04-29-staging-sql-pool-exhaustion.md`](quality/game-day-log/2026-04-29-staging-sql-pool-exhaustion.md). **Workflow:** [`.github/workflows/simmy-chaos-scheduled.yml`](../.github/workflows/simmy-chaos-scheduled.yml) uses **three annual crons** at **14:00 UTC** (Apr **29**, Jul **29**, Oct **28**) and echoes closing-report paths + run URL in the job summary; `workflow_dispatch` **`production`** string must stay **empty** or the job fails ([`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) item **34**). **CI:** `scripts/ci/assert_game_day_log_recent.py` (**warn-only** until after the second logged close-out) + `scripts/ci/test_assert_game_day_log_recent.py`. **Cross-links:** [`docs/V1_RELEASE_CHECKLIST.md`](library/V1_RELEASE_CHECKLIST.md) ï¿½8, [`docs/CHAOS_TESTING.md`](library/CHAOS_TESTING.md), [`docs/runbooks/GAME_DAY_CHAOS_QUARTERLY.md`](runbooks/GAME_DAY_CHAOS_QUARTERLY.md).

---

## 2026-04-22 ï¿½ Five-document onboarding spine (README Day-1 + doc signposts + CI line budget)

**Outcome.** Collapses default contributor/operator onboarding to **five** spine documents (`INSTALL_ORDER`, `FIRST_30_MINUTES`, `CORE_PILOT`, `ARCHITECTURE_ON_ONE_PAGE`, `PENDING_QUESTIONS`) catalogued in [`docs/FIRST_5_DOCS.md`](FIRST_5_DOCS.md). **README** persona table links **only** spine targets (sponsor narrative remains `docs/EXECUTIVE_SPONSOR_BRIEF.md` as plain path in-cell). **Non-spine** active `docs/**/*.md` files (excluding `docs/archive/`) gain a top-of-file `Spine doc` blockquote via `scripts/ci/backfill_doc_spine_signpost.py --apply` (`EXECUTIVE_SPONSOR_BRIEF.md` excluded ï¿½ owner canonical narrative). **Alias:** [`docs/FIRST_FIVE_DOCS.md`](FIRST_FIVE_DOCS.md) stub; historical table archived at [`docs/archive/FIRST_FIVE_DOCS_SUPERSEDED_2026_04_22.md`](archive/FIRST_FIVE_DOCS_SUPERSEDED_2026_04_22.md). **CI:** `scripts/ci/check_onboarding_spine_line_budget.py` (**600** lines ï¿½ five spine files). **`docs/START_HERE.md`** rewritten as spine-first redirect.

---

## 2026-04-22 ï¿½ Synthetic aggregate ROI bulletin sample (marketing + CLI + CI guards)

**Outcome.** Ships a **public** synthetic aggregate baseline bulletin so buyers can see artefact shape before **N = 5** qualifying tenants exist, without using the real **CHANGELOG** sign-off heading (`## YYYY-MM-DD ï¿½ ROI bulletin signed: ï¿½`). **Docs:** [`docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md`](go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md) (combined Scope + forbidden-publish first line), [`docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`](go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md) owner-gate table row. **CLI:** `archlucid roi-bulletin --quarter <Q-YYYY> --synthetic [--explain] [--out file.md]` (no API; constants on `SyntheticAggregateRoiBulletinSample`). **UI:** marketing route `/example-roi-bulletin` renders the checked-in Markdown and links same-origin to **`/api/proxy/v1/admin/roi-bulletin-preview?ï¿½&minTenants=5`** (real draft gate). **CI:** `scripts/ci/check_synthetic_roi_bulletin_sample.py`. **Docker:** copies the sample into `go-to-market-samples/` for SSR. **Core:** `SyntheticAggregateRoiBulletinSample`.

---

## 2026-04-22 ï¿½ PR A2: Authority run-commit persistence + unified reads; `LegacyRunCommitPath` default `false` (code + docs)

**Outcome.** Completes the mechanical follow-on from the same-day **PR A0 + A0.5 + A1** entry: `AuthorityDrivenArchitectureRunCommitOrchestrator` now persists golden manifests through the PR A1 **`IGoldenManifestRepository.SaveAsync(Contracts.Manifest.GoldenManifest, ï¿½)`** overload with an optional **`authorityPersistBody`** argument (`ContractGoldenManifestPersistence` resolver in `ArchLucid.Decisioning`) so the full authority `Decisioning.Models.GoldenManifest` JSON slices are written while the contract path still supplies idempotency keying + `IManifestHashService`. `UnifiedGoldenManifestReader` + `RunDetailQueryService` read authority rows when `GoldenManifestId` / `DecisionTraceId` are populated so operator read models stay coherent when the default commit path is authority. **Product default:** [`ArchLucid.Api/appsettings.json`](../ArchLucid.Api/appsettings.json) `Coordinator:LegacyRunCommitPath` ? **`false`** per owner Q35c.2; **`OpenApiContractWebAppFactory`** keeps an explicit in-memory override **`true`** for OpenAPI/registration tests that do not seed authority snapshot ids. **Evidence:** [`evidence/phase3/pr-a2-cohort-parity.md`](evidence/phase3/pr-a2-cohort-parity.md) (`ArchitectureRunCommitPathParityIntegrationTests` traceability ZIP + stable `PilotRunDeltasResponse` fields; `ServiceCollectionExtensionsCompositionResolveTests` resolves `IArchitectureRunCommitOrchestrator` ? `RunCommitPathSelector`); runbook gate table update in [`docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md).

---

## 2026-04-22 ï¿½ PR A0 + A0.5 + A1: Authority ? Contracts projection, contracts write port, graph Properties typification (code); 35c + 35f owner decisions (docs)

**Outcome.** Owner accepted all three recommendations: **35f = (i)** graph `Properties` keys for `serviceType` / `runtimePlatform` / `datastoreType`; **35c.1 = (ii)** global `Coordinator:LegacyRunCommitPath` flag; **35c.2 = (B)** long-term default `false` with **interim** `true` in [`ArchLucid.Api/appsettings.json`](../ArchLucid.Api/appsettings.json) until `RunCommitPathSelector` + `AuthorityDrivenArchitectureRunCommitOrchestrator` land in a follow-on PR. **Code shipped in this change set:** `IAuthorityCommitProjectionBuilder` + `AuthorityCommitProjectionBuilder`; `IGoldenManifestRepository.SaveAsync(Contracts.Manifest.GoldenManifest, ï¿½)` returning `Task<Decisioning.Models.GoldenManifest>` with `ContractGoldenManifestMapper` + hash via caller-supplied `IManifestHashService` (SQL + in-memory + caching decorator); `TopologySection` extended with coordinator-shaped `Services` / `Datastores` lists persisted in existing `TopologyJson`; `DefaultGoldenManifestBuilder` populates those lists from `TopologyResource` graph nodes (category `data` / `storage` ? datastore; `serviceType` / `runtimePlatform` from `Properties`); `Unknown = 0` added to `ServiceType`, `RuntimePlatform`, and `DatastoreType` enums. **Configuration surface:** `LegacyRunCommitPathOptions` (`ArchLucid.Core`) + `services.Configure<ï¿½>(ï¿½)` in host composition. **Not in this change set (explicit follow-on):** facade routing to an authority commit orchestrator, `RunCommitPathSelector`, Python `assert_authority_projection_known_empty.py` (JSON allow-list file is present for humans + future CI), and cohort parity doc for PR A2.

**Docs:** [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) ï¿½ new *Resolved 2026-04-22 (35c + 35f ï¿½ ADR 0030)* table; item 35 sub-bullets c + f updated.

---

## 2026-04-22 ï¿½ ADR 0030 self-amendment: 35a + 35b owner sub-decisions resolved, PR A0.5 row added, 34?35 numbering corrected (docs only)

**Outcome.** A walk-through of [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) sub-bullets **35a** (PR A0 ï¿½ Authority engine projection shape) and **35b** (PR A1 ï¿½ `IGoldenManifestRepository` overload return shape) produced six owner sub-decisions. The recommended answer set was accepted in full on 35a; on 35b the owner expanded the original `Task` vs `Task<Guid>` framing to a third option (`Task<Decisioning.Models.GoldenManifest>`) and chose it. **PR A0 and PR A1 drafting are now unblocked.** A new sub-PR (**PR A0.5 ï¿½ Authority typed services + datastores**) was introduced as a consequence of decision 35a.2 = `empty-with-guard`. A new pending sub-bullet (**35f** ï¿½ typed-services source for PR A0.5) was opened. **No production code touched** ï¿½ docs and ADR amendment only.

**Numbering correction.** The original 2026-04-21 draft of ADR 0030 (and the corresponding CHANGELOG entry below) cross-referenced the per-sub-PR owner decisions as "pending question item **34aï¿½d**". The actual numbering in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) is **item 35aï¿½e** (item 34 is "Production Simmy / fault-injection game day"). The 2026-04-22 ADR self-amendment corrects every internal reference from 34?35 throughout ADR 0030; the historical 2026-04-21 CHANGELOG entry below is **not** rewritten (it remains an audit record of the original framing) but is implicitly superseded by this entry on the numbering point.

**Owner sub-decisions (recorded in three places ï¿½ `PENDING_QUESTIONS.md` ï¿½ Resolved 2026-04-22, ADR 0030 ï¿½ Owner sub-decisions, and the PR A0 / PR A1 rows of ADR 0030 ï¿½ Component breakdown):**

| Item | Question | Owner answer |
|------|----------|--------------|
| **35a (top-level)** | Projection lives in the Authority engine (opt-in flag) or in a new mapper class consumed by the facade? | **(ii) new mapper class** ï¿½ `AuthorityCommitProjectionBuilder` |
| **35a.1** | `SystemName` source on the projected manifest | **`sibling-row`** ï¿½ read from existing `Run` / `ArchitectureRequest` row via `IRunRepository` |
| **35a.2** | Typed `Services` + `Datastores` ï¿½ populate from rule-engine resource strings, or leave empty? | **`empty-with-guard`** ï¿½ empty in PR A0; populated in new **PR A0.5** when Authority grows typed services |
| **35a.3** | `Relationships` ï¿½ populate from graph snapshot in PR A0, or leave empty? | **`empty-with-guard`** ï¿½ empty in PR A0; populated in a future Relationships-graph PR (scope deferred until PR A2 planning) |
| **35a.4** | Adopt the JSON allow-list + CI guard mechanism for "intentionally empty" projection fields? | **`yes`** ï¿½ new file `docs/architecture/AUTHORITY_PROJECTION_KNOWN_EMPTY.json` + new CI script + workflow step (ships with PR A0; self-eroding as PR A0.5 + the future Relationships PR merge) |
| **35b** | Write-overload return type on `IGoldenManifestRepository.SaveAsync(Contracts.Manifest.GoldenManifest, ...)` | **`Task<Decisioning.Models.GoldenManifest>`** ï¿½ return the produced Authority-shape manifest so the caller keeps idempotency-key reasoning |

**ADR 0030 amendments (in the same edit):**

- Front matter gains a `Self-amended 2026-04-22` line summarizing the six changes below.
- ï¿½ Component breakdown gains a **PR A0.5 ï¿½ Authority typed services + datastores** row between PR A0 and PR A1 (consequence of 35a.2).
- ï¿½ Component breakdown's **PR A0** and **PR A1** rows are rewritten to record the resolved decisions inline (so the next contributor reading the row sees both the design and the owner sign-off).
- ï¿½ Operational considerations gains a new **Known-empty allow-list mechanism** subsection that defines the JSON schema, the CI script's two assertions (builder vs allow-list, allow-list vs ADR), and the self-erosion lifecycle (consequence of 35a.4).
- ï¿½ Owner sub-decisions section is added (canonical answer block for 35a + 35b).
- ï¿½ Lifecycle gains a **PR A0.5 merges** row.
- ï¿½ Related gains a row pointing at `docs/architecture/AUTHORITY_PROJECTION_KNOWN_EMPTY.json` (created when PR A0 merges).
- Every internal cross-reference to "item 34" / "34aï¿½d" is corrected to "item 35" / "35aï¿½e".

**`PENDING_QUESTIONS.md` amendments (in the same edit):**

- New top-level table **Resolved 2026-04-22 (ADR 0030 owner sub-decisions ï¿½ 35a + 35b)** captures the six decisions above and links to ADR 0030 ï¿½ Owner sub-decisions.
- Existing item **35** sub-bullets **a** + **b** are rewritten as **(Resolved 2026-04-22 ï¿½ see table above)** with the chosen options inlined.
- Existing item **35** sub-bullet **c** is expanded into two coupled sub-questions (c.1 flag scope per-tenant vs global, c.2 default by environment) to make the still-open shape explicit.
- New item **35** sub-bullet **f** opened: PR A0.5 typed-services source for `ManifestService.ServiceType` / `RuntimePlatform`. Three options listed (extend rule-engine metadata, separate classifier service, operator design-time tagging). PR A0 + PR A1 are **not** blocked on 35f; PR A0.5 is.
- `Last updated` line bumped to 2026-04-22 with a brief delta summary; prior 2026-04-21 entry preserved as `Prior:`.

**What ships next session, given these decisions:**

- **PR A0** can now be drafted end-to-end: `IAuthorityCommitProjectionBuilder` interface + `AuthorityCommitProjectionBuilder` concrete (with `IRunRepository` dependency for `SystemName`); `docs/architecture/AUTHORITY_PROJECTION_KNOWN_EMPTY.json` with three initial rows; `scripts/ci/assert_authority_projection_known_empty.py` + mirrored test; `.github/workflows/ci.yml` workflow step; new unit tests under `ArchLucid.Decisioning.Tests` covering shape parity + the allow-list invariants. Recommended as a **dedicated session** ï¿½ large surgical change set.
- **PR A1** can also be drafted in a dedicated session (the overload signature is now pinned).
- **PR A0.5** is **still blocked on item 35f** (typed-services source).
- **PR A2** is **still blocked on item 35c** (legacy-flag scope + default).
- **PR A4** is **still blocked on item 35d** (backfill destination).

**Atomic surface area for this entry (docs only ï¿½ no production code touched):**

- [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ self-amended (six changes listed above).
- [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) ï¿½ Resolved 2026-04-22 table added; item 35 sub-bullets a, b, c, f rewritten / opened.
- [`docs/CHANGELOG.md`](CHANGELOG.md) ï¿½ this entry.

---

## 2026-04-21 ï¿½ Phase 3 PR A re-scoped: ADR 0030 ï¿½ Coordinator ? Authority pipeline unification (sequenced multi-PR plan)

**A grounding read of the actual code state ï¿½ not just the optimistic ADR text ï¿½ found a hard blocker that makes the original "single PR A deletion" framing in [ADR 0021](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Phase 3 mechanism (a) mechanically impossible. The work is re-scoped into a sequenced multi-PR plan recorded in new [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md). No production code changes in this entry ï¿½ owner sign-off required to start any of PR A0 ? PR A4.**

**The blocker.** Side-by-side reads of `ArchLucid.Persistence/Data/Repositories/GoldenManifestRepository.cs` (Coordinator) vs `ArchLucid.Persistence/Repositories/SqlGoldenManifestRepository.cs` (Authority), plus `ArchLucid.Contracts/Manifest/GoldenManifest.cs` vs `ArchLucid.Decisioning/Models/GoldenManifest.cs`, plus the master DDL `ArchLucid.Persistence/Scripts/ArchLucid.sql` (lines 105 + 987), show the two pipelines persist **incompatible domain models** to **incompatible SQL tables** using **different decision engines**:

- **Manifest CLR types diverge.** Coordinator side uses `ArchLucid.Contracts.Manifest.GoldenManifest` (string `RunId`; services + datastores + relationships + governance + metadata). Authority side uses `ArchLucid.Decisioning.Models.GoldenManifest` (Guid `ManifestId` + Guid scope triple; Topology / Security / Compliance / Cost / Constraints / UnresolvedIssues / Decisions / Provenance / Policy section objects).
- **SQL tables diverge.** Coordinator persists to `dbo.GoldenManifestVersions` (single JSON blob keyed by string `ManifestVersion`). Authority persists to `dbo.GoldenManifests` + 6 phase-1 relational satellite tables (`GoldenManifestAssumptions`, `GoldenManifestWarnings`, `GoldenManifestProvenanceSourceFindings`, `GoldenManifestProvenanceSourceGraphNodes`, `GoldenManifestProvenanceAppliedRules`, `GoldenManifestDecisions` + `ï¿½DecisionEvidenceLinks` + `ï¿½DecisionNodeLinks`) keyed by Guid `ManifestId` + scope triple.
- **Decision engines diverge.** Coordinator uses `IDecisionEngineService.MergeResults` + `IDecisionEngineV2.ResolveAsync`. Authority uses a one-shot rule-engine path that does not today produce a `Contracts.Manifest`-shape output.
- **`RunCommitOrchestratorFacade` is a 12-line thin pass-through** to `ArchitectureRunCommitOrchestrator`, not a Coordinator-vs-Authority bridge. The introduction note in [ADR 0022](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Component breakdown overstated its role.

**The re-scope ([ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md)).** PR A is now five sub-PRs (each independently mergeable, each verifying gates (ii) + (iii) on its own CI run, each reversible by `git revert` until the next one merges except PR A4 which is the irreversible legacy-table drop):

| Sub-PR | What ships | What is blocked on |
|--------|-----------|-------------------|
| **PR A0** | Authority engine grows `IAuthorityCommitProjectionBuilder.BuildContractsManifestAsync(...)` ï¿½ additive, no SQL change | Owner sign-off on shape parity invariants ï¿½ pending question item **34a** |
| **PR A1** | `IGoldenManifestRepository` grows a `SaveAsync(Contracts.Manifest.GoldenManifest, ...)` overload; `SqlGoldenManifestRepository` learns to map the Contracts shape into `dbo.GoldenManifests` | Pending question item **34b** confirms overload return type |
| **PR A2** | `RunCommitOrchestratorFacade` swaps target to Authority engine + Authority write port behind a `legacy:true` feature flag for rollback | Gates (ii) + (iii) green; cohort-parity SHA evidence captured in `evidence/phase3/pr-a2-cohort-parity.md`; pending question item **34c** for legacy-flag default |
| **PR A3** | Coordinator interfaces + concretes deleted; `DualPipelineRegistrationDisciplineTests` rewritten to assert the opposite invariant; ADR 0022 flips to `Superseded by ADR 0030`; operator pipeline doc collapses to `CANONICAL_PIPELINE.md` (navigator archived) | Same gates (ii) + (iii) on PR A3's own CI run |
| **PR A4** | New SQL migration drops `dbo.GoldenManifestVersions`; backfill exports historical rows to blob storage first | Owner sign-off **at merge time** on backfill destination + no-rollback acknowledgement ï¿½ pending question item **34d** |

(Phase 3 **PR B ï¿½ audit-constant retirement** as described in [ADR 0029](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Lifecycle is unchanged: it ships **on or after 2026-05-15** and removes `AuditEventTypes.CoordinatorRun*`. The 2026-05-15 calendar deadline now applies to **PR B**, not to a single "PR A" ï¿½ see ADR 0029 amendment below.)

**Atomic surface area for this entry (docs only ï¿½ no production code touched):**
- New: [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ full sequenced multi-PR plan with the four constraints (two manifest types, two SQL tables, two decision engines, thin faï¿½ade) made explicit.
- Amended: [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ `Amended by` field + 2026-04-21 update note pointing at ADR 0030.
- Amended: [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ `Amended by` field + revised `IRunCommitOrchestrator` row in ï¿½ Component breakdown (correctly described as a 12-line pass-through, not a Coordinator-vs-Authority bridge) + revised ï¿½ Follow-up steps 3 + 4.
- Amended: [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ `Amended by` field + ï¿½ Lifecycle table strikethrough on the original "PR A" row + reassignment of the 2026-05-15 deadline to PR B.
- Amended: [`docs/archive/dual-pipeline-navigator-superseded.md`](archive/dual-pipeline-navigator-superseded.md) ï¿½ "Why we have not collapsed these" ï¿½ new "Unification plan" paragraph pointing at ADR 0030; documents the single-pipeline collapse trigger (PR A3 merge).
- Amended: [`docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md`](architecture/COORDINATOR_STRANGLER_INVENTORY.md) ï¿½ new 2026-04-21 grounding-read finding callout above ï¿½ Migrate documenting the data-model + SQL-table mismatch table.

**No production code changes.** No SQL migrations. No test changes. The four ADR amendments + two doc updates are the entire change set; the next session is the start of PR A0 once the owner signs off on item **34a** in PENDING_QUESTIONS.

**Sequencing intent.** PR A0 is the smallest first step (additive Authority engine extension; no deletion, no SQL change, no flag flip) and is therefore the right next session whenever the owner answers item **34a**.

---

## 2026-04-21 ï¿½ Teams per-trigger opt-in matrix (Part A) + ArchLucid RLS object-name SQL migration (Part B)

**Bundled DDL change set: the two follow-ups queued in the prior 2026-04-21 entry land together so a single review covers both database schema migrations.**

**Part A ï¿½ Microsoft Teams per-trigger opt-in matrix.** New DbUp migration **`107_TeamsConnectionsEnabledTriggers.sql`** (+ `Rollback/R107_*.sql`) adds `EnabledTriggersJson NVARCHAR(MAX) NOT NULL` to **`dbo.TenantTeamsIncomingWebhookConnections`** with a default of all six canonical triggers and an `ISJSON` check constraint. Master DDL **`ArchLucid.sql`** mirrors the column for greenfield. New canonical catalog **`TeamsNotificationTriggerCatalog`** lists the six events (run completed / run failed / manifest published / manifest published with policy violations / authority alert raised / compliance drift escalated) with subset validation + default-all-on JSON. New `IntegrationEventTypes` constants **`ComplianceDriftEscalatedV1`** and **`SeatReservationReleasedV1`**. Upsert request + response contracts gain `EnabledTriggers` (round-tripped through the Dapper + InMemory repositories). The Teams connections controller validates the subset (`400` on unknown triggers), persists, and audits. The **`/integrations/teams`** UI grew a 6-row checkbox matrix bound to the catalog. Logic Apps **`teams-notification-fanout`** README documents the server-side `EnabledTriggers` filter so Logic Apps senders honor the per-tenant opt-in. Tests cover round-trip persistence, invalid-trigger 400, and the all-on default for legacy rows.

**Part B ï¿½ ArchLucid RLS object-name rename (atomic cutover).** New DbUp migration **`108_RlsRenameToArchLucid.sql`** (+ `Rollback/R108_*.sql`) drops the legacy security policy **`rls.ArchiforgeTenantScope`** + functions **`rls.archiforge_scope_predicate`** / **`rls.archiforge_tenant_predicate`**, then recreates them as **`rls.ArchLucidTenantScope`** + **`rls.archlucid_scope_predicate`** / **`rls.archlucid_tenant_predicate`** with the **full FILTER + BLOCK predicate set** carried forward from migrations **036 + 046 + 068 + 070 + 083 + 096 + 097 + 102 + 104**. Predicate functions now read SESSION_CONTEXT keys **`al_rls_bypass`**, **`al_tenant_id`**, **`al_workspace_id`**, **`al_project_id`** (the previous `af_*` keys are removed ï¿½ **atomic cutover, no dual-read shim**, per owner decision). Application surface area updated in lockstep: **`RlsSessionContextApplicator`**, **`RlsBypassPolicyBootstrap`** (comment), **`DevelopmentDefaultScopeTenantBootstrap`**, **`SqlTenantHardPurgeService`** all write `al_*`. Master DDL **`ArchLucid.sql`** substituted (`ArchiforgeTenantScope` ? `ArchLucidTenantScope` ï¿½21, `archiforge_scope_predicate` ? `archlucid_scope_predicate` ï¿½157, `archiforge_tenant_predicate` ? `archlucid_tenant_predicate` ï¿½20, plus `af_*` ? `al_*`). Integration tests **`RlsArchLucidScopeIntegrationTests`** + **`CrossTenantSessionContextSqlConnectionIsolationTests`** + **`TenantHardPurgeServiceSqlIntegrationTests`** updated ï¿½ the string-concatenation CI workaround (`"Archi" + "forgeTenantScope"`) is no longer needed. Docs touched: [`docs/security/MULTI_TENANT_RLS.md`](security/MULTI_TENANT_RLS.md) ï¿½ï¿½ 1, 6, 9, 10; [`docs/architecture/adrs/0003-sql-rls-session-context.md`](architecture/adrs/0003-sql-rls-session-context.md) Links; [`docs/ARCHLUCID_RENAME_CHECKLIST.md`](ARCHLUCID_RENAME_CHECKLIST.md) row 7.9 ï¿½ RLS leftover closed 2026-04-21. **Historical migrations 030 / 035 / 036 / 040 / 046 / 050 / 068 / 070 / 078 / 083 / 096 / 097 / 102 / 104 file bodies and `Baseline/000_*.sql` retain the original `Archiforge*` / `af_*` identifiers as immutable history** (per project rule); the rename is effected by 108 (a new forward migration) ï¿½ **not** by editing prior migrations.

**Brownfield deployment order (matters):** apply **108** *and* deploy the application binaries together. The old keys go away the moment the policy is recreated; an old binary still writing `af_*` after 108 will be denied access by the new predicates. There is **no compatibility window**.

---

## 2026-04-21 ï¿½ Owner Q&A follow-up: 3 decisions applied today + 2 queued for dedicated sessions (gate (iv) waiver, public-sector US scoped to FedRAMP Moderate only, ROI bulletin sign-off audit format)

**Same-day five-question follow-up to the 19-decision batch above.** Three decisions land in this change set; two are explicitly queued to dedicated sessions where they belong (Phase 3 PR A; per-trigger Teams matrix bundled with the deferred RLS object-name SQL migration).

**Phase 3 gate (iv) waived for pre-release window** (the most architecturally significant follow-up). [ADR 0029](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) ï¿½ Operational considerations now documents *why*: pre-release there is no customer traffic on either pipeline, so the daily parity probe (`coordinator-parity-daily.yml`) cannot accumulate the 14 contiguous green daily zero-write rows that gate (iv) measures; holding the gate would create a chicken-and-egg block on shipping V1 (no customers ? no traffic ? no rows ? cannot delete the legacy pipeline that is itself blocking V1 ship). Gate (iv) is restored automatically the moment ArchLucid ships V1 to a paying customer ï¿½ same V1-ship trigger that restores the already-waived gate (i) (30-day soak). Gates **(ii)** (`dotnet test --filter "Suite=Core|Suite=Integration"` green) and **(iii)** (live-API E2E green within 7 days) **remain in force** ï¿½ both are mechanical and produced inside the deletion PR's own CI run. **Net effect:** PR A is unblocked the moment gates (ii) and (iii) clear on the deletion branch; **2026-05-15 is now a latest-by deadline, not a wait-for-evidence one.** Atomic surface area: [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) (Operational considerations + Lifecycle table both rewritten), [`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) (Assumptions strikethrough + Constraints rewrite + Architecture-overview Mermaid diagram replaced + Component-breakdown row + gate-evidence row (iv) flipped from `FAIL` to **Waived for pre-release** + Follow-up step 1 strikethrough), [`docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) (ï¿½ Phase 3 gate status rewritten to record the unblocked-for-pre-release state + closing-report wording aligned).

**Public-sector US ï¿½ FedRAMP Moderate only (CJIS overlay deferred).** The v1 US public-sector pack is now anchored solely to **FedRAMP Moderate / NIST SP 800-53 Rev. 5**; CJIS Security Policy v5.9 references were dropped from policy-pack metadata, brief description, wizard preset, rule descriptions, and `templates/README.md` ï¿½ Owner decisions. Authoring the full CJIS Security Policy v5.9.5 control mappings (~30 controls) is captured as a future pack rather than a v1 overlay (visible-but-explicitly-out-of-scope notes preserved in the brief and wizard preset assumptions so the deferral itself is discoverable). Touched: [`templates/policy-packs/public-sector-us/policy-pack.json`](../templates/policy-packs/public-sector-us/policy-pack.json), [`archlucid-ui/public/vertical-templates/public-sector-us/policy-pack.json`](../archlucid-ui/public/vertical-templates/public-sector-us/policy-pack.json) (mirror), [`templates/policy-packs/public-sector-us/compliance-rules.json`](../templates/policy-packs/public-sector-us/compliance-rules.json) (3 rule descriptions cleaned), [`templates/briefs/public-sector-us/brief.md`](../templates/briefs/public-sector-us/brief.md) (header description + suggested architectureRequest JSON), [`archlucid-ui/src/lib/vertical-wizard-presets.ts`](../archlucid-ui/src/lib/vertical-wizard-presets.ts) (preset description + values), [`templates/README.md`](../templates/README.md) ï¿½ Owner decisions.

**ROI bulletin sign-off audit format (greppable section heading).** [`docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`](go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md) gains a new **ï¿½ Sign-off audit format (2026-04-21 owner Q&A follow-up)** that pins the heading shape every published bulletin must append to `docs/CHANGELOG.md`: `## YYYY-MM-DD ï¿½ ROI bulletin signed: Q?-YYYY`. The section *is* the signature ï¿½ no separate signature artifact, no co-signer. Auditors run a single `rg -n '^## \d{4}-\d{2}-\d{2} ï¿½ ROI bulletin signed: Q[1-4]-\d{4}$' docs/CHANGELOG.md` to produce the full historical sign-off log. The Owner-approval gate table's "Repository of record for sign-off" row and the Sign-off table's column header were updated to match (`Signature / link` ? `CHANGELOG.md section anchor`). **No bulletin without a section** rule added ï¿½ a published bulletin without the matching section is out of policy and the next quality assessment will flag it.

**Queued for dedicated sessions (not in this change set):**
- **Phase 3 PR A** (concretes + interfaces deletion + DI sweep + `DualPipelineRegistrationDisciplineTests` allow-list shrink + OpenAPI snapshot regen). Assistant authors end-to-end. Goes into its own clean turn ï¿½ large surgical change set, deserves not to be bundled.
- **Microsoft Teams per-trigger opt-in matrix** (new SQL migration adding `EnabledTriggersJson NVARCHAR(MAX) NOT NULL DEFAULT` to `dbo.TenantTeamsIncomingWebhookConnections` + master DDL update + `/integrations/teams` UI checkbox matrix + Logic Apps server-side trigger filter + tests). Bundled with the deferred **ArchLucid rename ï¿½ RLS object-name SQL migration** so both DDL change sets are reviewable together.

**Sequencing intent:** Teams + RLS session **first** (smaller blast radius, gives both DDL changes a clean review window), then PR A.

**Updated `PENDING_QUESTIONS.md`:** new "Resolved 2026-04-21 (follow-up Q&A ï¿½ 5 decisions)" table inserted; items **16**, **17**, **23**, and **24** gained sub-bullets capturing the follow-up decisions; the 19-decision table's "Phase 3 ADR 0022 lifecycle" row was strikethrough-amended (gate (iv) waiver supersedes the "wait for 14 rows" mechanism).

---

## 2026-04-21 ï¿½ Owner Q&A: 19 decisions applied (PGP, pricing, cohort baseline, Teams triggers, public-sector US, ROI bulletin, /why sync, SOC 2 deferral, ADR 0029 strangler acceleration, parity write path, archive `IMPROVEMENTS_COMPLETE`)

**One-shot owner Q&A (interactive in-chat session) drove a single change set covering all 19 decisions captured at the top of [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md). No code path changed runtime behavior; this entry is the consolidated audit trail.**

**Security custodian mailbox.** Canonical security inbox swapped from `security@archlucid.dev` to **`security@archlucid.net`** across [`SECURITY.md`](../library/contributor-reference/SECURITY.md), [`archlucid-ui/public/.well-known/security.txt`](../archlucid-ui/public/.well-known/security.txt), [`docs/go-to-market/trust-center.md`](go-to-market/trust-center.md), and [`docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`](go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md). Pending PGP key publication target UID is now `security@archlucid.net` (custodian generates and commits ï¿½ repo cannot generate the secret material). Resolves `PENDING_QUESTIONS.md` items **3**, **10**, **21**.

**Reference-customer discount standardized.** New ï¿½ 4.1 in [`docs/go-to-market/PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) records the **15%** standard reference discount; ï¿½ 5.4 work-down table updated. Resolves item **7**.

**Golden-cohort baseline lock approved.** [`tests/golden-cohort/README.md`](../tests/golden-cohort/README.md) now contains the operator runbook for the one-time `archlucid golden-cohort lock-baseline --write` command; [`.github/workflows/golden-cohort-nightly.yml`](../.github/workflows/golden-cohort-nightly.yml) header documents the conditional `cohort-simulator-drift` job gated on `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED`. Archives `PENDING_QUESTIONS.md` item **33**.

**Microsoft Teams notification triggers extended.** Three additional event triggers wired in addition to the original two ï¿½ Run failed, Manifest published with policy violations, Authority alert raised. Notification-only scope (no two-way governance) per item **23** v1 framing. Resolves item **32**.

**Public-sector vertical: US (FedRAMP / StateRAMP) shipped alongside EU (GDPR).** New artefacts: [`templates/briefs/public-sector-us/brief.md`](../templates/briefs/public-sector-us/brief.md), [`templates/policy-packs/public-sector-us/policy-pack.json`](../templates/policy-packs/public-sector-us/policy-pack.json), [`templates/policy-packs/public-sector-us/compliance-rules.json`](../templates/policy-packs/public-sector-us/compliance-rules.json), [`archlucid-ui/public/vertical-templates/public-sector-us/policy-pack.json`](../archlucid-ui/public/vertical-templates/public-sector-us/policy-pack.json). Wizard preset added in [`archlucid-ui/src/lib/vertical-wizard-presets.ts`](../archlucid-ui/src/lib/vertical-wizard-presets.ts) (existing entry relabelled `Public sector ï¿½ EU (GDPR)`; new `Public sector ï¿½ US (FedRAMP / StateRAMP)`). [`templates/README.md`](../templates/README.md) catalog row added; "all five verticals stay in Core Pilot / trial" tiering documented. Resolves items **17**, **18**.

**Aggregate ROI bulletin gating set.** [`docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`](go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md) records: minimum **N = 5**, **owner-solo** sign-off (sign-off table now references the dated `CHANGELOG.md` entry), **Mean + p50 + p90** retained, first publication window opens once at least one PLG tenant is `Published` (item **19**). Resolves item **27**.

**`/why` PDF + inline section synchronization guard.** New CI check [`scripts/ci/check_why_archlucid_comparison_sync.py`](../scripts/ci/check_why_archlucid_comparison_sync.py) (with C#-aware tuple parser that survives string literals containing parentheses) wired into [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Fails the build if comparison rows in `archlucid-ui/src/marketing/why-archlucid-comparison.ts` and `ArchLucid.Application/Pilots/WhyArchLucidPackBuilder.cs` diverge. Resolves item **31**.

**SOC 2 deferral made trigger-explicit.** [`docs/go-to-market/trust-center.md`](go-to-market/trust-center.md) compliance row for SOC 2 now says `Deferred ï¿½ interim self-assessment + Trust Center honesty until ARR materially supports CPA attestation cost` and adds a **Revisit trigger** sentence pointing at owner-defined ARR threshold (the dollar figure stays open under item **6** because the assistant cannot set it). Updates item **6**.

**Strangler Phase 3 cut-over accelerated to 2026-05-15.** New **[ADR 0029 ï¿½ Coordinator strangler acceleration to 2026-05-15](architecture/adrs/0030-coordinator-authority-pipeline-unification.md)** is the operative decision record; it **Supersedes** the earlier Draft [ADR 0028 ï¿½ completion scaffold](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) (whose `_TODO (owner)_` placeholders this Q&A answered). `SunsetHttpDate` for API deprecation signaling (now **`ApiDeprecation:SunsetHttpDate`** in [`ApiDeprecationOptions`](../ArchLucid.Host.Core/Configuration/ApiDeprecationOptions.cs), emitted by [`ApiDeprecationHeadersMiddleware`](../ArchLucid.Api/Middleware/ApiDeprecationHeadersMiddleware.cs)) moves from `Mon, 20 Jul 2026 00:00:00 GMT` to `Fri, 15 May 2026 00:00:00 GMT`; [ADR 0021](architecture/adrs/0030-coordinator-authority-pipeline-unification.md), [ADR 0022](architecture/adrs/0030-coordinator-authority-pipeline-unification.md), and [`docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) updated atomically. The post-PR-A **30-day soak gate (i)** is **waived for the pre-release window only** (rationale in ADR 0029 ï¿½ Operational considerations: no published clients to protect); gates **(ii)ï¿½(iv)** remain in force, including the 14-contiguous-green-rows parity gate **(iv)**. If V1 ships to a paying customer before PR A merges, ADR 0029 is amended to restore gate (i). Resolves items **24** and updates item **16** (legacy `CoordinatorRun*` sunset + ADR 0022 lifecycle sub-bullets).

**Coordinator parity-probe write path documented as owner-approved.** [`.github/workflows/coordinator-parity-daily.yml`](../.github/workflows/coordinator-parity-daily.yml) header now records why direct auto-commit to `main` is acceptable for this workflow (single deterministic Markdown row, `[skip ci]` to prevent recursive CI cost, concurrency group serialization, single-file write surface). `permissions: contents: write` already in place. Updates item **16** (parity-probe write path sub-bullet).

**Archived `IMPROVEMENTS_COMPLETE.md` from repo root.** `git mv` to [`docs/archive/IMPROVEMENTS_COMPLETE_2026_04_21.md`](archive/IMPROVEMENTS_COMPLETE_2026_04_21.md) with a `Superseded` banner naming the canonical replacements (dated CHANGELOG entries, the dated quality-assessment series, and `PENDING_QUESTIONS.md`). Resolves the `QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60` ï¿½ 1.23 anchor and item **34** in that assessment's open questions.

**Quality-assessment cadence pinned weekly.** [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) Quality-assessment cadence section records the next pass scheduled **2026-04-28**.

**Explicitly deferred to a separate change set.** ArchLucid rename ï¿½ RLS object-name SQL migration: approved but landed in a dedicated next session so the DDL change set is reviewable on its own (per **Navigation.mdc** Product rename / historical rename policy).

---

## 2026-04-22 ï¿½ Assessment follow-on Aï¿½H (`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60_ADDITIONAL.md`)

**A (strangler):** `docs/architecture/COORDINATOR_STRANGLER_INVENTORY.md`, `scripts/ci/assert_coordinator_reference_ceiling.py` + baseline JSON + unittest discover in `ci.yml`, draft **`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`**, cross-link from **`docs/archive/dual-pipeline-navigator-superseded.md`**. **B:** `POST /v1/pilots/board-pack.pdf` + `BoardPackPdfBuilder` (exec digest + value-report reuse), value-report UI CTA. **C:** `archlucid_operator_task_success_total` + `GET /v1/diagnostics/operator-task-success-rates` + operator home tile. **D:** `POST /v1/marketing/pricing/quote-request` + migration **106** + pricing form. **E:** marketing **`/compliance-journey`**. **F:** `scripts/build_procurement_pack.{sh,ps1}` + Trust Center / integration catalog notes. **G:** `GET /v1/architecture/run/{runId}/traceability-bundle.zip` + `TraceabilityBundleBuilder`. **H:** `docs/runbooks/GAME_DAY_CHAOS_QUARTERLY.md`, Simmy workflow_dispatch inputs, `docs/quality/game-day-log/README.md`, `docs/TEST_EXECUTION_MODEL.md` link, **`PENDING_QUESTIONS.md`** item **34**. OpenAPI snapshot refreshed.

## 2026-04-22 ï¿½ PLG reference publication scaffolding (Prompt 1) + Microsoft Teams connector (Prompt 7) from `CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`

**Reference customer (PLG):** Owner substitution checklist table at the top of **`docs/go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md`**; committed demo sample **`docs/go-to-market/reference-customers/samples/pilot-run-deltas.demo-tenant.json`**; one-page scaffold pointer **`docs/go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_DEMO_SCAFFOLD.md`**. **Row state convention:** **Drafting ? Customer review** is normal assistant/CS prep work; **Customer review ? Published** is **owner-only** (same discipline as `README.md` table + `check_reference_customer_status.py` merge-blocking flip when Published).

**Teams:** Migration **`105_TenantTeamsIncomingWebhookConnections`** + master DDL; **`GET/POST/DELETE /v1/integrations/teams/connections`** (`KeyVaultSecretName` only ï¿½ rejects raw URLs); architect workspace **`/integrations/teams`**; Terraform **`enable_teams_notifications_logic_app`** host + **`infra/terraform-logicapps/workflows/teams-notifications/README.md`**; **`docs/integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md`** + integration catalog row; **`PENDING_QUESTIONS.md`** item **32** (extra event types) and item **23** cross-link.

---

## 2026-04-21 ï¿½ Marketplace + Stripe live readiness (Prompt 4 from `CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`)

**Pricing / Marketplace docs:** Canonical **Team / Professional / Enterprise** naming in [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md); new **ï¿½3.1** in [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md). **CI:** `scripts/ci/assert_marketplace_pricing_alignment.py` + `scripts/ci/tests/test_assert_marketplace_pricing_alignment.py` (workflow step in `ci.yml`). **Production startup:** `BillingProductionSafetyRules` in `ArchLucid.Host.Core` ï¿½ `sk_live_` requires webhook signing secret; Azure Marketplace provider requires non-loopback `LandingPageUrl`; `GaEnabled=true` requires `MarketplaceOfferId` (`Billing:AzureMarketplace:*`). **CLI:** `archlucid marketplace preflight [--repo <dir>]` + tests. **Docs:** expanded [`STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md) staging Stripe TEST flow (Stripe CLI + curl), [`BILLING.md`](library/BILLING.md) safety bullets, [`CLI_USAGE.md`](library/CLI_USAGE.md), **`PENDING_QUESTIONS.md`** items **8**, **9**, **22** ï¿½Needed from ownerï¿½ lists.

---

## 2026-04-21 ï¿½ Trial signup funnel end-to-end (Prompt 2 from `CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`)

**Funnel discoverability + executable smoke:** New runbook **`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`** maps the full happy path (signup ? tenant + sample run ? email verification ? first commit ? sponsor banner + Day N badge + before-vs-measured panel) with file paths, audit events, and forensic-replay expectations. **Marketing form:** **`SignupForm.tsx`** gains an **aria-expanded "Add a baseline review-cycle estimate (optional)"** disclosure that forwards **`baselineReviewCycleHours`** + **`baselineReviewCycleSource`** to **`POST /v1/register`** (Zod schema validates positive decimal, source-without-hours is rejected); the field stays **optional** per `docs/PENDING_QUESTIONS.md` item 28. **Operator dashboard:** new **`BeforeAfterDeltaPanel.tsx`** renders the same shape as `ValueReportReviewCycleSectionFormatter` from `GET /v1/tenant/trial-status` (baseline) + `GET /v1/pilots/runs/{trialWelcomeRunId}/pilot-run-deltas` (measured) on operator home. **CLI smoke:** **`archlucid trial smoke --org <name> --email <email> [--baseline-hours <n>]`** is a pure-HTTP loop (no Docker, no SQL on developer laptop) that PASS / FAIL-prints each step against any local or staging API base URL, with audit-event hints on failure. **Mock Playwright spec:** `archlucid-ui/e2e/trial-funnel.spec.ts` proves form ? mocked `POST /v1/register` ? mocked `GET /v1/tenant/trial-status` ? operator dashboard renders the Day N badge and BeforeAfterDeltaPanel deterministically without SQL. **Tests:** `BeforeAfterDeltaPanel.test.tsx` (5), `SignupForm.test.tsx` adds 1 case for the disclosure + payload forwarding, `TrialSmokeCommandOptionsTests` (9), `TrialSmokeRunnerTests` (6). **Cross-links:** `docs/FIRST_30_MINUTES.md` and `docs/CLI_USAGE.md` (new **archlucid trial smoke** section + commands-table row). **Owner-only blockers (no bypass):** Stripe live keys + webhook secret, Marketplace publisher legal entity name, DNS / Front Door cutover for `archlucid.net`, soft-required baseline UX change (kept optional today) ï¿½ recorded in `docs/PENDING_QUESTIONS.md` (items 9, 22, 28; Resolved DNS/TLS row).

---

## 2026-04-21 ï¿½ Proof-of-ROI: aggregate bulletin + soft-required baseline (Prompt 3 from `CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`)

**Soft-required baseline UX:** Marketing `SignupForm` defaults to **model default** vs **custom hours** (radio), tooltip on the default path, inline note on measured-vs-baseline curve, and link to **`docs/go-to-market/TRIAL_BASELINE_PRIVACY_NOTE.md`**. **`archlucid_trial_signup_baseline_skipped_total`** increments on successful **`POST /v1/register`** when no tenant-supplied hours are sent (no hard validation ï¿½ UX stays skippable). **Aggregate bulletin:** new **`docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`** (minimum-N = 5, mean/p50/p90 only, owner gate). **Admin API + CLI:** `GET /v1/admin/roi-bulletin-preview` + **`archlucid roi-bulletin --quarter Q1-YYYY [--min-tenants 5] [--out file.md]`** (400 ? CLI **UsageError**). **Runs index:** `RunsIndexBeforeAfterPanel` + `BeforeAfterDeltaPanel` when the page lists a committed run; operator home keeps the same panel for mock E2E. **Core:** `IRoiBulletinAggregateReader`, `RoiBulletinQuarterParser`, **`SqlRoiBulletinAggregateReader`**, in-memory stub. **Tests:** `RoiBulletinQuarterParserTests`, `RoiBulletinAdminControllerIntegrationTests`, `RoiBulletinCommandOptionsTests`, `RoiBulletinMarkdownFormatterTests`, Prometheus smoke needle for baseline-skipped, `SignupForm` + `trial-funnel` E2E updates. **Docs:** `TRIAL_AND_SIGNUP.md`, `TRIAL_FUNNEL.md`, `CLI_USAGE.md`, **`PENDING_QUESTIONS.md`** items 27ï¿½28 sub-bullets.

---

## 2026-04-21 ï¿½ Vertical starter briefs + policy packs (Prompt 11)

**Templates / accelerators:** Five paired vertical starters under **`templates/briefs/{vertical}/brief.md`** and **`templates/policy-packs/{vertical}/`** (compliance JSON + `policy-pack.json`) for **financial-services**, **healthcare**, **retail**, **saas**, **public-sector**; index table in **`templates/README.md`**. **Architect workspace:** new-run wizard step **Start from a vertical template** (`vertical-wizard-presets.ts`, `WizardStepPreset.tsx`); policy packs page **Import a vertical policy pack** loads static **`/vertical-templates/{slug}/policy-pack.json`**. **Tests:** **`VerticalStarterPolicyPackLoadingTests`** copies template JSON into **`ArchLucid.Decisioning.Tests`** output and asserts **`ComplianceRulePackGovernanceFilter`** returns a non-empty rule list. **Owner gates** in **`docs/PENDING_QUESTIONS.md`** items **17ï¿½18** (EU vs US public-sector; paid-tier vs Core Pilot).

---

## 2026-04-21 ï¿½ Weekly sponsor digest email (Prompt 10)

**Sponsor loop automation:** Per-tenant **`dbo.TenantExecDigestPreferences`** (migration **103**) stores schedule (**IANA timezone**, **day-of-week**, **hour**), **recipient mailboxes**, and an **email enabled** flag. **`IExecDigestComposer`** / **`ExecDigestComposer`** assemble a UTC-window digest from existing services (**compliance drift** daily buckets, **committed manifests** in-window with **pilot delta** significance proxy, optional **findings delta** line) with graceful omission when data is missing. **`ExecDigestWeeklyDeliveryScanner`** + **`ExecDigestWeeklyHostedService`** (hourly leader-elected poll) and CLI job **`exec-digest-weekly`** send through **`IExecDigestEmailDispatcher`** using embedded Razor **`ExecDigest`** + **`SentEmails`** idempotency **`exec-digest:{tenant}:{iso-week}`**. **API:** **`GET/POST /v1/tenant/exec-digest-preferences`** (Read / Execute) and anonymous **`GET /v1/notifications/exec-digest/unsubscribe?token=ï¿½`** (**`IDataProtection`**, disables email). **UI:** **`/settings/exec-digest`**. Static mirrors: **`templates/email/exec-digest.html`** / **`.txt`**. Tests: composer unit test, unsubscribe token round-trip, **`ExecDigestWeeklyArchLucidJob`** smoke.

---

## 2026-04-21 ï¿½ Product boundary: no customer-shipped production containers

**SaaS posture:** ArchLucid is **vendor-operated SaaS**. **Shipping production Docker images, Helm charts, or customer-operable container bundles** as a standard customer deliverable is **explicitly out of scope** (2026-04-21). **Customer-facing deliverables** are the **CLI**, **API client libraries**, **OpenAPI / REST documentation**, and other **product docs**; local **`docker compose`** / **`archlucid pilot up`** paths stay as **optional evaluation and engineering** workflows in the repository, not a committed BYOC program. **`docs/PENDING_QUESTIONS.md`** (Resolved), **`docs/CONTAINERIZATION.md`** (product boundary), **`docs/go-to-market/PRODUCT_DATASHEET.md`**, **`docs/go-to-market/BUYER_PERSONAS.md`**, and **`docs/architecture/adrs/0020-azure-primary-platform-permanent.md`** (consequences / portability wording) updated for alignment.

---

## 2026-04-21 ï¿½ Workflow integration scope: ServiceNow + Confluence deferred

**Product direction:** First-party **ServiceNow** and **Confluence** integrations (Cursor Prompt 5) are **explicitly out of scope for now** ï¿½ ServiceNow targets **operational ITSM** while ArchLucid focuses **upstream** architecture activities; **Confluence** is deferred in favor of a **Microsoft-first** posture (Entra, Azure DevOps, Teams, Logic Apps). **`docs/PENDING_QUESTIONS.md`** (Resolved row + still-open items **4** / **11**) and **`docs/archive/assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md`** (Prompt 5 marked **DEFERRED** + stop line in the historical paste block) updated accordingly.

---

## 2026-04-21 ï¿½ ADR 0021 Phase 2 audit catalog + commit faï¿½ade + parity probe (Prompt 2 / dual pipeline)

**Strangler prep (no coordinator interface deletion):** Added **`AuditEventTypes.Run.*`** canonical durable strings (`Run.Created`, `Run.ExecuteStarted`, `Run.ExecuteSucceeded`, `Run.CommitCompleted`, `Run.Failed`) and **`CoordinatorRunCatalogDurableDualWrite`** so coordinator create/execute/commit paths and **`CoordinatorRunFailedDurableAudit`** **dual-append** legacy `CoordinatorRun*` plus canonical rows (ADR 0021 Phase 2 dual-write window). **`TrialLifecycleEmailPublishingAuditDecorator`** treats **`Run.CommitCompleted`** like **`CoordinatorRunCommitCompleted`**. New write faï¿½ade **`IRunCommitOrchestrator`** + **`RunCommitOrchestratorFacade`** (delegates to **`IArchitectureRunCommitOrchestrator`** today), registered scoped in **`ServiceCollectionExtensions.ApplicationPipeline`**. Tooling: **`scripts/ci/coordinator_parity_probe.py`** + **`test_coordinator_parity_probe.py`**, workflow **`.github/workflows/coordinator-parity-daily.yml`** (optional repo secret **`ARCHLUCID_COORDINATOR_PARITY_ODBC`** for live `dbo.AuditEvents` counts). Runbook **`docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`** gains HTML-marker block for nightly upserts. Tests: **`AuditEventTypes_RunCatalogMirrorTests`**, collision matrix includes **`Run`**, **`RunCommitOrchestratorFacadeTests`**, extended coordinator durable audit tests, **`IRunCommitOrchestrator`** resolution in **`DualPipelineRegistrationDisciplineTests`**. Docs: **`docs/AUDIT_COVERAGE_MATRIX.md`** (const count **101**), **`docs/ARCHITECTURE_COMPONENTS.md`**, ADR **0022** table refresh. Owner gates recorded in **`docs/PENDING_QUESTIONS.md`**.

---

## 2026-04-21 ï¿½ Reference evidence CLI + pilot deltas API + admin ZIP (Prompt 1 / GTM)

**Proof-of-ROI tooling:** New CLI **`archlucid reference-evidence --run <runId> [--out <dir>] [--include-demo]`** (tenant-scoped API key) downloads **`pilot-run-deltas.json`**, first-value Markdown/PDF, and sponsor one-pager when available; refuses Contoso demo runs unless **`--include-demo`**. Admin path **`--tenant <tenantId>`** calls **`GET /v1/admin/tenants/{tenantId}/reference-evidence`** (AdminAuthority) for a ZIP built server-side under **`AmbientScopeContext`**. New HTTP **`GET /v1/pilots/runs/{runId}/pilot-run-deltas`** returns **`PilotRunDeltasResponse`** JSON. Persistence: **`IReferenceEvidenceRunLookup`** + **`SqlReferenceEvidenceRunLookup`** / in-memory stub. Application: **`IReferenceEvidenceAdminExportService`** + **`ReferenceEvidenceAdminExportService`**, **`PilotRunDeltasResponseMapper`**. Contracts: **`PilotRunDeltasResponse`**. Docs: **`docs/go-to-market/reference-customers/REFERENCE_PUBLICATION_RUNBOOK.md`**, **`REFERENCE_EVIDENCE_PACK_TEMPLATE.md`**.

---

## 2026-04-21 ï¿½ Cached anonymous `/demo/preview` commit-page surface for marketing

Added **`GET /v1/demo/preview`** and the marketing **`/demo/preview`** page so sponsors and buyers can see a real ArchLucid commit page sourced from the demo seed **without signing in**. In-process cache (**5 min** TTL via **`Demo:PreviewCacheSeconds`**) plus HTTP **`Cache-Control`** + Next.js **`revalidate = 300`** keeps the surface cheap under marketing-traffic spikes. New read model **`IDemoCommitPagePreviewClient`** composes the same services as the operator run detail view; **`IDemoSeedRunResolver`** shares canonical-run resolution with **`DemoReadModelClient`**. Docs: **`docs/DEMO_PREVIEW.md`**, ADR **`docs/architecture/adrs/0027-demo-preview-cached-anonymous-commit-page.md`**.

---

## 2026-04-21 ï¿½ Sponsor banner ï¿½Day N since first commitï¿½ badge

**Buyer trust ï¿½ time anchored in tenant data:** The post-commit **`EmailRunToSponsorBanner`** (`archlucid-ui/src/components/EmailRunToSponsorBanner.tsx`) now loads **`GET /v1/tenant/trial-status`** and, when **`firstCommitUtc`** is present, shows a small **ï¿½Day N since first commitï¿½** badge next to **Time to value** (UTC full-day count since the tenantï¿½s first committed golden manifest). The value is sourced from existing **`dbo.Tenants.TrialFirstManifestCommittedUtc`** via **`TenantRecord`** / **`TenantTrialStatusResponse.FirstCommitUtc`** (no migration). Optional render telemetry: counter **`archlucid.ui.sponsor_banner.first_commit_badge_rendered`** and **`POST /v1/diagnostics/sponsor-banner-first-commit-badge`**. Docs: **[`SPONSOR_BANNER_FIRST_COMMIT_BADGE.md`](library/SPONSOR_BANNER_FIRST_COMMIT_BADGE.md)**; API contract note in **[`API_CONTRACTS.md`](library/API_CONTRACTS.md)**.

---

## 2026-04-21 ï¿½ Azure DevOps Pipelines YAML parity with GitHub manifest-delta actions (ADR 0024)

**Buyer CI ï¿½ Azure DevOps:** New pipeline templates **[`integrations/azure-devops-task-manifest-delta/`](../integrations/azure-devops-task-manifest-delta/)** (job summary via `##vso[task.uploadsummary]`) and **[`integrations/azure-devops-task-manifest-delta-pr-comment/`](../integrations/azure-devops-task-manifest-delta-pr-comment/)** (sticky PR thread + PR status via Git REST 7.1). Both reuse **[`integrations/github-action-manifest-delta/fetch-manifest-delta.mjs`](../integrations/github-action-manifest-delta/fetch-manifest-delta.mjs)** (single Markdown source of truth). **`AzureDevOpsPullRequestWireFormat`** centralizes JSON bodies; parity tests: **`ArchLucid.Integrations.AzureDevOps.Tests/AzureDevOpsRequestBodyParityWithPipelineTaskTests.cs`**, Node **`node --test`** (CI matrix: Linux / Windows / macOS). Docs: **[`AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md`](integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md)**, **[`AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md`](integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md)**; server-side doc renamed to **[`AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md)** with **[`AZURE_DEVOPS_PR_DECORATION.md`](integrations/AZURE_DEVOPS_PR_DECORATION.md)** redirect. ADR: **[`0024`](architecture/adrs/0024-azure-devops-pipeline-task-parity-with-github-action.md)**. Optional fetch soft-fail: **`ARCHLUCID_COMPARE_WARN_ONLY=1`** (404 ? warning + exit 0).

---

## 2026-04-21 ï¿½ Trial signup captures baseline review-cycle time; value-report DOCX renders before/after delta

**Pilot ROI ï¿½ instrumented baseline:** Optional `baselineReviewCycleHours` / `baselineReviewCycleSource` on **`POST /v1/register`** validate and persist on **`dbo.Tenants`** (migration **101**). **`GET /v1/tenant/trial-status`** echoes the captured trio. Tenant **value-report DOCX** (`DocxValueReportRenderer`) and **first-value Markdown** (`FirstValueReportBuilder`) render a shared **Review-cycle delta (before vs measured)** section from `ValueReportReviewCycleSectionFormatter`, using measured run?manifest window averages from SQL and falling back to **`ValueReportComputationOptions.BaselineArchitectHoursBeforeArchLucidPerCommittedManifest`** when the prospect skipped the question ï¿½ with explicit provenance labels. Audit: **`TrialBaselineReviewCycleCaptured`**. Docs: **`PILOT_ROI_MODEL.md`** ï¿½3.1 note, **`PILOT_GUIDE.md`** curl example.

---

## 2026-04-21 ï¿½ ADR 0021 Phase 3 blocked (exit gates)

**Architectural integrity ï¿½ strangler Phase 3 not executed:** [ADR 0022](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) records **failed** ADR 0021 ï¿½ Phase 3 exit gates: **(iv)** `docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md` still has `*(TBD)*` rows only (no 14-day zero-write window); **Phase 2 catalog** ï¿½ no `AuditEventTypes.Run` nested class in `AuditEventTypes.cs`. Mechanical verification: [`evidence/phase3/gate-verification.md`](evidence/phase3/gate-verification.md). **No** coordinator concrete/interface deletion, **no** `IRunCommitOrchestrator` faï¿½ade ï¿½ fail-closed per strangler governance. **Follow-up:** unblock PR A after parity + Phase 2 evidence; **PR B** (audit constants + interface deletion) remains **= 2026-07-21** (30-day gate (i) after PR A + **Sunset 2026-07-20**).

---

## 2026-04-21 ï¿½ Production Azure subscription recorded

**Operations ï¿½ production subscription mapping captured:** Owner provided the dedicated production Azure subscription ID (`aab65184-5005-4b0d-a884-9e28328630b1`). New canonical doc **[`docs/AZURE_SUBSCRIPTIONS.md`](library/AZURE_SUBSCRIPTIONS.md)** is now the **single source of truth** for ArchLucid Azure subscription mapping (staging, production, quarterly greenfield CI), the GitHub Environment secret each one maps to (`AZURE_SUBSCRIPTION_ID` per environment in [`cd.yml`](../.github/workflows/cd.yml)), the default region (`centralus`), and the OIDC-only login pattern. Subscription IDs are intentionally **not** hard-coded in `infra/**/*.tf` or example tfvars ï¿½ `azure/login@v2` exports `ARM_SUBSCRIPTION_ID` for every Terraform step. Item 1 in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) moved from **Still open** to **Resolved**; cross-links added from [`REFERENCE_SAAS_STACK_ORDER.md`](library/REFERENCE_SAAS_STACK_ORDER.md) and [`FIRST_AZURE_DEPLOYMENT.md`](library/FIRST_AZURE_DEPLOYMENT.md). Operator action: set the `AZURE_SUBSCRIPTION_ID` secret on the **`production`** GitHub Environment to the recorded value (with required reviewers enabled).

---

## 2026-04-21 ï¿½ Seven-improvements batch (Azure DevOps, Stryker scopes, SaaS region, security.txt)

**Workflow embeddedness ï¿½ Azure DevOps PR decoration (opt-in):** New assembly **`ArchLucid.Integrations.AzureDevOps`** with **`IAzureDevOpsPullRequestDecorator`** / **`AzureDevOpsPullRequestDecorator`** (REST 7.1 PR **statuses** + **threads**) and **`AuthorityRunCompletedAzureDevOpsIntegrationEventHandler`** consuming **`com.archlucid.authority.run.completed`**. Worker DI registers typed **`HttpClient`** + configuration section **`AzureDevOps`** (`appsettings.json`). Tests: **`ArchLucid.Integrations.AzureDevOps.Tests`**. Docs: **[`docs/integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md)** (redirect: [`AZURE_DEVOPS_PR_DECORATION.md`](integrations/AZURE_DEVOPS_PR_DECORATION.md)); catalog row in **[`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md)**.

**Engineering ï¿½ Stryker scoped namespaces (CI only):** New **`stryker-config.decisioning-merge.json`** (label **DecisioningMerge**) and **`stryker-config.application-governance.json`** (label **ApplicationGovernance**); **`stryker-baselines.json`** starts both at **55.0**; weekly matrix + **`stryker_pr_plan.py`** FULL_MATRIX and path rules updated; **`docs/MUTATION_TESTING_STRYKER.md`** + **`docs/TEST_STRUCTURE.md`** tables extended. Local Stryker runs not required ï¿½ ratchet via **`refresh_stryker_baselines.py`** after green scheduled jobs.

**Deployability ï¿½ default Azure region:** **`infra/terraform-container-apps/variables.tf`** `location` default **`centralus`**; **[`docs/REFERENCE_SAAS_STACK_ORDER.md`](library/REFERENCE_SAAS_STACK_ORDER.md)** documents primary region; **[`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publication-checklist-gtm)** publication checklist; **[`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)** item 1 notes Central US default.

**Architectural integrity ï¿½ ADR 0021 Phase 3 not executed here:** Tracking placeholder **[`docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`](architecture/adrs/0030-coordinator-authority-pipeline-unification.md)** (no coordinator interface deletion in this change set).

**Trust ï¿½ security.txt:** Marketing static **[`archlucid-ui/public/.well-known/security.txt`](../archlucid-ui/public/.well-known/security.txt)**; **[`SECURITY.md`](../library/contributor-reference/SECURITY.md)** links canonical URL + future **`pgp-key.txt`** path; **[`docs/go-to-market/trust-center.md`](go-to-market/trust-center.md)** notes internal CISO ownership of the SOC 2 self-assessment.

**Cursor prompts:** Consolidated execution log **[`docs/CURSOR_PROMPTS_SEVEN_IMPROVEMENTS_2026_04_21.md`](archive/quality/2026-04-23-doc-depth-reorg/CURSOR_PROMPTS_SEVEN_IMPROVEMENTS_2026_04_21.md)** (what shipped vs owner-blocked).

---

## 2026-04-21 ï¿½ Pending questions + PLG reference + owner security assessment draft

**Architectural integrity ï¿½ ADR 0021 Phase 1 retirement gate + Phase 2 deprecation signal:** Drove ADR 0021 Phase 1 to its retirement gate by **enforcing** what was previously only documented: every internal read of `GoldenManifest` now goes through `IUnifiedGoldenManifestReader`, and a new build-blocking assertion **[`DualPipelineRegistrationDisciplineTests.Production_types_outside_allow_list_do_not_reference_ICoordinatorGoldenManifestRepository`](../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs)** sweeps **every loaded `ArchLucid.*` production assembly** (constructor parameters, fields, properties ï¿½ public and non-public) and fails the build when any type outside an explicit four-entry allow-list type-references the coordinator manifest repository. The allow-list contains the **single permitted reader** ([`UnifiedGoldenManifestReader`](../ArchLucid.Persistence/Reads/UnifiedGoldenManifestReader.cs)) plus the three documented write-path orchestrators ([`AuthorityDrivenArchitectureRunCommitOrchestrator`](../ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs), [`ReplayRunService`](../ArchLucid.Application/ReplayRunService.cs), [`DemoSeedService`](../ArchLucid.Application/Bootstrap/DemoSeedService.cs)) that ADR 0021 Phase 3 will retire when the write-side faï¿½ade lands; new consumers must justify their addition to the allow-list (and amend the ADR) before merging. Then started **ADR 0021 Phase 2** by mounting the standards-track deprecation signal on the mutating coordinator routes (`POST /v1/architecture/request`, `ï¿½/run/{id}/execute`, `ï¿½/replay`, `ï¿½/determinism-check`, `ï¿½/commit`, `ï¿½/result`, `ï¿½/seed-fake-results` ï¿½ every action on `RunsController`). Shipped first as a route-scoped attribute + filter pair; **current tree** uses global **[`ApiDeprecationHeadersMiddleware`](../ArchLucid.Api/Middleware/ApiDeprecationHeadersMiddleware.cs)** + [**`ApiDeprecationOptions`**](../ArchLucid.Host.Core/Configuration/ApiDeprecationOptions.cs) (`ApiDeprecation:*`) to emit the canonical triplet on applicable responses when enabled: **`Deprecation: true`** (RFC 9745 ï¿½3), **`Sunset`** (RFC 8594), and **`Link`** (RFC 8288 + RFC 9745 ï¿½4 ï¿½ migration target). Read-only siblings ([`RunQueryController`](../ArchLucid.Api/Controllers/Authority/RunQueryController.cs), [`ManifestsController`](../ArchLucid.Api/Controllers/Governance/ManifestsController.cs)) already consumed `IUnifiedGoldenManifestReader` at Phase 2 ship; header scope is now configuration-driven. Tests: **[`ApiDeprecationHeadersMiddlewareTests`](../ArchLucid.Api.Tests/ApiDeprecationHeadersMiddlewareTests.cs)** (middleware `OnStarting` emission), **[`ArchLucidConfigurationRulesTests`](../ArchLucid.Api.Tests/ArchLucidConfigurationRulesTests.cs)** (`ApiDeprecation:SunsetHttpDate` validation). Docs: ADR 0021 Status note records both 2026-04-21 events (Phase 1 retirement gate + Phase 2 sunset clock start), Phase 1 inventory cross-references the new assembly-wide assertion, Related section links the [`COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) parity report.

**Workflow embeddedness ï¿½ PR-commenter GitHub Action:** New composite GitHub Action **[`integrations/github-action-manifest-delta-pr-comment/`](../integrations/github-action-manifest-delta-pr-comment/)** posts the structured `GET /v1/compare` manifest delta as a **single sticky pull-request comment** that is rewritten on every workflow run instead of stacking duplicates. Two-step composite: step 1 reuses the existing **[`fetch-manifest-delta.mjs`](../integrations/github-action-manifest-delta/fetch-manifest-delta.mjs)** from the sibling job-summary action (single source of truth for the Markdown shape ï¿½ both actions render identical bodies) and writes the rendered Markdown to `${RUNNER_TEMP}/archlucid-manifest-delta.md`; step 2 invokes the new **[`post-pr-comment.mjs`](../integrations/github-action-manifest-delta-pr-comment/post-pr-comment.mjs)** which lists the PR's comments via `gh api repos/$OWNER/$REPO/issues/$PR/comments --paginate`, finds the one whose body contains the marker `<!-- archlucid:manifest-delta -->` (HTML-comment, renders as nothing in the PR view but survives the GitHub REST round-trip), and either **PATCH**es it in place or **POST**s a new one. The pure `upsertStickyComment(...)` helper is exported behind a pluggable `gh` client so the create-vs-update branching is unit-testable without invoking the `gh` binary or hitting the GitHub API. Reuses the existing **`ARCHLUCID_READONLY_API_KEY`** secret (`X-Api-Key` / `ReadAuthority`); requires `permissions: pull-requests: write` on the job so the default `secrets.GITHUB_TOKEN` can create / patch comments. Per-tenant marker override (e.g. `<!-- archlucid:manifest-delta:tenant-acme -->`) lets one PR carry multiple independent stickies. Tests: [`post-pr-comment.test.mjs`](../integrations/github-action-manifest-delta-pr-comment/post-pr-comment.test.mjs) (9 cases ï¿½ empty / non-string-body lists, new-PR POST path, existing-sticky PATCH path, custom-marker isolation, full required-arg validation; `node --test`, zero external deps). Example workflow: **[`.github/workflows/example-manifest-delta-pr-comment.yml`](../.github/workflows/example-manifest-delta-pr-comment.yml)** wired for both `pull_request` (auto-refresh on every push) and `workflow_dispatch` (manual back-fill). Docs: new contract + sticky-marker guide at **[`docs/integrations/GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md`](integrations/GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md)**; sibling [`GITHUB_ACTION_MANIFEST_DELTA.md`](integrations/GITHUB_ACTION_MANIFEST_DELTA.md) Related section cross-links to the new action.

**Differentiability ï¿½ public provenance + citations demo route:** New unauthenticated, read-only operator route **`/demo/explain`** ([`archlucid-ui/src/app/(operator)/demo/explain/page.tsx`](../archlucid-ui/src/app/(operator)/demo/explain/page.tsx)) renders the **`ProvenanceGraph`** for the latest committed demo-seed run side-by-side with the **citations-bound aggregate explanation** for the same run ï¿½ so a sponsor or pilot evaluator can see, in one glance, "evidence ? decision ? citation" without signing in. Backed by new endpoint **`GET /v1/demo/explain`** ([`DemoExplainController`](../ArchLucid.Api/Controllers/Demo/DemoExplainController.cs)) which delegates to a new server-side **`DemoReadModelClient`** ([`ArchLucid.Host.Core/Demo/DemoReadModelClient.cs`](../ArchLucid.Host.Core/Demo/DemoReadModelClient.cs), interface [`IDemoReadModelClient`](../ArchLucid.Host.Core/Demo/IDemoReadModelClient.cs)) that composes the same application services as `/v1/explain` and `/v1/provenance` (`IRunRepository`, `IRunExplanationSummaryService`, `IProvenanceQueryService`) but **hard-pins the `ScopeContext` to the demo tenant** ï¿½ the underlying authenticated routes' policies are unchanged. Demo run resolution: canonical `ContosoRetailDemoIdentifiers.AuthorityRunBaselineId` first, then a bounded scan over the 100 most-recent runs filtered on `ContosoRetailDemoIdentifiers.IsDemoRequestId(...)` + a non-empty `RunRecord.GoldenManifestId` (covers per-tenant `req-contoso-demo-{suffix}` shapes). Hard-blocked from non-`Demo:Enabled=true` deployments by a new generic gate filter ï¿½ **`[FeatureGate(FeatureGateKey.DemoEnabled)]`** ([`FeatureGateAttribute`](../ArchLucid.Api/Attributes/FeatureGateAttribute.cs) ? [`FeatureGateFilter`](../ArchLucid.Api/Filters/FeatureGateFilter.cs)) ï¿½ which returns **`404 Not Found`** Problem Details (not 403) so production hosts cannot leak the existence of the demo surface; the same `FeatureGateKey` enum is reusable for future per-deployment toggles. Response type **`DemoExplainResponse`** ([`ArchLucid.Host.Core/Demo/DemoExplainResponse.cs`](../ArchLucid.Host.Core/Demo/DemoExplainResponse.cs)) always carries `IsDemoData=true` and the `DemoStatusMessage` "demo tenant ï¿½ replace before publishing" so sponsor screenshots cannot be quoted as production telemetry. DI: registered scoped in [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs). Tests: API integration ([`DemoExplainEndpointTests`](../ArchLucid.Api.Tests/DemoExplainEndpointTests.cs)) covers **404 when `Demo:Enabled=false`** (filter short-circuits), **404 when `Demo:Enabled=true` but no committed demo run** (read-model returns null), and **200 with payload when read-model resolves** (test-host stubs `IDemoReadModelClient`); filter unit tests ([`FeatureGateFilterTests`](../ArchLucid.Api.Tests/FeatureGateFilterTests.cs)) cover open / closed / unmapped-key (closed-by-default); read-model unit tests ([`DemoReadModelClientTests`](../ArchLucid.Host.Composition.Tests/Demo/DemoReadModelClientTests.cs)) cover canonical-baseline path, recent-scan fallback ordering, no-run / no-summary degrade-to-null, and null-graph ? empty-graph substitution. UI: Vitest snapshot + 404 fallback + API-problem callouts ([`page.test.tsx`](../archlucid-ui/src/app/(operator)/demo/explain/page.test.tsx)); new typed helper `getDemoExplain()` in [`archlucid-ui/src/lib/api.ts`](../archlucid-ui/src/lib/api.ts) (returns `null` on 404 so the page can render the "no committed demo-seed run is available" notice without a thrown error). OpenAPI v1 snapshot refreshed (`ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`); `ArchLucid.Api.Client` regenerated via NSwag. Docs: [`go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md) ï¿½2 (Pillar 2 ï¿½ Auditable decision trail) gains a **Live deep link in the staging funnel** subsection that points sponsors at the staging `/demo/explain` URL and explains the `Demo:Enabled` gate.

**Proof-of-ROI readiness ï¿½ deltas computed from demo seed:** `FirstValueReportBuilder` (Markdown) and `SponsorOnePagerPdfBuilder` (PDF) no longer ship baseline placeholder cells for the metrics ArchLucid can derive on its own. A new application service, **`PilotRunDeltaComputer`** ([`ArchLucid.Application/Pilots/PilotRunDeltaComputer.cs`](../ArchLucid.Application/Pilots/PilotRunDeltaComputer.cs), interface [`IPilotRunDeltaComputer`](../ArchLucid.Application/Pilots/IPilotRunDeltaComputer.cs)), produces a single immutable [`PilotRunDeltas`](../ArchLucid.Application/Pilots/PilotRunDeltas.cs) record per run that is consumed by **both** builders so the Markdown sibling and the sponsor PDF wrapper render identical numbers (no drift). Computed lines: **time from `RunRecord.CreatedUtc` to `GoldenManifest.CommittedUtc`**, **findings total + by severity** (aggregated from `ArchitectureRunDetail.Results[*].Findings`), **LLM calls for the run** (counted from `IAgentExecutionTraceRepository.GetByRunIdAsync` ï¿½ sibling of the cardinality-safe `archlucid_llm_calls_per_run` histogram), **audit row count for the run** (`IAuditRepository.GetFilteredAsync` filtered on `RunId`, capped to 500 with a "lower bound" marker when truncated), and a **decision-trace excerpt** for the top-severity finding via `IFindingEvidenceChainService`. Every computed line is stamped **"demo tenant ï¿½ replace before publishing"** when the run matches `ContosoRetailDemoIdentifiers.IsDemoRunId(...)` *or* the `RequestId` starts with the multi-tenant `req-contoso-demo-` prefix that `ContosoRetailDemoIds.ForTenant(...)` mints ï¿½ see new helper methods on [`ContosoRetailDemoIdentifiers`](../ArchLucid.Application/Bootstrap/ContosoRetailDemoIdentifiers.cs). Failures in the audit / trace / evidence-chain queries are warning-logged and gracefully degrade (the row still renders so the report shape is stable across runs). DI: `IPilotRunDeltaComputer` registered scoped in [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs). Tests: new [`PilotRunDeltaComputerTests`](../ArchLucid.Application.Tests/Pilots/PilotRunDeltaComputerTests.cs) (committed-and-scoped happy path, demo-RunId match, multi-tenant request-prefix match, audit cap ? truncation flag, audit-throw ? 0 + warning, no-findings ? null evidence chain, non-GUID RunId skips audit query, evidence-chain throw ? null chain pointers, manifest-missing ? null wall-clock, null-arg guard) and matcher tests in [`ContosoRetailDemoIdentifiersMatcherTests`](../ArchLucid.Application.Tests/Bootstrap/ContosoRetailDemoIdentifiersMatcherTests.cs); existing [`FirstValueReportBuilderTests`](../ArchLucid.Application.Tests/Pilots/FirstValueReportBuilderTests.cs), [`FirstValueReportPdfBuilderTests`](../ArchLucid.Application.Tests/Pilots/FirstValueReportPdfBuilderTests.cs), and [`SponsorOnePagerPdfBuilderTests`](../ArchLucid.Application.Tests/Pilots/SponsorOnePagerPdfBuilderTests.cs) updated to mock the computer and assert the dual-banner placement on demo runs + PDF magic-byte rendering. OpenAPI snapshot unchanged (no endpoint shape moved). Docs: [`PILOT_ROI_MODEL.md`](library/PILOT_ROI_MODEL.md) ï¿½4.1 marks each metric **Computed by ArchLucid? Yes/No** and ï¿½4.1.1 adds a non-negotiable **"How to read the demo numbers"** redaction callout.

**Time-to-value ï¿½ in-product CTA + sponsor PDF one-shot:** New non-modal post-commit banner **`EmailRunToSponsorBanner`** ([`archlucid-ui/src/components/EmailRunToSponsorBanner.tsx`](../archlucid-ui/src/components/EmailRunToSponsorBanner.tsx)) on the architect workspace run-detail page (`archlucid-ui/src/app/(operator)/reviews/[runId]/page.tsx`) renders only when the run has a golden manifest and exposes a single primary action ï¿½ **"Email this run to your sponsor"** ï¿½ that downloads a sponsor-shareable PDF projection of the canonical first-value-report Markdown for that run. New endpoint **`POST /v1/pilots/runs/{runId}/first-value-report.pdf`** ([`PilotsController.PostFirstValueReportPdf`](../ArchLucid.Api/Controllers/Pilots/PilotsController.cs)) returns `application/pdf`; auth is `ReadAuthority` (mirrors the Markdown sibling ï¿½ no Standard-tier gate at the click site so the CTA stays one-shot). Backed by new **`FirstValueReportPdfBuilder`** + thin Markdown?PDF renderer ([`MarkdownPdfRenderer`](../ArchLucid.Application/Pilots/MarkdownPdfRenderer.cs)) under `ArchLucid.Application/Pilots/` ï¿½ the builder calls the existing `FirstValueReportBuilder` so PDF output cannot drift from the Markdown response (single source of truth). DI: registered as scoped in [`ServiceCollectionExtensions.ApplicationPipeline.cs`](../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs). Tests: [`ArchLucid.Application.Tests/Pilots/FirstValueReportPdfBuilderTests.cs`](../ArchLucid.Application.Tests/Pilots/FirstValueReportPdfBuilderTests.cs) (null-on-missing, PDF magic bytes on committed run, argument validation), [`ArchLucid.Api.Tests/FirstValueReportPdfEndpointTests.cs`](../ArchLucid.Api.Tests/FirstValueReportPdfEndpointTests.cs) (404 on unknown run + asserts no Standard-tier 402 silently appears), Vitest [`EmailRunToSponsorBanner.test.tsx`](../archlucid-ui/src/components/EmailRunToSponsorBanner.test.tsx) (CTA copy, click-to-download, error rendering, busy state), and live Playwright [`live-api-email-run-to-sponsor.spec.ts`](../archlucid-ui/e2e/live-api-email-run-to-sponsor.spec.ts) (full create?execute?commit cycle, click banner, verify `%PDF` magic bytes on the downloaded blob). New API helper **`downloadFirstValueReportPdf(runId)`** in `archlucid-ui/src/lib/api.ts`. OpenAPI v1 snapshot refreshed (`ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`). Docs: [`API_CONTRACTS.md`](library/API_CONTRACTS.md) Pilots table, [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) cross-link in the "Related" preface.

**Adoption friction ï¿½ `archlucid try` + dev-container:** New CLI command **`archlucid try`** ([`ArchLucid.Cli/Commands/TryCommand.cs`](../ArchLucid.Cli/Commands/TryCommand.cs)) takes a brand-new evaluator from `git clone` to a committed manifest + saved sponsor Markdown report in a single command. Composes existing primitives (no rewrites): **`PilotUpCommand`** for the Docker stack + readiness probe, **`POST /v1/demo/seed`** for idempotent demo data, **`ArchLucidApiClient.CreateRunAsync` / `ExecuteAsync` / `GetRunAsync` / `CommitRunAsync` / `SeedFakeResultsAsync`** for the sample-run lifecycle, and **`GET /v1/pilots/runs/{runId}/first-value-report`** for the Markdown. Polls `GET /v1/architecture/run/{runId}` until `ReadyForCommit` (or falls back to `seed-fake-results` after `--commit-deadline`); opens the saved Markdown and the operator-UI `/runs/{runId}` URL in the default handlers (suppressed by **`--no-open`** for containers / SSH / CI). New devcontainer (**`.devcontainer/devcontainer.json`** + **`.devcontainer/docker-compose.devcontainer.yml`**) layers .NET 10 SDK + Node 22 on the host docker socket (Docker-outside-of-Docker) and runs **`archlucid try --no-open`** on `postCreateCommand`. Tests: [`ArchLucid.Cli.Tests/TryCommandTests.cs`](../ArchLucid.Cli.Tests/TryCommandTests.cs) covers argument parsing (defaults, `--no-open`, custom URLs, invalid flags / values), missing-Docker handling (no `docker-compose.yml` in any cwd ancestor ? `CliExitCode.UsageError`), and the readiness-poll timeout (returns the last observed status when the deadline elapses). **`completions`** word lists and the no-arg usage banner updated. Docs: [`README.md`](../REPOSITORY_README.md) "First-time evaluator" row, [`docs/FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md) skip-ahead callout, [`docs/CLI_USAGE.md`](library/CLI_USAGE.md) new **`archlucid try`** section.

**Marketability ï¿½ proof page:** New architect workspace route **`/why-archlucid`** (Core Pilot tier, no `requiredAuthority`) renders a read-only "Why ArchLucid" proof page for sponsor demos. Wires three live read endpoints against the seeded **Contoso Retail Modernization** demo tenant: **`GET /v1/pilots/why-archlucid-snapshot`** (new ï¿½ process-wide `ArchLucidInstrumentation` counters + canonical demo run id + scoped audit row count), **`GET /v1/pilots/runs/{runId}/first-value-report`** (sponsor Markdown), and **`GET /v1/explain/runs/{runId}/aggregate`** (sponsor aggregate explanation + citations). Backed by a new **`MeterListenerCounterSnapshotProvider`** singleton (`System.Diagnostics.Metrics.MeterListener` over `archlucid_runs_created_total` and `archlucid_findings_produced_total`) and **`WhyArchLucidSnapshotService`** application service. Vitest snapshot test (`archlucid-ui/src/app/(operator)/why-archlucid/page.test.tsx`) and live Playwright spec (`archlucid-ui/e2e/live-api-why-archlucid.spec.ts`) exercise the route end-to-end after a best-effort `POST /v1/demo/seed`. Cross-links added to [`go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md) ï¿½4 and [`go-to-market/PRODUCT_DATASHEET.md`](go-to-market/PRODUCT_DATASHEET.md) Get-started step 4. **`EXECUTIVE_SPONSOR_BRIEF.md`** intentionally unchanged (sponsor brief stays canonical).

**Quality / docs hygiene:** Moved superseded **2026-04-20** quality assessments and the improvement-decision log to [`archive/quality/`](archive/quality/) with inbound link rewrites (`CHANGELOG`, ADR 0021, Cursor prompt companions, `PENDING_QUESTIONS`, CI comments). See [`archive/quality/README.md`](archive/quality/README.md).

**Explainability / pilots:** `GET /v1/architecture/run/{runId}/findings/{findingId}/evidence-chain` (read-only pointers) + `FindingEvidenceChainService` tests. **`POST /v1/pilots/runs/{runId}/sponsor-one-pager`** (Standard tier) + `SponsorOnePagerPdfBuilder` + CLI `archlucid sponsor-one-pager <runId> [--save]`. ADR 0021 Phase 1 internal inventory + `DualPipelineInternalReadPathTests`. Stryker PR planner includes **Api** in the full matrix; refresh script help text aligned to all targets.

**GTM / reference customers:** New placeholder case study [`go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md`](go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md) and table row **First paying tenant (PLG)** in [`go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md) (ship-trial-first path). PLG note in same README.

**Trust / security:** [`go-to-market/trust-center.md`](go-to-market/trust-center.md) ï¿½ SOC 2 row set to **Deferred**; penetration section distinguishes **owner self-assessment** vs third-party; links [`security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`](security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md). [`security/pen-test-summaries/README.md`](security/pen-test-summaries/README.md) indexes the owner self-assessment.

**Operations:** New [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) (resolved vs open decisions + six-prompt execution status). [`archive/quality/QUALITY_ASSESSMENT_2026_04_20_INDEPENDENT_64_60.md`](archive/quality/QUALITY_ASSESSMENT_2026_04_20_INDEPENDENT_64_60.md) ï¿½9 points to it.

---

## 2026-04-20 ï¿½ Quality prompts execution (ADR 0021 Phase 1, tier 402 gates, pilot scorecard, SaaS profile)

**Architecture / ADR:** [ADR 0021](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) moved to **Accepted**; added `IUnifiedGoldenManifestReader` + `UnifiedGoldenManifestReader`; `ManifestsController` now consumes the unified reader. Navigator + scope updates: [`CANONICAL_PIPELINE.md`](library/CANONICAL_PIPELINE.md), [`V1_SCOPE.md`](library/V1_SCOPE.md), new runbook [`runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`](runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md).

**API / commercial:** `[RequiresCommercialTenantTier]` + `CommercialTenantTierFilter` return **402** when `dbo.Tenants.Tier` is below **Standard** (governance / policy packs / manifest advanced reads) or **Enterprise** (audit CSV export). New problem type `ProblemTypes.PackagingTierInsufficient`. **`POST /v1/pilots/scorecard`** + `PilotScorecardBuilder`.

**Hosting:** `ArchLucid.Api/appsettings.SaaS.json` (optional chained in `Program.cs` ï¿½ API keys **off** in-repo until Key Vault/env supplies keys); `infra/apply-saas.ps1`; docs: [`FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md), [`REFERENCE_SAAS_STACK_ORDER.md`](library/REFERENCE_SAAS_STACK_ORDER.md), [`PRODUCT_PACKAGING.md`](library/PRODUCT_PACKAGING.md).

**Architect workspace:** Marketing pricing section supports optional `teamStripeCheckoutUrl` from `pricing.json` (see [`go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md)); new-run wizard shows a **3-phase macro stepper** over the existing seven steps.

**CLI:** `archlucid doctor` prints a **SaaS checklist** table (`DoctorCommand`).

**Security / trust (self-assessment):** [`security/SOC2_SELF_ASSESSMENT_2026.md`](security/SOC2_SELF_ASSESSMENT_2026.md), [`security/COMPLIANCE_MATRIX.md`](security/COMPLIANCE_MATRIX.md), [`security/pen-test-summaries/2026-Q2-SOW.md`](security/pen-test-summaries/2026-Q2-SOW.md), [`security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md`](security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) (placeholder); [`trust-center.md`](go-to-market/trust-center.md) + [`SOC2_ROADMAP.md`](go-to-market/SOC2_ROADMAP.md) cross-links.

**CI / scripts:** Clearer stderr copy in [`scripts/ci/check_reference_customer_status.py`](../scripts/ci/check_reference_customer_status.py); [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) ï¿½5.4 documents **auto-flip** (no manual YAML edit). OpenAPI snapshot refreshed.

**Tests:** `DualPipelineRegistrationDisciplineTests` asserts unified reader registration (scoped `IUnifiedGoldenManifestReader` resolved via `CreateScope()`).

---

## 2026-04-20 ï¿½ Six quality improvements (pilot CLI, first-value report, GitHub compare action, persistence proposal, pen-test folder, reference row)

**CLI:** Added `archlucid pilot up` (`ArchLucid.Cli/Commands/PilotUpCommand.cs`) ï¿½ Docker Compose **full-stack** + **`docker-compose.demo.yml`** (simulator, demo seed on startup) with readiness polling on `http://127.0.0.1:5000/health/ready`. Added `archlucid first-value-report <runId> [--save]` calling **`GET /v1/pilots/runs/{runId}/first-value-report`**. **`CompletionsCommand`** word lists updated.

**API:** New **`PilotsController`** + **`FirstValueReportBuilder`** (Markdown sponsor summary). DI registration in **`ServiceCollectionExtensions.ApplicationPipeline.cs`**. OpenAPI snapshot refreshed (`ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`).

**Docs / GTM:** Second reference-customer row (`DESIGN_PARTNER_NEXT`) + case study placeholder; reference README notes **CI auto-flip** for Published rows. **`docs/integrations/GITHUB_ACTION_MANIFEST_DELTA.md`**, **`docs/PROJECT_CONSOLIDATION_PROPOSAL_PERSISTENCE.md`**, **`docs/security/pen-test-summaries/*`**, **`docs/API_CONTRACTS.md`** (Pilots section), **`docs/go-to-market/trust-center.md`**, **`SECURITY.md`** (PGP TODO). **`README.md`**, **`docs/CLI_USAGE.md`**, **`docs/FIRST_30_MINUTES.md`**.

**Integrations:** Composite GitHub Action under **`integrations/github-action-manifest-delta/`** plus **`.github/workflows/example-manifest-delta.yml`** (`workflow_dispatch`).

**Tests:** `ArchLucid.Application.Tests/Pilots/FirstValueReportBuilderTests.cs`, `ArchLucid.Cli.Tests/PilotUpCommandTests.cs`.

---

## 2026-04-20 ï¿½ Doc scope header enforcement (Quality Assessment Improvement 2d)

**Docs / CI:** Prepended a machine-generated `> **Scope:** ...` line to **300** active Markdown files under `docs/` (excluding `docs/archive/`), using the first ATX heading in each file when available. Added [`scripts/ci/backfill_doc_scope_headers.py`](../scripts/ci/backfill_doc_scope_headers.py) (idempotent one-shot back-fill). [`scripts/ci/check_doc_scope_header.py`](../scripts/ci/check_doc_scope_header.py) is now **merge-blocking** in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (runs after `check_doc_links.py`). Added [`scripts/ci/test_backfill_doc_scope_headers.py`](../scripts/ci/test_backfill_doc_scope_headers.py) and extended the existing Doc scope header unit-test step to run it.

> **Design-session logs:** The full incremental prompt records live in
> `docs/archive/CHANGE_SET_55R_SUMMARY.md` through `CHANGE_SET_59R.md`.
> Read those when you need exact delivery scope or deferred-backlog decisions.

---

## 2026-04-20 ï¿½ Tenant-only RLS expansion, first-session metric, LLM prompt redaction, `/onboard` wizard (Quality Assessment follow-up)

**Database (DbUp):** **`096_RlsTenantIdOnlyTables.sql`** introduces **`rls.archiforge_tenant_predicate(@TenantId)`** and adds **FILTER + BLOCK** predicates on **`dbo.SentEmails`**, **`dbo.TenantLifecycleTransitions`**, and **`dbo.TenantTrialSeatOccupants`** under existing **`rls.ArchiforgeTenantScope`**. **`097_TenantOnboardingState.sql`** adds **`dbo.TenantOnboardingState`** (`FirstSessionCompletedUtc`) with the same tenant-only predicate when objects exist. Rollbacks: **`Rollback/R096_RlsTenantIdOnlyTables.sql`**, **`Rollback/R097_TenantOnboardingState.sql`**. Consolidated parity: **`ArchLucid.Persistence/Scripts/ArchLucid.sql`**.

**Application:** **`IFirstSessionLifecycleHook`** / **`SqlFirstSessionLifecycleHook`** records the first successful golden-manifest commit per tenant via **`ITenantOnboardingStateRepository`**; emits **`archlucid_first_session_completed_total`**. **`LlmPromptRedactionOptions`** + **`IPromptRedactor`** redact prompts on **`LlmCompletionAccountingClient`** and trace/blob paths in **`AgentExecutionTraceRecorder`**; counters **`archlucid_llm_prompt_redactions_total`**, **`archlucid_llm_prompt_redaction_skipped_total`**. Production-like hosts log a warning when redaction is disabled (**`LlmPromptRedactionProductionWarningPostConfigure`**).

**UI:** Operator route **`/onboard`** (Core Pilot nav) ï¿½ four-step first-session wizard using existing architecture API helpers.

**Tests:** **`ArchLucid.Core.Tests/Llm/Redaction/PromptRedactorTests.cs`**. **`archlucid-ui`** unit test **`OnboardWizardClient.test.tsx`**. **`InMemoryStorageProviderRegistrar`** now registers **`NoOpFirstSessionLifecycleHook`** instead of SQL onboarding types (fixes **`ISqlConnectionFactory`** validation failures in **`ArchLucid.Api.Tests`** / **`WebApplicationFactory`** hosts). **`StorageProviderRegistrationParityTests`** allowlists **`ITenantOnboardingStateRepository`** as SQL-only.

**Docs / trust:** Updated **`docs/SQL_SCRIPTS.md`**, **`docs/security/MULTI_TENANT_RLS.md`**, **`docs/security/RLS_RISK_ACCEPTANCE.md`**, **`docs/runbooks/LLM_PROMPT_REDACTION.md`**, **`docs/runbooks/README.md`**, **`docs/OBSERVABILITY.md`**, **`docs/ONBOARDING_WIZARD.md`**, **`docs/go-to-market/trust-center.md`**, **`docs/security/SYSTEM_THREAT_MODEL.md`**, **`docs/AGENT_TRACE_FORENSICS.md`**, **`docs/ARCHITECTURE_INDEX.md`**, **`SECURITY.md`**, pen-test templates **`docs/security/PEN_TEST_SOW_TEMPLATE.md`** and **`docs/security/PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md`**. **`docs/COVERAGE_GAP_ANALYSIS.md`** ï¿½ local merged Cobertura snapshot (merged line **72.95%**, **`ArchLucid.Api`** **60.79%**) with CI caveats.

---

## 2026-04-20 ï¿½ Marketplace `ChangePlan` / `ChangeQuantity` GA + Stryker target for `ArchLucid.Api` (Quality Assessment 2026-04-20 ï¿½ Improvement 4)

**Changed (default behavior):** [`ArchLucid.Api/appsettings.json`](../ArchLucid.Api/appsettings.json) and [`ArchLucid.Api/appsettings.Production.json`](../ArchLucid.Api/appsettings.Production.json) now ship with `Billing:AzureMarketplace:GaEnabled=true`. Marketplace `ChangePlan` and `ChangeQuantity` webhooks are mutating in production by default; both reach the `Processed` terminal state and call the existing `sp_Billing_ChangePlan` / `sp_Billing_ChangeQuantity` stored procedures. The previous `AcknowledgedNoOp` short-circuit is **not** removed ï¿½ it is intentionally preserved as the supported zero-deploy rollback path.

**Added (rollback runbook):** [`docs/runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md`](runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md) ï¿½ operator runbook for flipping `Billing:AzureMarketplace:GaEnabled` back to `false` via Azure App Configuration or environment variables (no redeploy). Includes "First 5 minutes" copy-paste commands (Kusto, PromQL), reconciliation steps for tier and seat drift, and explicit guidance on when re-enabling GA is safe. Registered in [`docs/runbooks/README.md`](runbooks/README.md) at `P2` and cross-linked from [`docs/ARCHITECTURE_INDEX.md`](ARCHITECTURE_INDEX.md).

**Added (mutation testing target):** [`stryker-config.api.json`](../stryker-config.api.json) extends Stryker.NET coverage to the `ArchLucid.Api` assembly, with HTML / JSON / progress reporters and `thresholds = { high: 70, low: 55, break: 55 }`. Baseline `Api: 55.0` written to [`scripts/ci/stryker-baselines.json`](../scripts/ci/stryker-baselines.json); the `Api` target is added to [`scripts/ci/refresh_stryker_baselines.py`](../scripts/ci/refresh_stryker_baselines.py) and to the weekly matrix in [`.github/workflows/stryker-scheduled.yml`](../.github/workflows/stryker-scheduled.yml). Initial thresholds are intentionally lower than the **70** used by older modules because HTTP wiring code (controllers, middleware, problem-details mapping) has higher mutant density than assertion-rich domain code; the ratchet sequence to bring it to **70 / 70** is documented in [`docs/MUTATION_TESTING_STRYKER.md`](library/MUTATION_TESTING_STRYKER.md) under "API target (advisory ratchet)". Also fixed a latent inconsistency: `PersistenceCoordination` was already in `stryker-baselines.json` but missing from `refresh_stryker_baselines.py`'s `STRYKER_TARGETS` list ï¿½ both files now agree.

**Documentation:** [`docs/BILLING.md`](library/BILLING.md), [`docs/AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md), [`docs/MUTATION_TESTING_STRYKER.md`](library/MUTATION_TESTING_STRYKER.md), [`docs/COVERAGE_GAP_ANALYSIS.md`](COVERAGE_GAP_ANALYSIS.md), and [`docs/ARCHITECTURE_INDEX.md`](ARCHITECTURE_INDEX.md) all updated in the same commit. The Improvement 4 prompt's per-package line-coverage uplift target (= 79 % on `ArchLucid.Api`) remains **open**; a later session added a **local** merged Cobertura snapshot to `docs/COVERAGE_GAP_ANALYSIS.md` (authoritative numbers still come from the green **`.NET: full regression (SQL)`** CI artifact). Auditability artifacts (`docs/AUDIT_COVERAGE_MATRIX.md`, `audit-core-const-count` anchor) are intentionally **not** edited; no audit constants changed.

**Operational impact:** Marketplace customers on the GA path now see real plan / quantity mutations within seconds. Operators with prior deferred-mode test scaffolding (`BillingMarketplaceWebhookDeferredApiFactory`) keep working because the in-memory factory explicitly sets `GaEnabled=false` per test; the production default flip does not affect those tests.

---

## 2026-04-20 ï¿½ Reference-customers scaffolding + discount-stack work-down (Quality Assessment 2026-04-20 ï¿½ Improvement 1)

**Added:** [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md) ï¿½ single source of truth for **real, publishable** reference-customer assets, distinct from the existing fictional [`REFERENCE_NARRATIVE_TEMPLATE.md`](go-to-market/REFERENCE_NARRATIVE_TEMPLATE.md). Documents the `Placeholder ? Drafting ? Customer review ? Published` lifecycle. Seeded with a single `EXAMPLE_DESIGN_PARTNER` placeholder row to keep the table renderable.

**Added:** [`docs/go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md`](go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md) ï¿½ case-study scaffold built from the existing [`REFERENCE_NARRATIVE_TEMPLATE.md`](go-to-market/REFERENCE_NARRATIVE_TEMPLATE.md) structure, with explicit `<<...>>` placeholders so a sales engineer can one-shot the substitution from a single deal-close email. Includes a "publish-cleanup" checklist that strips the internal-only sections.

**Added:** [`docs/go-to-market/PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) **ï¿½ 5.4 ï¿½ Discount-stack work-down** (inserted as 5.4 because ï¿½ 5.3 already exists as the *Re-rate plan*). ï¿½ 5.4 is an operational tracker ï¿½ owner / target close date / evidence link / re-rate trigger ï¿½ for each of the three discount lines from ï¿½ 5.1 (`-25%` trust, `-15%` reference, `-10%` self-serve). The locked-prices fenced block in ï¿½ 5.2 is **unchanged**; this section is project-management overlay only.

**Added:** [`scripts/ci/check_reference_customer_status.py`](../scripts/ci/check_reference_customer_status.py) ï¿½ Python CI guard that parses the reference-customer table and exits non-zero when zero rows have `Status: Published`. Wired into `.github/workflows/ci.yml` with `continue-on-error: true` (non-blocking warning) until the first real customer publishes. Removing that line is the single switch that makes the guard merge-blocking and triggers the pricing review described in ï¿½ 5.3 / ï¿½ 5.4. Companion unit tests in `scripts/ci/test_check_reference_customer_status.py` cover 21 cases including header parsing, status-token normalization, and main-function exit codes.

**Updated:** [`README.md`](../REPOSITORY_README.md) "Key documentation" table ï¿½ added a row for the new reference-customers index so the asset is discoverable from the repo root.

**Background.** Improvement 1 in [`archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md`](archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md) called for "land the first reference-customer asset". Without a real customer in hand we cannot legitimately publish a case study, so this PR ships the **scaffolding** (index, placeholder, lifecycle, CI guard, work-down tracker) that makes the day-of-publication a small, mechanical change rather than a doc-and-pricing scramble. The CI guard is intentionally non-blocking today so that build green is preserved; flipping it blocking is the explicit signal that the `-15%` reference discount is now eligible for re-rate.

---

## 2026-04-20 ï¿½ Test-script consolidation + concept vocabulary CI guard (Quality Assessment 2026-04-20 ï¿½ Improvement 6)

**Added:** Single canonical test driver ï¿½ [`test.ps1`](../scripts/test.ps1) (PowerShell) and [`test.cmd`](../scripts/test.cmd) (cmd trampoline) with a `-Tier <name>` parameter accepting `Core`, `FastCore`, `Integration`, `SqlServerIntegration`, `Full`, `UiUnit`, `UiSmoke`, `Slow`. `.\scripts\test.ps1 -ListTiers` enumerates all tiers and the underlying command. Replaces 8 separate per-tier script pairs (16 files) that drifted independently.

**Deprecated (kept as shims under `scripts/`):** `test-core.{cmd,ps1}`, `test-fast-core.{cmd,ps1}`, `test-integration.{cmd,ps1}`, `test-sqlserver-integration.{cmd,ps1}`, `test-full.{cmd,ps1}`, `test-slow.{cmd,ps1}`, `test-ui-unit.{cmd,ps1}`, `test-ui-smoke.{cmd,ps1}` are all now thin shims that delegate to the consolidated driver. They are scheduled for removal **after 2026-Q3**; new docs and runbooks should call `.\scripts\test.ps1 -Tier <name>` directly.

**Added:** [`docs/library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md) ï¿½ canonical concept vocabulary with explicit canonical-vs-rejected mappings, rationale, and a documented promotion gate (originally added as `docs/CONCEPTS.md` 2026-04-20; **relocated** to library and root file removed 2026-05-16). Distinct from [`docs/GLOSSARY.md`](library/GLOSSARY.md) (which defines terms) by focusing on adjudication between competing forms and the rules for when reviewers should push back.

**Added:** [`scripts/ci/check_concept_vocabulary.py`](../scripts/ci/check_concept_vocabulary.py) ï¿½ minimal, conservative CI guard implementing the rules from [`docs/library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md) ï¿½ 1.1. The initial enforced rule is the Microsoft Entra ID rename (see that file row 1 for the full canonical-vs-rejected mapping). Companion unit tests in `scripts/ci/test_check_concept_vocabulary.py` (12 cases, including word-boundary correctness so unrelated tokens such as `Azure ADX` are not flagged) wired into **`doc-markdown-links`**. Adding new rules requires the documented promotion gate in `docs/library/CONCEPT_VOCABULARY.md` ï¿½ 2.

**Updated:** [`docs/AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) ï¿½ fixed one stale legacy-tenant reference in the publishing checklist to use the canonical Microsoft Entra ID form so the new CI guard passes against live `docs/`.

**Updated:** [`docs/TEST_EXECUTION_MODEL.md`](library/TEST_EXECUTION_MODEL.md) ï¿½ added a "Canonical entry point" callout at the top documenting `.\scripts\test.ps1 -Tier <name>` and `.\scripts\test.cmd <name>`, and rewrote the optional pre-PR sequence to use the consolidated driver.

**Background.** Improvement 6 in [`archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md`](archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md) called for "collapse `test-*.cmd/.ps1` proliferation into a parameterized driver and add a CI vocabulary guard". The two changes ship together because both are documentation-discipline mechanisms that keep the project legible as it grows: one for runnable entry points, one for terminology. The shim layer preserves backward compatibility with every existing runbook reference, runbook screenshot, and external link while pushing all *new* writing toward the consolidated form.

---

## 2026-04-20 ï¿½ Workspace-root cleanup + dual-pipeline strangler hardening (Quality Assessment 2026-04-20 ï¿½ Improvement 3)

**Removed:** Empty legacy `ArchiForge.*` workspace-root directories (28 of them, build-artifact-only, never tracked by git) deleted as workspace-cleanup follow-up to the ArchLucid rename initiative (Phase 8; history in this file and **[V1_DEFERRED.md](library/V1_DEFERRED.md)** ï¿½3). A blocking CI guard (`scripts/ci/check_no_legacy_archiforge_dirs.py` + unittest) later prevented reintroduction; that guard was **retired 2026-04-25** (see changelog section above) while **`archiforge`** string scans remain. Background guidance: **[Navigation.mdc](../.cursor/rules/Navigation.mdc)** (Product rename section).

**Added:** Audit-event-type collision regression suite ï¿½ `ArchLucid.Core.Tests/Audit/AuditEventTypes_DoNotCollideAcrossPipelinesTests.cs` pins the invariant from [`docs/AUDIT_COVERAGE_MATRIX.md`](library/AUDIT_COVERAGE_MATRIX.md) that `CoordinatorRun*` and authority `RunStarted` / `RunCompleted` constants stay distinct as the catalog grows. Four reflection-driven tests cover (1) coordinator-vs-authority value disjointness, (2) baseline-vs-top-level value disjointness, (3) catalog-wide value uniqueness, and (4) every `CoordinatorRun*` constant has either an authority counterpart or an explicit "coordinator-only" allow-list entry.

**Added:** DI-discipline regression ï¿½ `ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs` turns the [ADR 0010](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) "fully qualified at registration time" rule into a build-breaking guarantee (the duplicate-named `IGoldenManifestRepository` and `IDecisionTraceRepository` interface pairs across `ArchLucid.Persistence.Data.Repositories` and `ArchLucid.Decisioning.Interfaces` must not silently cross-wire).

**Added:** "Which path do I use?" decision tree at the top of [`docs/archive/dual-pipeline-navigator-superseded.md`](archive/dual-pipeline-navigator-superseded.md), plus a "Why we have not collapsed these" section linking the two governing ADRs.

**Added:** [ADR 0021 ï¿½ Coordinator pipeline strangler plan](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) (`Status: Proposed`). Implementation requires a separate PR after architecture review; see the ADR's own status note. ADR 0010 stays `Accepted` until ADR 0021 is `Accepted` *and* the strangler implementation has shipped.

**Background.** Improvement 3 in [`archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md`](archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_80_72.md) ï¿½ 3 originally called for "collapse dual pipelines + delete legacy `ArchiForge.*` folders in one explicit refactor". A repo scan showed (a) the folders were truly empty and trivially safe to delete, and (b) the dual-pipeline interface families are governed by an Accepted ADR (0010) that cannot be overruled in a single refactor PR without a superseding ADR. The work was therefore split into Phase A (folder cleanup + CI guard, this entry), Phase B (strangler hardening tests + sharpened navigator, also this entry), and Phase C (the actual interface collapse ï¿½ gated on ADR 0021 acceptance, deliberately deferred). See the rationale in [`docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_20_PART3.md`](archive/quality/2026-04-23-doc-depth-reorg/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_20_PART3.md).

---

## 2026-04-17 ï¿½ Order form + ROI model alignment (pricing freeze follow-on)

**Updated:** [docs/go-to-market/ORDER_FORM_TEMPLATE.md](go-to-market/ORDER_FORM_TEMPLATE.md) to replace placeholder pricing with links to [PRICING_PHILOSOPHY.md ï¿½5](go-to-market/PRICING_PHILOSOPHY.md). Added:
- Three concrete worked pricing examples: Team 3-seat, Professional 8-seat, Enterprise 50-seat / 3-workspace.
- Run overage line item section with a 150%-of-allowance worked example for Professional tier ($8/run overage; 50 overage runs = $400).
- Annual prepay addendum (Addendum A).
- Design partner agreement addendum (Addendum B): 50% off Professional list for 12 months, capped at 3 customers, in exchange for published case study + quarterly reference calls.

**Updated:** [docs/go-to-market/ROI_MODEL.md](go-to-market/ROI_MODEL.md). Added:
- ï¿½8: Subscription cost and payback analysis at locked Professional list price for 6-architect baseline. Full-list payback ï¿½ 2 months; design partner payback ï¿½ 1.5 months (6 weeks).
- ï¿½9: Three-year TCO comparison vs. LeanIX and Ardoq using publicly observed price ranges from COMPETITIVE_LANDSCAPE.md. Includes sensitivity analysis at 50% of benchmark savings (payback still < 4 months).
- Updated ï¿½10 (was ï¿½8) "How to present" to reference new sections.

---

## 2026-04-17 ï¿½ Pricing freeze (locked list prices 2026)

**Added:** Locked list prices in [docs/go-to-market/PRICING_PHILOSOPHY.md](go-to-market/PRICING_PHILOSOPHY.md) ï¿½5. Prices are effective 2026-04-17 and valid for 12 months unless a re-rate gate triggers an explicit product leadership review.

**Team:** $199 / workspace / month platform fee + $79 / architect / month (up to 5 seats), 20 runs/month included, $10/run overage, 2 months free on annual prepay.

**Professional:** $899 / workspace / month platform fee + $179 / architect / month (up to 20 seats), 100 runs/month included, $8/run overage, 2 months free on annual prepay.

**Enterprise:** $60,000ï¿½$250,000 / year; unlimited runs (2,000 run/mo fair-use soft cap); unlimited seats and workspaces; custom policy packs, retention, SLA, and dedicated CSM.

**Pilot / design partner:** Self-serve trial free (14 days, 10 runs, 3 seats, sample seeded); guided pilot $15,000 flat (credited on conversion); design partner 50% off Pro list for 12 months (first 3 customers only, in exchange for published case study + quarterly reference call).

**Re-rate gates documented:** SOC 2 Type II (+25%), two named reference customers (+15%), self-serve billing loop in production (+10%). Existing customers price-locked for remainder of term + one renewal before any increase applies.

**CI guard added:** `scripts/ci/check_pricing_single_source.py` ï¿½ fails the build if any price figure appears outside the allowed source files (PRICING_PHILOSOPHY.md, ORDER_FORM_TEMPLATE.md, TRIAL_AND_SIGNUP.md, CHANGELOG.md). Wired into `doc-markdown-links` CI job.

**Cross-links:** POSITIONING.md, TRIAL_AND_SIGNUP.md, ROI_MODEL.md, ORDER_FORM_TEMPLATE.md, CUSTOMER_ONBOARDING_PLAYBOOK.md updated to link to the single price source rather than restating numbers.

---

## 2026-04-14 ï¿½ Configurable severity thresholds + approval SLA with escalation

**Added:** Configurable **`BlockCommitMinimumSeverity`** on `PolicyPackAssignment` (SQL **`057`**) ï¿½ allows blocking commits at any `FindingSeverity` level, not just Critical. When null with `BlockCommitOnCritical=true`, behavior is unchanged.

**Added:** **Warning-only mode** via `ArchLucid:Governance:WarnOnlySeverities` ï¿½ severities in this list trigger `GovernancePreCommitWarned` audit event but allow commit to proceed. Enables phased enforcement rollout.

**Added:** **Approval SLA** via `ArchLucid:Governance:ApprovalSlaHours` ï¿½ new approval requests receive `SlaDeadlineUtc`. **`ApprovalSlaMonitor`** detects breaches, emits `GovernanceApprovalSlaBreached` audit events, and sends HMAC-signed webhook escalation notifications. SQL **`058`** adds `SlaDeadlineUtc` and `SlaBreachNotifiedUtc` to `GovernanceApprovalRequests`.

**Tests:** `PreCommitGovernanceGateTests` ï¿½ configurable severity threshold (block on Error, allow Warning-only, legacy Critical-only fallback, warn-only mode). `ApprovalSlaMonitorTests` ï¿½ SLA breach audit, before-deadline skip, already-notified skip, no-webhook audit-only, SLA-not-configured skip.

**Docs:** Updated `PRE_COMMIT_GOVERNANCE_GATE.md` (severity thresholds, warning mode, approval SLA sections). Updated `AUDIT_COVERAGE_MATRIX.md` (`GovernancePreCommitWarned`, `GovernanceApprovalSlaBreached` rows; count 73?75).

---

## 2026-04-13 ï¿½ Stryker enforcement tightening + pre-commit gate tests

**Tests:** **`ArchitectureRunServiceExecuteCommitTests`** ï¿½ commit path throws **`PreCommitGovernanceBlockedException`** when the gate blocks; happy path when allowed; gate skipped when disabled. **`ArchitectureRunCommitPipelineIntegrationTests`** ï¿½ real **`PreCommitGovernanceGate`** blocks commit without persisting manifest and emits **`GovernancePreCommitBlocked`** audit; allows commit when findings are non-critical. **`PreCommitGovernanceGateTests`** ï¿½ edge cases (unparseable run id, missing snapshot id, non-enforcing assignment, disabled assignment, missing snapshot row, multiple critical ids, assignment tie-break).

**Stryker:** Raised committed baselines **`62.0` ? `65.0`** in **`scripts/ci/stryker-baselines.json`** for all five matrix labels. Tightened scheduled workflow assert tolerance **`0.15` ? `0.10`** pp. Documented baseline ratchet policy in **`MUTATION_TESTING_STRYKER.md`**; noted baselines in **`TEST_STRUCTURE.md`**; added Tier **4c** row in **`TEST_EXECUTION_MODEL.md`**.

---

## 2026-04-12 ï¿½ Quality prompts batch (live E2E docs, k6, trace blobs, audit UI, pre-commit gate, Terraform runbook)

**Added:** Optional **pre-commit governance gate** (`ArchLucid:Governance:PreCommitGateEnabled`, `PolicyPackAssignment.BlockCommitOnCritical`, SQL **`054`**), **`#governance-pre-commit-blocked`** problem type, durable audit **`GovernancePreCommitBlocked`**.

**Added:** **Agent execution trace** full-text blob persistence behind **`AgentExecution:TraceStorage:PersistFullPrompts`** (async blob writes + **`PatchBlobStorageFieldsAsync`**), SQL **`053`**, contract fields on **`AgentExecutionTrace`**.

**Added:** CI job **Performance: k6 smoke (API baseline)** (`tests/load/smoke.js`, non-blocking) and docs **`PERFORMANCE_TESTING.md`**.

**Changed:** Operator **Audit** page ï¿½ **Clear filters** re-queries, **Export CSV**, summary line, helpers + Vitest; **`ComparisonSummaryPersisted`** audit matrix row; **`ExportsControllerCompareSummaryAuditTests`** usings fix.

**Docs:** **`AGENT_TRACE_FORENSICS.md`**, **`PRE_COMMIT_GOVERNANCE_GATE.md`**, **`TEST_STRUCTURE`** live E2E row, **`TEST_EXECUTION_MODEL`** k6/live rows, **`operator-shell`** audit section, Phase **7.5** Terraform runbook **`TERRAFORM_STATE_MV_PHASE_7_5.md`**, **`NEXT_REFACTORINGS`** backlog summary table.

---

## 2026-04-13 ï¿½ Governance drift trend, promotion ordering, pipeline timeout, RunId, docs, Schemathesis PR

**Added:** **`GET /v1/governance/compliance-drift-trend`** and **`ComplianceDriftTrendService`** (time-bucketed policy pack change log aggregates). Architect workspace **`ComplianceDriftChart`** on the governance dashboard (last 30 days, daily buckets).

**Changed:** Governance **promotions** and **approval requests** must follow **dev ? test ? prod** single steps (**`GovernanceEnvironmentOrder`**).

**Added:** **`AuthorityPipelineOptions`** (`AuthorityPipeline:PipelineTimeout`, default 5 minutes; **`TimeSpan.Zero`** disables). Authority orchestrator uses a linked cancellation source; timeouts roll back, log, and increment **`archlucid_authority_pipeline_timeouts_total`**.

**Added:** Strongly typed **`RunId`** (**`ArchLucid.Core.Identity`**) with **`System.Text.Json`** converter (incremental adoption; **`Guid`** remains the primary wire/storage shape until migrated).

**Docs:** **`DEGRADED_MODE.md`**; **`START_HERE.md`** reading order + documentation tiers + degraded-mode link; **`DATA_CONSISTENCY_MATRIX.md`** read-replica lag section; **`docs/archive/README.md`** and **`ARCHITECTURE_INDEX.md`** archive pointers; **`API_FUZZ_TESTING.md`** PR vs scheduled Schemathesis; **`UI_COMPONENTS.md`** **`ComplianceDriftChart`**.

**CI:** **`api-schemathesis-light`** job in **`ci.yml`** (Schemathesis **examples** phase only).

---

## 2026-04-12 ï¿½ LogSanitizer (CWE-117)

**Added:** **`LogSanitizer`** utility for CWE-117 log injection prevention. Applied to string-typed HTTP input in the global exception handler, **`RunsController`** (**`CreateRun`** **`RequestId`**), and **`GovernanceController`** (**`Promote`** **`RunId`**).

---

## 2026-04-12 ï¿½ Governance confirmations and run progress UI

**Added:** Confirmation dialogs for governance promote and activate actions via reusable **`ConfirmationDialog`** component.

**Added:** Real-time run progress tracker on run detail page ï¿½ polls pipeline stages (context, graph, findings, manifest) with progress bar and badges for in-progress runs. See **`docs/UI_COMPONENTS.md`**.

---

## 2026-04-12 ï¿½ Business KPI metrics and aggregate explanation caching

**Added:** Aggregate explanation caching via **`CachingRunExplanationSummaryService`** ï¿½ eliminates redundant LLM calls on repeated run-detail aggregate explanation views when **`HotPathCache`** is enabled (keyed by run id + **`ROWVERSION`**; TTL from **`HotPathCacheOptions`**).

**Added:** Business-level OpenTelemetry metrics ï¿½ **`archlucid_runs_created_total`**, **`archlucid_findings_produced_total`** (label **`severity`**), **`archlucid_llm_calls_per_run`** (histogram per agent batch), **`archlucid_explanation_cache_hits_total`** / **`archlucid_explanation_cache_misses_total`** (cache effectiveness; derive hit ratio in Prometheus/Grafana). See **`docs/OBSERVABILITY.md`** and recording rule **`archlucid:explanation_cache_hit_ratio`** in **`infra/prometheus/archlucid-slo-rules.yml`**.

---

## 2026-04-12 ï¿½ IFeatureFlags and LLM fallback client

Introduced **`IFeatureFlags`** abstraction for testable feature flag evaluation. Added **`FallbackAgentCompletionClient`** for automatic LLM model failover on **429** / **5xx**.

---

## 2026-04-12 ï¿½ Persisted run trace ID and CLI trace command

Persisted OpenTelemetry trace ID in **`dbo.Runs`** (Migration **052**). Added **`archlucid trace <runId>`** CLI command for post-hoc distributed trace lookup. Surfaced creation-time trace link in run detail UI.

---

## 2026-04-12 ï¿½ Stryker mutation baselines

Raised Stryker mutation score baselines from 62% to 70% across all five modules (Persistence, Application, AgentRuntime, Coordinator, Decisioning).

---

## 2026-04-12 ï¿½ Audit export and retention policy

Added audit export endpoint (`GET /v1/audit/export`) with CSV/JSON support and 90-day range limit. Created audit retention policy document (`docs/AUDIT_RETENTION_POLICY.md`). Database-enforced append-only on `dbo.AuditEvents` (Migration **051**).

---

## 2026-04-12 ï¿½ CI hardening

CI hardening: Simmy chaos tests now block PRs (burn-in complete). Per-package line coverage gate raised from 50% to 60%.

Added Schemathesis API fuzz testing as a scheduled CI workflow against the OpenAPI spec. Operator docs: `docs/API_FUZZ_TESTING.md`; execution model and test matrix updated for Tier 4 (ZAP + Schemathesis).

---

## 2026-04-12 ï¿½ Aggregate run explanation

Added aggregate run explanation endpoint (`/v1/explain/runs/{runId}/aggregate`) with theme summaries, risk posture, confidence score, and explanation provenance. Surfaced in run detail UI.

---

## Phase 7 ï¿½ ArchLucid rename (code-level)

**Area:** Rename / operator breaking changes  
**Summary:** Removed legacy **`ArchiForge*`** configuration keys, **`ARCHIFORGE_*`** / UI OIDC storage bridges, and renamed CLI manifest (`archlucid.json`), global tool command (`archlucid`), SQL DDL file (`ArchLucid.sql`), and dev Docker/compose defaults. **`com.archiforge.*` integration event type strings are no longer emitted or aliased** ï¿½ only canonical **`com.archlucid.*`** types apply. See **`BREAKING_CHANGES.md`** for migration steps. Committed Terraform uses **`archlucid`** resource labels; the APIM backend URL **variable** is **`archlucid_api_backend_url`**.

---

## 59R ï¿½ Learning-to-planning bridge

**Area:** Product learning / planning  
**Key deliverables:**

- `032_ProductLearningPlanningBridge.sql` (DbUp) + `ArchLucid.sql` parity ï¿½ SQL tables for improvement themes, plans, and junction links to runs/signals/artifacts.
- Contracts under `ArchLucid.Contracts/ProductLearning/Planning/`.
- `IProductLearningPlanningRepository`, Dapper + in-memory implementations, DI registration.
- Unit tests: `ProductLearningPlanningRepositoryTests`.
- Docs: `SQL_SCRIPTS.md`, `DATA_MODEL.md`, this file.

**2026-05-10 ï¿½ promoted to V1 (supersedes prior note that deterministic derivation + plan-draft builder were deferred):** Bounded **deterministic** theme derivation and **plan-draft materialization** from ranked pilot-feedback opportunities ï¿½ `IProductLearningPlanningDerivationService` / `ProductLearningPlanningDerivationService`, priority scoring in `ProductLearningOpportunityScoring`, **`POST /v1/learning/planning/materialize`** on [`LearningController.cs`](../ArchLucid.Api/Controllers/Advisory/LearningController.cs) (**ExecuteAuthority**; query `since`, `maxPlansToMaterialize`). Idempotent per theme key; links **pilot signals** only (no automatic architecture-run links). Still **no** autonomous mutation of prompts, agents, or governance from this path.

---

## 58R ï¿½ Product learning dashboard and improvement triage

**Area:** Operator tooling / product feedback  
**Key deliverables:**

- `ProductLearningPilotSignals` SQL table + Dapper and in-memory repositories.
- Aggregation services: `IProductLearningFeedbackAggregationService`, `IProductLearningImprovementOpportunityService`, `IProductLearningDashboardService`.
- HTTP API: `GET /v1/product-learning/summary`, `/improvement-opportunities`, `/artifact-outcome-trends`, `/triage-queue`, `/report` (Markdown/JSON).
- Architect workspace: **Pilot feedback** page (`/product-learning`), export links.
- Tests: aggregation, ranking, parser, API, report-builder (`ChangeSet=58R` / `ProductLearning` filter tags).
- Docs: `PRODUCT_LEARNING.md`; updated `PILOT_GUIDE.md`, `OPERATOR_QUICKSTART.md`, `README.md`.

**Constraints:** No autonomous adaptation; human-entered signals only; scoped to tenant/workspace/project.

---

## 57R ï¿½ Operator-journey E2E (Playwright)

**Area:** UI test harness  
**Key deliverables:**

- `e2e/fixtures/` ï¿½ typed JSON payloads aligned with all UI coercion helpers.
- `e2e/helpers/route-match.ts`, `register-operator-api-routes.ts`, `operator-journey.ts` ï¿½ centralised route dispatch and journey navigation.
- Specs: `smoke`, `compare-proxy-mock`, `run-manifest-journey`, `compare-journey`, `compare-stale-input-warning`, `manifest-empty-artifacts`.
- `e2e/mock-archlucid-api-server.ts` + `e2e/start-e2e-with-mock.ts` ï¿½ loopback HTTP mock on port 18765 for RSC pages; `playwright.config.ts` `webServer` updated.
- `tsx` devDependency for TS mock runner; `e2e/tsconfig.json` + `npm run typecheck:e2e`.
- `-RunPlaywright` flag added to `scripts/release-smoke.ps1` / `.cmd`.
- Docs: `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md` (section 8 rewritten).

---

## 56R ï¿½ Release-candidate hardening and pilot readiness

**Area:** Configuration, observability, packaging, operator docs  
**Key deliverables:**

- Fail-fast config validation (`ArchLucidConfigurationRules`) before DbUp; SQL connection required only when `StorageProvider=Sql`.
- `/health/live` (minimal) + `/health/ready` (DB, schema files, compliance pack, writable temp) + `/health` (all) with `DetailedHealthCheckResponseWriter` (enriched JSON including `version`, `commitSha`, `totalDurationMs`).
- Startup non-secret configuration snapshot log (toggle `Hosting:LogStartupConfigurationSummary`).
- `GET /version` endpoint (`VersionController`, `[AllowAnonymous]`): `application`, `informationalVersion`, `assemblyVersion`, `fileVersion`, `commitSha`, `runtimeFramework`, `environment`.
- `BuildProvenance` + `BuildInfoResponse` (Core): parses `CommitSha` from `+{sha}` suffix of informational version; CI stamps `SourceRevisionId=$(git rev-parse HEAD)`.
- API `ProblemSupportHints` (`extensions.supportHint`); CLI `CliOperatorHints` (`Next:` lines); UI proxy `502/503 supportHint`.
- `archlucid support-bundle` CLI command (folder + optional `--zip`): `README.txt`, `manifest.json` (v1.1 + `triageReadOrder`), `build.json`, `health.json`, `api-contract.json` (bounded OpenAPI probe), `config-summary.json`, `environment.json`, `workspace.json`, `references.json`, `logs.json`.
- Local scripts (`scripts/`): `build-release`, `package-release`, `run-readiness-check`, `release-smoke` (`.cmd` + `.ps1`); `scripts/OperatorDiagnostics.ps1` (structured triage output).
- Release handoff artifacts in `artifacts/release/`: `metadata.json` (schema 1.1), `release-manifest.json`, `checksums-sha256.txt`, `PACKAGE-HANDOFF.txt`.
- Docs added: `PILOT_GUIDE.md`, `OPERATOR_QUICKSTART.md`, `TROUBLESHOOTING.md`, `RELEASE_LOCAL.md`, `RELEASE_SMOKE.md`, `CLI_USAGE.md`.

---

## 55R ï¿½ Operator shell coherence

**Area:** UI shell  
**Key deliverables:**

- Shared navigation, breadcrumbs, and operator messaging patterns across home, runs, run/manifest detail, graph, compare, replay, and artifact review.
- Canonical manifest-scoped artifact URLs; `GET /runs/{runId}/artifacts/{artifactId}` resolves manifest then redirects.
- Compare page: sequential legacy-then-structured fetches; UI explains fetch order vs. on-page review order; optional AI explanation; stale-input warning when run IDs drift.
- Coercion/guard helpers for operator-facing JSON.
- Vitest smoke coverage: API wiring (list/descriptor/compare/explain), shell nav, key review components.

---

## How to add a changelog entry

1. Add a new `## <version> ï¿½ <title>` section **above** the previous one.
2. Use the subsections: **Area**, **Key deliverables**, and (optionally) **Intentionally deferred**.
3. Keep entries to a navigable summary; put fine-grained prompt records in a new `docs/archive/CHANGE_SET_<id>.md` file and link from here.
