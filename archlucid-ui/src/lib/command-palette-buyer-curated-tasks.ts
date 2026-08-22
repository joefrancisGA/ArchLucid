import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import type { CuratedPaletteTask } from "@/lib/command-palette-curated-tasks";
import {
  getShowcaseCompareHref,
  getShowcaseSponsorHref,
  getShowcaseManifestHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

/**
 * Golden-path jumps for buyer-polished Ctrl+K — uses showcase URLs even when sidebar omits compare/governance/audit.
 */
export const BUYER_COMMAND_PALETTE_CURATED_TASKS: readonly CuratedPaletteTask[] = [
  {
    label: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
    href: getShowcaseSponsorHref(),
    searchValue: "sponsor report sponsor roi decision",
  },
  {
    label: "Review",
    href: `/architecture/reviews/${showcaseRunEnc}`,
    searchValue: "review claims intake modernization",
  },
  {
    label: SIGNED_MANIFEST_LABEL,
    href: getShowcaseManifestHref(),
    searchValue: "finalized review record package deliverables",
  },
  {
    label: "Policy pack basis",
    href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    searchValue: "policy pack policy guardrails healthcare claims",
  },
  {
    label: BUYER_SURFACE_VOCABULARY.evidenceGraphNav,
    href: `/insights/evidence-graph?runId=${showcaseRunEnc}`,
    searchValue: "evidence trail graph traceability",
  },
  {
    // Same page the sidebar and route title call "Approval queue" — retired wording stays searchable below.
    label: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,
    href: `/governance/approval-queue?runId=${showcaseRunEnc}`,
    searchValue: "resolve outcomes workflow sign-off",
  },
  {
    // Same page the sidebar and route title call "Findings" — retired wording stays searchable below.
    label: OPERATOR_NAV_LINK_LABELS.findings,
    href: "/governance/findings",
    searchValue: "findings risks dispositions review records findings queue",
  },
  {
    label: BUYER_COMPARE_OPEN_FULL_LINK_LABEL,
    href: getShowcaseCompareHref(),
    searchValue: "compare delta prior later review change",
  },
  {
    label: BUYER_SURFACE_VOCABULARY.auditTrail,
    href: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
    searchValue: "audit trail compliance chronology events",
  },
  {
    label: OPERATOR_NAV_LINK_LABELS.askReview,
    href: `/insights/ask-review-questions?runId=${showcaseRunEnc}`,
    searchValue: "ask question evidence qna",
  },
];
