import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance-route-paths";

export const REPORT_A_PROBLEM_HELP_CANONICAL_PATH = SUPPORT_REPORT_PROBLEM_HELP_HREF;

export const REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE =
  "This Report a problem guide orients architects on structured support intake and correlation identifiers — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Troubleshooting or Support when you need live triage or workspace support tools.";

export const REPORT_A_PROBLEM_HELP_SOURCES_INTRO =
  "Use these follow-ups when support intake vocabulary turns into symptom triage, admin support tools, or engineering diagnostics.";


/** Operator Sources — no self-href to `/help/report-a-problem`. */
export const REPORT_A_PROBLEM_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("developer-troubleshooting") },
  { label: "Support workspace", href: "/administration/support" },
  { label: "System health", href: "/administration/system-health" },
  { label: "Alerts", href: GOVERNANCE_ALERTS_PATH },
] as const;
