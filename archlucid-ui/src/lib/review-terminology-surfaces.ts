import { BUYER_COPY_MODULE_PATHS } from "@/lib/buyer-copy/module-paths";

/**
 * High-traffic operator and sponsor-facing modules scanned by {@link ./review-terminology-guard.test.ts}.
 * API/DTO identifiers (`runId`, routes) are intentionally excluded — display copy only.
 */
export const REVIEW_TERMINOLOGY_HIGH_TRAFFIC_SURFACE_PATHS = [
  ...BUYER_COPY_MODULE_PATHS,
  "src/lib/contextual-help-content.ts",
  "src/lib/glossary-definitions.ts",
  "src/lib/repeat-review-activation.ts",
  "src/lib/api/architecture-request-create-guard.ts",
  "src/lib/roi-sponsor-scope-labels.ts",
  "src/components/CorePilotNextStepsCard.tsx",
  "src/components/GraphViewer.tsx",
  "src/components/ProvenanceNodeExplainCell.tsx",
  "src/components/runs/RunTableRowErrorBoundary.tsx",
  "src/components/runs/RunDetailRunGovernanceDispositionActions.tsx",
  "src/components/runs/RunDetailPageHeader.tsx",
  "src/components/CompareToBaselineCta.tsx",
  "src/components/wizard/ArchitectureRequestWizardHelpDrawer.tsx",
  "src/components/wizard/steps/AzureExtractorPackageZipField.tsx",
  "src/components/wizard/steps/WizardStepBaselineZip.tsx",
  "src/components/draft-intake/DraftIntakeReasoningPanel.tsx",
  "src/components/draft-intake/DraftIntakeWhatIfBranchPanel.tsx",
  "src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx",
  "src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView.tsx",
  "src/app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyRuleAuthoringWizard.tsx",
] as const;

/** Lowercase phrase fragments that must not appear as primary user-facing labels on scanned surfaces. */
export const REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS = [
  "run analysis",
  "committed runs",
  "previous runs",
  "approve run",
  "reject run",
  "run disposition",
  "for this run",
  "this run ",
  "the run in",
  "read runs",
  "create runs",
  "trial run limit",
  "prior run",
  "runs dashboard",
  "attach it to a run",
  "your run is configured",
  "first run wizard",
  "second run import",
  "load recent runs",
  "pick a recent run",
  "committed architecture run",
  "creating architecture run",
  "run-level summary",
  "this run row",
  "review run starts",
  "architecture run",
  "starter run",
  "separate run",
  "parent run",
  "run-create",
  "re-run on real",
  "run the assessment",
  "new run wizard",
] as const;

/** Lowercase phrase fragments banned on architect-workspace surfaces (Prompts 1–4 terminology sweep). */
export const REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS = [
  "operator path",
  "operator shell",
  "pilot operator",
  "tenant operator",
  "canonical guide",
  "canonical operator",
  "lane runbook",
] as const;

/** Lowercase phrase fragments that must not appear in nav, empty-state, or glossary persona copy. */
export const REVIEW_TERMINOLOGY_BANNED_OPERATOR_PERSONA_PATTERNS = [
  "operator follow-up",
  "operator defaults",
  "operator completes",
  "surface to operators",
  "operators pick",
  "operators submit",
  "operators approve",
  "operators run",
  "coordinate with an operator",
  "operators want",
] as const;

/** Lowercase phrase fragments banned on reviews hub and nav list surfaces. */
export const REVIEW_TERMINOLOGY_BANNED_REVIEW_ONLY_PACKAGE_LIST_PATTERNS = [
  "review package",
  "review packages",
  "architecture package",
  "architecture packages",
  "sample package",
  "open package",
  "create package",
  "finalize package",
  "package id",
  "package status",
  "package owner",
  "package history",
  "evidence package",
] as const;

/** Lowercase phrase fragments banned on all global buyer-facing surfaces (package terminology sweep). */
export const REVIEW_TERMINOLOGY_BANNED_PACKAGE_PATTERNS = [
  ...REVIEW_TERMINOLOGY_BANNED_REVIEW_ONLY_PACKAGE_LIST_PATTERNS,
  "architecture review package",
  "finalized review package",
  "completed review package",
  "sample review package",
  "governance evidence package",
  "executive briefing package",
  "proof package",
  "diligence package",
  "download review package",
  "view sample package",
  "no review package",
  "select a review package",
  "open review packages",
  "create review package",
  "finalize review package",
] as const;

