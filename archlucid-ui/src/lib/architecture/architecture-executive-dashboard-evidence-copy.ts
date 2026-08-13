import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH = SPONSOR_DASHBOARD_HREF;

export const ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE =
  "Sponsor dashboard KPIs, trends, and sponsor exports summarize portfolio ROI and workspace health for the selected window — they are not a signed-review diligence Sources package. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO =
  "Use these follow-ups when portfolio KPIs need architecture reviews, grounded Q&A, ROI methodology, or assurance cites.";


/** Operator Sources — no self-href to the sponsor dashboard. */
export const ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Ask review questions", href: "/insights/ask-review-questions" },
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "Sponsor report help", href: inAppHelpHref("sponsor-report") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
