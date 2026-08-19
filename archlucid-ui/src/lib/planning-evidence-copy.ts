import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF } from "@/lib/planning-page-copy";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PLANNING_CLAIM_DISCIPLINE_HEADING = "What improvement planning is not";

export const PLANNING_CLAIM_DISCIPLINE =
  "Themes and plans aggregate captured review feedback in the current workspace scope — not a sealed-review diligence sources package. Open reviews, findings, or product learning before treating prioritized plans as executed commitments.";

export const PLANNING_SOURCES_INTRO =
  "Open reviews, findings, or product learning before treating prioritized plans as executed commitments.";


/** Operator Sources — no self-href to `/insights/improvement-planning`. */
export const PLANNING_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Architecture reviews",
    href: IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
    when: "Open governed architecture reviews when a plan needs execution or evidence trails",
  },
  {
    label: "Findings",
    href: GOVERNANCE_FINDINGS_PATH,
    when: "Triage live findings when a theme needs disposition follow-up",
  },
  {
    label: "Product learning",
    href: PRODUCT_LEARNING_PATH,
    when: "Capture pilot feedback signals before themes and plans are derived",
    adminOnly: true,
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation when architects are new to planning insights",
  },
  {
    label: "Pilot feedback help",
    href: inAppHelpHref("pilot-feedback"),
    when: "Read triage vocabulary before exporting pilot feedback summaries",
  },
] as const;

export { PLANNING_PATH as PLANNING_CANONICAL_PATH } from "@/lib/planning-route";
