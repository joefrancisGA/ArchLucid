/** Claim-then-sources evidence strips for `/help/*` topics covering the review and architecture loop. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING,
  AUDIT_TRAIL_HELP_CLAIM_HEADING_ID,
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING,
  COMPARISON_REPLAY_HELP_CLAIM_HEADING_ID,
  COMPARISON_REPLAY_HELP_FOLLOW_UPS_TITLE,
  COMPARISON_REPLAY_HELP_SOURCES,
  COMPARISON_REPLAY_HELP_SOURCES_INTRO,
} from "@/lib/comparison-replay-help-evidence-copy";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_SOURCES,
  BASELINE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/baseline-settings-help-guide-content";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
  ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO,
} from "@/lib/architecture-drafts-help-evidence-copy";
import {
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_HEADING,
  PATH_CHOOSER_HELP_CLAIM_HEADING_ID,
  PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO,
  PATH_CHOOSER_HELP_SOURCES,
} from "@/lib/path-chooser-help-evidence-copy";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_HEADING_ID,
  DATA_HANDLING_TENANT_ISOLATION_HELP_FOLLOW_UPS_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_HEADING_ID,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID } from "@/lib/architecture-drafts-help-guide-content";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_HELP_SOURCES,
  EVIDENCE_GRAPH_HELP_SOURCES_INTRO,
} from "@/lib/evidence-graph-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID } from "@/lib/evidence-graph-help-guide-content";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID,
} from "@/lib/architecture-intelligence-help-guide-content";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO,
} from "@/lib/search-review-evidence-help-evidence-copy";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID,
} from "@/lib/search-review-evidence-help-guide-content";
import { SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID } from "@/lib/sponsor-dashboard-help-guide-content";
import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING,
  SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_DASHBOARD_HELP_SOURCES,
  SPONSOR_DASHBOARD_HELP_SOURCES_INTRO,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_HELP_CLAIM_HEADING_ID } from "@/lib/decision-register-help-guide-content";
import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE,
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE,
  IMPROVEMENT_PLANNING_HELP_SOURCES,
  IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO,
} from "@/lib/improvement-planning-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID } from "@/lib/improvement-planning-help-guide-content";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE,
  IMPACT_PREVIEW_HELP_SOURCES,
  IMPACT_PREVIEW_HELP_SOURCES_INTRO,
} from "@/lib/impact-preview-help-evidence-copy";
import { IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID } from "@/lib/impact-preview-help-guide-content";
import {
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE,
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_HELP_SOURCES,
  STANDARDS_RULES_HELP_SOURCES_INTRO,
} from "@/lib/standards-rules-help-evidence-copy";
import { STANDARDS_RULES_HELP_CLAIM_HEADING_ID } from "@/lib/standards-rules-help-guide-content";
import {
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_APPROVAL_HELP_CLAIM_HEADING_ID,
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";
import { FINDINGS_HELP_CLAIM_HEADING_ID } from "@/lib/findings/findings-help-guide-content";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE_HEADING,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE_HEADING,
  POLICY_PACKS_HELP_CLAIM_HEADING_ID,
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HELP_SOURCES,
  POLICY_PACKS_HELP_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE_HEADING,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
  REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO,
} from "@/lib/repeat-review-loop-help-evidence-copy";

export function AuditTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail-help"
      claimTestId="help-audit-trail-claim-discipline"
      claim={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}
      claimHeading={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUDIT_TRAIL_HELP_CLAIM_HEADING_ID}
      sourcesTitle={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sources={AUDIT_TRAIL_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ComparisonReplayHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="comparison-replay-help"
      claim={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE}
      claimHeading={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={COMPARISON_REPLAY_HELP_CLAIM_HEADING_ID}
      sourcesTitle={COMPARISON_REPLAY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPARISON_REPLAY_HELP_SOURCES_INTRO}
      sources={COMPARISON_REPLAY_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type RoiSummaryHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function RoiSummaryHelpEvidenceOrientationStrip(
  props: RoiSummaryHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-roi-summary"
      claim={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE}
      claimHeading={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ROI_SUMMARY_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sources={ROI_SUMMARY_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureScorecardHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-scorecard"
      claimTestId="help-architecture-scorecard-claim-discipline"
      claim={ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
      sourcesIntro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_SCORECARD_HELP_SOURCES}
      sourcesHeadingId="related-evidence-and-sources"
    />
  );
}

export type StandardsRulesHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function StandardsRulesHelpEvidenceOrientationStrip(
  props: StandardsRulesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sectionHeadingClass = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    OPERATOR_TYPOGRAPHY.sectionTitle,
    "m-0 scroll-mt-24",
  );

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-standards-rules"
      claim={STANDARDS_RULES_HELP_CLAIM_DISCIPLINE}
      claimHeading={STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={STANDARDS_RULES_HELP_CLAIM_HEADING_ID}
      sourcesTitle={STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={STANDARDS_RULES_HELP_SOURCES_INTRO}
      sources={STANDARDS_RULES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={sectionHeadingClass}
    />
  );
}

export type BaselineSettingsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function BaselineSettingsHelpEvidenceOrientationStrip(
  props: BaselineSettingsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-baseline-settings"
      claim={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_HELP_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function GovernanceApprovalHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-approval"
      claimTestId="help-governance-approval-claim-discipline"
      claim={GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_APPROVAL_HELP_CLAIM_HEADING_ID}
      sourcesTitle={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_APPROVAL_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function FindingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="findings-help"
      claimTestId="help-findings-claim-discipline"
      claim={FINDINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={FINDINGS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={FINDINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={FINDINGS_HELP_SOURCES_INTRO}
      sources={FINDINGS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PriorManifestRetrievalHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-prior-manifest-retrieval"
      claim={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE}
      claimHeading={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID}
      sourcesTitle={PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO}
      sources={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PolicyPacksHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-help"
      claim={POLICY_PACKS_HELP_CLAIM_DISCIPLINE}
      claimHeading={POLICY_PACKS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={POLICY_PACKS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={POLICY_PACKS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HELP_SOURCES_INTRO}
      sources={POLICY_PACKS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RepeatReviewLoopHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="repeat-review-loop-help"
      claim={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}
      claimHeading={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID}
      sourcesTitle={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO}
      sources={REPEAT_REVIEW_LOOP_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function EvidenceGraphHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-evidence-graph"
      claim={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE}
      claimHeading={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID}
      sourcesTitle={EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_HELP_SOURCES_INTRO}
      sources={EVIDENCE_GRAPH_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SearchReviewEvidenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-search-review-evidence"
      claim={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO}
      sources={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureIntelligenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-intelligence"
      claim={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type SponsorDashboardHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function SponsorDashboardHelpEvidenceOrientationStrip(
  props: SponsorDashboardHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-sponsor-dashboard"
      claim={SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE}
      claimHeading={SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPONSOR_DASHBOARD_HELP_SOURCES_INTRO}
      sources={SPONSOR_DASHBOARD_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function DataHandlingTenantIsolationHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-data-handling"
      claim={DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_HEADING_ID}
      sourcesTitle={DATA_HANDLING_TENANT_ISOLATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO}
      sources={DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES}
      sourcesHeadingId={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_HEADING_ID}
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function PathChooserHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-path-chooser"
      claim={PATH_CHOOSER_HELP_CLAIM_DISCIPLINE}
      claimHeading={PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PATH_CHOOSER_HELP_CLAIM_HEADING_ID}
      sourcesTitle={PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO}
      sources={PATH_CHOOSER_HELP_SOURCES}
      sourcesHeadingId="related-next-steps"
      sourcesLayout="wrap"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureDraftsHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-drafts"
      claim={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_DRAFTS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type DecisionRegisterHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function DecisionRegisterHelpEvidenceOrientationStrip(
  props: DecisionRegisterHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-decision-register"
      claim={DECISION_REGISTER_HELP_CLAIM_DISCIPLINE}
      claimHeading={DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={DECISION_REGISTER_HELP_CLAIM_HEADING_ID}
      sourcesTitle={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DECISION_REGISTER_HELP_SOURCES_INTRO}
      sources={DECISION_REGISTER_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type ImprovementPlanningHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ImprovementPlanningHelpEvidenceOrientationStrip(
  props: ImprovementPlanningHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-improvement-planning"
      claim={IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE}
      claimHeading={IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID}
      sourcesTitle={IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO}
      sources={IMPROVEMENT_PLANNING_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type ImpactPreviewHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ImpactPreviewHelpEvidenceOrientationStrip(
  props: ImpactPreviewHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-impact-preview"
      claim={IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE}
      claimHeading={IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID}
      sourcesTitle={IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPACT_PREVIEW_HELP_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function AdvisoryScansHelpEvidenceOrientationStrip(): React.JSX.Element {
  const sectionHeadingClass = cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0");

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-advisory-scans"
      sourcesTitle={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      sources={ADVISORY_SCANS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      headingClassName={sectionHeadingClass}
    />
  );
}
