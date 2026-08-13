import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import type { CuratedPaletteTask } from "@/lib/command-palette-curated-tasks";
import {
  getShowcaseCompareHref,
  getShowcaseSponsorHref,
  getShowcaseManifestHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer/buyer-polish-copy";
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
    searchValue: "signed review record package deliverables",
  },
  {
    label: "Policy pack basis",
    href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    searchValue: "policy pack governance guardrails healthcare claims",
  },
  {
    label: BUYER_SURFACE_VOCABULARY.evidenceGraphNav,
    href: `/insights/evidence-graph?runId=${showcaseRunEnc}`,
    searchValue: "evidence trail graph traceability",
  },
  {
    label: "Governance approval",
    href: `/governance/approval-queue?runId=${showcaseRunEnc}`,
    searchValue: "governance approval workflow sign-off",
  },
  {
    label: "Review records and dispositions",
    href: "/governance/findings",
    searchValue: "findings risks dispositions governance queue",
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
    label: "Ask review questions",
    href: `/insights/ask-review-questions?runId=${showcaseRunEnc}`,
    searchValue: "ask question evidence qna",
  },
];
