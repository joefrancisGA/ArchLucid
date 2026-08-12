import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURE_EXECUTIVE_DASHBOARD_CANONICAL_PATH = EXECUTIVE_DASHBOARD_HREF;

export const ARCHITECTURE_EXECUTIVE_DASHBOARD_CLAIM_DISCIPLINE =
  "Executive dashboard KPIs, trends, and sponsor exports summarize portfolio ROI and workspace health for the selected window — they are not a signed-review diligence Sources package. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const ARCHITECTURE_EXECUTIVE_DASHBOARD_SOURCES_INTRO =
  "Use these follow-ups when portfolio KPIs need architecture reviews, grounded Q&A, ROI methodology, or assurance cites.";


/** Operator Sources — no self-href to the executive dashboard. */
export const ARCHITECTURE_EXECUTIVE_DASHBOARD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Ask review questions", href: "/insights/ask-review-questions" },
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "Executive summary help", href: inAppHelpHref("executive-summary") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
