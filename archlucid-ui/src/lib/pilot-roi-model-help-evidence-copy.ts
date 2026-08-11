import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PILOT_ROI_MODEL_HELP_CANONICAL_PATH = "/help/pilot-roi-model" as const;

export const PILOT_ROI_MODEL_HELP_CLAIM_DISCIPLINE =
  "This pilot ROI model guide is architect orientation for how sponsor ROI figures are labeled and sourced - it is not a signed-review diligence Sources package, financial reporting. Open Architecture scorecard, ROI summary, or Baseline when you need live packages or workspace numbers.";

export const PILOT_ROI_MODEL_HELP_SOURCES_INTRO =
  "Use these follow-ups when ROI methodology turns into scorecard numbers, baseline capture, or sponsor outcomes.";


/** Operator Sources - no self-href to `/help/pilot-roi-model`. */
export const PILOT_ROI_MODEL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Pilot outcomes", href: "/insights/pilot-outcomes" },
  { label: "Workspace baseline", href: "/administration/baseline" },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
  { label: "Executive summary help", href: inAppHelpHref("executive-summary") },
] as const;
