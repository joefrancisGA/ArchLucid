/** Claim-then-sources evidence strips for `/help/*` topics covering the architecture loop. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE,
  STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING,
  STRUCTURED_BRIEF_HELP_FOLLOW_UPS_TITLE,
  STRUCTURED_BRIEF_HELP_SOURCES,
  STRUCTURED_BRIEF_HELP_SOURCES_INTRO,
} from "@/lib/structured-brief-help-evidence-copy";
import { STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID } from "@/lib/structured-brief-help-guide-content";
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
import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

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
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function StructuredBriefHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-structured-brief"
      claim={STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE}
      claimHeading={STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID}
      sourcesTitle={STRUCTURED_BRIEF_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={STRUCTURED_BRIEF_HELP_SOURCES_INTRO}
      sources={STRUCTURED_BRIEF_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
