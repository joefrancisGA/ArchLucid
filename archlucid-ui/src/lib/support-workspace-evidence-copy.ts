import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";

export const SUPPORT_WORKSPACE_CANONICAL_PATH = SETTINGS_SUPPORT_PATH;

export const SUPPORT_WORKSPACE_CLAIM_DISCIPLINE_HEADING = "What Support workspace is not";

export const SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE = "Where to go next";

export const SUPPORT_WORKSPACE_CLAIM_DISCIPLINE =
  "Support workspace is for administrator contact and guided troubleshooting — not a full audit export. Use Report problem for in-product errors.";

export const SUPPORT_WORKSPACE_SOURCES_INTRO =
  "Use these follow-ups when support intake needs structured defect reporting, symptom triage, or assurance cites.";


/** Operator Sources — no self-href to Support workspace. */
export const SUPPORT_WORKSPACE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Report a problem help", href: SUPPORT_REPORT_PROBLEM_HELP_HREF },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
  { label: "System health", href: "/administration/system-health" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
] as const;
