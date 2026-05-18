import type { CuratedPaletteTask } from "@/lib/command-palette-curated-tasks";
import {
  getShowcaseCompareHref,
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer-polish-copy";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

/**
 * Golden-path jumps for buyer-polished ⌘K — uses showcase URLs even when sidebar omits compare/governance/audit.
 */
export const BUYER_COMMAND_PALETTE_CURATED_TASKS: readonly CuratedPaletteTask[] = [
  {
    label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
    href: getShowcaseExecutiveHref(),
    searchValue: "executive summary sponsor roi decision",
  },
  {
    label: "Review package",
    href: `/reviews/${showcaseRunEnc}`,
    searchValue: "review package claims intake modernization",
  },
  {
    label: "Signed manifest",
    href: getShowcaseManifestHref(),
    searchValue: "signed manifest package deliverables",
  },
  {
    label: "Policy pack basis",
    href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    searchValue: "policy pack governance guardrails healthcare claims",
  },
  {
    label: BUYER_SURFACE_VOCABULARY.evidenceGraphNav,
    href: `/graph?runId=${showcaseRunEnc}`,
    searchValue: "evidence trail graph traceability",
  },
  {
    label: "Governance approval",
    href: `/governance?runId=${showcaseRunEnc}`,
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
    href: `/audit?runId=${showcaseRunEnc}`,
    searchValue: "audit trail compliance chronology events",
  },
  {
    label: "Ask this review",
    href: `/ask?runId=${showcaseRunEnc}`,
    searchValue: "ask question evidence qna",
  },
];
