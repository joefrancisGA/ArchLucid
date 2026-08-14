import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const REPO_ROOT = join(process.cwd());

/** Governance, review detail, and insights surfaces from TB-2172 — ghost migration landed in TB-2168. */
const GOVERNANCE_REVIEWS_INSIGHTS_BUTTON_PATHS = [
  "src/app/(operator)/governance/audit/_sections/AuditPageView.tsx",
  "src/components/AuditActiveFilterChips.tsx",
  "src/app/(operator)/governance/signed-records/_sections/SignedRecordsListClient.tsx",
  "src/components/governance/findings/GovernanceFindingsFilterBar.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageSponsorHandoffStrip.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx",
  "src/components/runs/RunFindingExplainabilityTable.tsx",
  "src/components/GenerateAdrFromRunModal.tsx",
  "src/components/reviews/technology-baseline/TechnologyBaselinePanel.tsx",
  "src/components/ReviewBoardWhitelabelConsultingExportButton.tsx",
  "src/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailBuyerTraceTable.tsx",
  "src/app/(operator)/insights/evidence-graph/_sections/GraphBuyerEvidenceTrailError.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskThreadHistoryPanel.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskCompareReviewsCollapsible.tsx",
  "src/components/runs/RunTraceViewerLink.tsx",
  "src/components/ReasoningTraceReadMore.tsx",
  "src/app/(operator)/internal/pricing-quote-aging/_sections/PricingQuoteAgingPageView.tsx",
  "src/app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient.tsx",
  "src/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqPageClient.tsx",
  "src/app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient.tsx",
] as const;

describe("governance / reviews / insights button visible-boundary guard (TB-2172)", () => {
  it.each(GOVERNANCE_REVIEWS_INSIGHTS_BUTTON_PATHS)(
    "does not emit ghost/link Button variants in %s",
    (relativePath) => {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      const violations = findButtonVisibleBoundaryViolations(source);

      expect(violations, `${relativePath}: use outline per UI_DESIGN_SYSTEM.md § TB-2168`).toEqual([]);
    },
  );
});