export const REVIEW_TERMINOLOGY_BANNED_PRODUCT_VERSION_PATTERNS = [
  "v1 ga",
  "v1-ready",
  "v1 uses",
  "v1 includes",
  "v1 offers",
  "v1 ships",
  "v1 scope",
  "v1 assurance",
  "v1 control",
  "v1 contract",
  "v1 guarantee",
  "v1 blockers",
  "v1 evidence",
  "v1 scalability",
  "v1 posture",
  "v1 registry",
  "v1 surface",
  "v1 professional",
  "v1 pilots",
  "shipped v1",
  "for v1",
  "in v1",
  "not v1",
  "active v1",
  "default v1",
  "openapi contract (v1)",
] as const;

export const REVIEW_TERMINOLOGY_NAV_EMPTY_GLOSSARY_SURFACE_PATHS = [
  "src/lib/empty-state-presets.ts",
  "src/lib/enterprise-compact-empty-state-presets.ts",
  "src/lib/governance/governance-workflow-empty-guidance.ts",
  "src/lib/glossary-definitions.ts",
  "src/lib/layer-guidance.ts",
  "src/lib/nav-disclosure-copy.ts",
] as const;

/** Nav caption and reviews hub modules scanned for retired package list nouns. */
export const REVIEW_TERMINOLOGY_ARCHITECTURE_PACKAGE_LIST_NOUN_SURFACE_PATHS = [
  "src/lib/pilot-nav-group-builder.ts",
  "src/app/(operator)/architecture/reviews/_sections/reviews-hub-copy.ts",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory.tsx",
  "src/app/(operator)/architecture/reviews/_sections/ReviewsHubHeaderActions.tsx",
] as const;

/**
 * Architect-workspace modules rewritten in Prompts 1–4 (help, shell chrome, nav/empty/glossary, home rail).
 * Scanned by {@link ./review-terminology-guard.test.ts} for {@link REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS}.
 */
export const REVIEW_TERMINOLOGY_ARCHITECT_WORKSPACE_SURFACE_PATHS = [
  "src/lib/contextual-help-content.ts",
  "src/lib/help/help-markdown-presentation.ts",
  "src/lib/help/help-topics.ts",
  "src/lib/product-documentation-registry.ts",
  "src/lib/vocabulary/persona-shell-vocabulary.ts",
  "src/components/shell/OperatorShellTopBar.tsx",
  "src/components/AuthPanel.tsx",
  "src/app/layout.tsx",
  "src/lib/empty-state-presets.ts",
  "src/lib/enterprise-compact-empty-state-presets.ts",
  "src/lib/governance/governance-workflow-empty-guidance.ts",
  "src/lib/glossary-definitions.ts",
  "src/lib/layer-guidance.ts",
  "src/lib/nav-disclosure-copy.ts",
  "src/lib/i18n.ts",
  "src/lib/first-pilot-operating-rail-copy.ts",
  "src/components/advisory/AdvisoryHubClient.tsx",
  "src/lib/core-pilot-first-review-copy.ts",
  "src/lib/operator/operator-co-architect-copy.ts",
] as const;

/** Lowercase phrase fragments that must not appear in buyer-facing UI copy (manifest terminology sweep). */
export const REVIEW_TERMINOLOGY_BANNED_MANIFEST_PATTERNS = [
  "manifest diff",
  "manifest comparison",
  "golden manifest",
  "signed manifest",
  "finalized manifest",
  "review manifest",
  "committed manifest",
  "manifest trace",
  "manifest summary",
  "manifest record",
  "manifest output",
  "manifest decision",
  "manifest finalized",
  "manifest promoted",
  "manifest not found",
  "open manifest",
  "manifest link",
  "manifest baseline",
  "manifest rollup",
  "manifest posture",
  "manifest pipeline",
  "manifest package",
  "manifests created",
  "time to manifest",
  "reviewed manifest",
  "architecture manifest",
] as const;

