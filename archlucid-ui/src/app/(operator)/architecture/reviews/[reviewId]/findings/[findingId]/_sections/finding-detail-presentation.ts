import type { ComponentProps } from "react";

import type { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/findings/finding-policy-evidence-citations";
import type { FindingJobView } from "@/lib/findings/finding-inspect-job-view";
import type { FindingDetailPageModel } from "./finding-detail-page-model";
import type { deriveFindingDecisionSummary } from "./finding-detail-route-display";

/** Derived presentation values for finding detail layout sections. */
export type FindingDetailPresentation = {
  readonly model: FindingDetailPageModel;
  readonly crossReviewPriorRunId: string | null;
  readonly crossReviewLaterRunId: string | null;
  readonly labels: {
    readonly severityLabel: string | null;
    readonly statusLabel: string | null;
    readonly categoryLabel: string | null;
    readonly impactedAreaLabel: string | null;
  } | null;
  readonly graphEvidenceHref: string | null;
  readonly severityHeadline: string;
  readonly severityRationale: string;
  readonly severityConstraintNote: string | null;
  readonly findingJobView: FindingJobView | null;
  readonly confidenceLevel: import("@/types/finding-inspect").FindingInspectPayload["confidenceLevel"];
  readonly evaluationScore: number | null;
  readonly policyProvenanceModel: FindingPolicyEvidenceCitationModel | null;
  readonly policyTraceExcerpt: string | null;
  readonly inspectHref: string;
  readonly reviewFindingsHref: string;
  readonly reviewPackageHref: string;
  readonly decisionSummary: ReturnType<typeof deriveFindingDecisionSummary>;
  readonly evidenceBasisSummary: string;
  readonly demoFillGaps: boolean;
  readonly whyThisMattersNarrative: string | null;
  readonly buyerStructuredActions: readonly string[];
  readonly buyerRecommendedActionParagraph: string | null;
  readonly sponsorPlainEnglishInput: ComponentProps<typeof SponsorPlainEnglishFindingPanel>["input"];
  readonly showBuyerPolishedBody: boolean;
  readonly buyerHeroSubtitle: string;
};
