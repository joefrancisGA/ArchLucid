import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { EXECUTIVE_SUMMARY_HELP_PATH } from "@/lib/executive-summary-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

export const EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH = EXECUTIVE_SUMMARY_HELP_PATH;

export const EXECUTIVE_SUMMARY_HELP_CLAIM_DISCIPLINE =
  "This executive summary guide is sponsor orientation for pilot proof and ROI framing - it is not a signed-review diligence Sources package, financial reporting, a CPA SOC 2 attestation, or a published third-party pen-test report. Open the live executive value report or dashboard when you need workspace numbers.";

export const EXECUTIVE_SUMMARY_HELP_SOURCES_INTRO =
  "Use these follow-ups when sponsor framing turns into live value reports, dashboards, or ROI methodology.";

export type ExecutiveSummaryHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/help/executive-summary`. */
export const EXECUTIVE_SUMMARY_HELP_SOURCES: readonly ExecutiveSummaryHelpSourceLink[] = [
  { label: "Executive value report", href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH },
  { label: "Executive dashboard", href: EXECUTIVE_DASHBOARD_HREF },
  { label: "Pilot outcomes", href: "/insights/pilot-outcomes" },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Pilot ROI model", href: inAppHelpHref("pilot-roi-model") },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
] as const;