export const REVIEW_TERMINOLOGY_BUYER_SURFACE_PATHS = [
  "src/lib/first-pilot-buyer-copy.ts",
  "src/lib/first-pilot-operating-rail-copy.ts",
  "src/components/EmailRunToSponsorBanner.tsx",
  "src/app/(marketing)/get-started/page.tsx",
  "src/app/(marketing)/signup/page.tsx",
] as const;

/** Core Pilot first-hour surfaces — `/architecture/reviews/new`, review detail handoff, sponsor export, home strip. */
export const REVIEW_TERMINOLOGY_FIRST_HOUR_SURFACE_PATHS = [
  "src/lib/core-pilot-first-review-copy.ts",
  "src/lib/operator/operator-co-architect-copy.ts",
  "src/lib/contextual-help-content.ts",
  "src/lib/glossary-terms.ts",
  "src/lib/vocabulary/architecture-review-vocabulary.ts",
  "src/lib/vocabulary/governance-mode-vocabulary.ts",
  "src/lib/operator/operator-nav-labels.ts",
  "src/components/operator/OperatorFirstRunWorkflowPanel.tsx",
  "src/components/WelcomeBanner.tsx",
  "src/components/EmailRunToSponsorBanner.tsx",
  "src/components/CorePilotNextStepsCard.tsx",
  "src/components/CommitRunButton.tsx",
  "src/components/runs/RunAgentQualityWarningsPanel.tsx",
  "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
  "src/app/(operator)/architecture/reviews/new/QuickStartWizard.tsx",
  "src/app/(operator)/architecture/reviews/new/QuickReviewWizard.tsx",
  "src/app/(operator)/architecture/reviews/RunsListClient.tsx",
] as const;

/**
 * Review Package detail page modules (TB-617–TB-621 summary layer and section chrome).
 * Scanned by {@link ./review-terminology-guard.test.ts} for {@link REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS}.
 */
/** Golden-path modules scanned for residual eng jargon (TB-2131). */
export const REVIEW_TERMINOLOGY_GOLDEN_PATH_SURFACE_PATHS = [
  "src/lib/reviews-new-path-copy.ts",
  "src/lib/reviews-new-evidence-copy.ts",
  "src/lib/runs/run-detail-deliverables-copy.ts",
  "src/app/(operator)/architecture/reviews/_sections/reviews-hub-copy.ts",
  "src/lib/core-pilot-first-review-copy.ts",
  "src/lib/first-pilot-operating-rail-copy.ts",
  "src/lib/invite-reviewer-evidence-copy.ts",
  "src/lib/operator/operator-home-evidence-copy.ts",
  "src/components/operator-home/OperatorHomeGlossarySections.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPreFinalizedEmptyState.tsx",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewMoreWaysToStart.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/resolve-review-package-attention-line.ts",
] as const;

/** Lowercase phrase fragments banned on golden-path primary chrome (TB-2131). */
export const REVIEW_TERMINOLOGY_GOLDEN_PATH_BANNED_PATTERNS = [
  "guided intake",
  "first-pilot",
  "first pilot",
  "intake path",
  "captures intake",
  "evidence intake",
  "export artifacts",
  "review artifacts",
  "architecture artifacts",
  "download artifacts",
  "finalize artifacts",
  "artifacts, and exports",
  "artifacts & exports",
  "after commit",
  "this manifest",
  "aligned to this manifest",
] as const;

export const REVIEW_TERMINOLOGY_REVIEW_PACKAGE_DETAIL_SURFACE_PATHS = [
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageView.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/ReviewPackageSummaryHeader.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/ReviewPackagePrimaryAction.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/resolve-review-package-attention-line.ts",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailExecutiveSummaryCtaCard.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailGovernanceCta.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailCaptureEvidenceSection.tsx",
  "src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailExecutiveBottomLine.tsx",
  "src/components/runs/RunDetailOutcomeCards.tsx",
  "src/components/usability/ReviewPackagePlainSummary.tsx",
  "src/components/usability/ReviewPackageEvidenceDensityStrip.tsx",
  "src/components/quick-decision-summary/QuickDecisionSummary.tsx",
] as const;
