import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const BASELINE_SETTINGS_CANONICAL_PATH = "/administration/baseline" as const;

export const BASELINE_SETTINGS_HELP_TOPIC_LABEL = "How baseline settings work";

export const BASELINE_SETTINGS_CLAIM_DISCIPLINE =
  "This Baseline settings page captures workspace ROI measurement anchors - it is not a signed-review diligence Sources package, financial reporting. Open Pilot ROI model help, Architecture scorecard, or Audit when you need methodology or live packages.";

export const BASELINE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when baseline anchors turn into ROI methodology, scorecard numbers, or sponsor outcomes.";


/** Operator Sources - no self-href to `/administration/baseline`. */
export const BASELINE_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pilot ROI measurement", href: inAppHelpHref("sponsor-report", "pilot-roi-measurement") },
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "Billing & plans", href: "/administration/billing" },
] as const;
