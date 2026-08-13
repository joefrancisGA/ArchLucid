import {
  BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING,
  BUYER_EVIDENCE_TRAIL_LOAD_BUTTON,
} from "@/lib/buyer/buyer-polish-copy";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  EVIDENCE_TRAIL_HELP_CANONICAL_PATH,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTION,
} from "@/lib/evidence-trail-help-evidence-copy";
import {
  FINDING_EVIDENCE_GRAPH_DEFAULT_MODE,
  getFindingEvidenceGraphHref,
} from "@/lib/graph-finding-deep-links";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export const EVIDENCE_TRAIL_HELP_HERO_OVERVIEW =
  "Open the Evidence graph to trace how findings, artifacts, and governance decisions connect for a finalized architecture review.";

export const EVIDENCE_TRAIL_HELP_ACTION_PANEL_TITLE = "Open the Evidence graph";

export const EVIDENCE_TRAIL_HELP_SAMPLE_HONESTY =
  "The sample graph uses the illustrative Claims Intake review — Showing Claims Intake sample (not your workspace). It is not a review from your tenant.";

export const EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS = {
  openGraph: EVIDENCE_TRAIL_HELP_PRIMARY_ACTION,
  loadGraph: {
    label: BUYER_EVIDENCE_TRAIL_LOAD_BUTTON,
    href: EVIDENCE_GRAPH_PATH,
    testId: "help-evidence-trail-load-graph",
  },
  openSampleGraph: {
    label: AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
    href: getFindingEvidenceGraphHref(SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_PHI_FINDING_GRAPH_NODE_ID),
    testId: "help-evidence-trail-open-sample-graph",
  },
} as const;

export const EVIDENCE_TRAIL_HELP_FINDING_JUMP_TITLE = "Jump from a finding";

export const EVIDENCE_TRAIL_HELP_FINDING_JUMP_INTRO =
  "Use the finding evidence trace for inspectable lineage, then open the graph in Evidence provenance mode when you need the visual explorer.";

export const EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION = {
  label: "Explain in evidence trail",
  href: getFindingEvidenceTraceHref(SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID),
  testId: "help-evidence-trail-finding-trace-link",
} as const;

export const EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION = {
  label: BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING,
  href: getFindingEvidenceGraphHref(SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_PHI_FINDING_GRAPH_NODE_ID),
  mode: FINDING_EVIDENCE_GRAPH_DEFAULT_MODE,
  testId: "help-evidence-trail-finding-graph-link",
} as const;

export type EvidenceTrailHelpRelatedGuide = {
  readonly label: string;
  readonly href: string;
};

/** In-app related guides only — trimmed to three high-value follow-ups (TB-1362). */
export const EVIDENCE_TRAIL_HELP_RELATED_GUIDES: readonly EvidenceTrailHelpRelatedGuide[] = [
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Architecture reviews", href: inAppHelpHref("review-packages") },
  { label: "Findings", href: inAppHelpHref("findings") },
] as const;

export const EVIDENCE_TRAIL_HELP_CANONICAL_ROUTE_PATH = EVIDENCE_TRAIL_HELP_CANONICAL_PATH;
