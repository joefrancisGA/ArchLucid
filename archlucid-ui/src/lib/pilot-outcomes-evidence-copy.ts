import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

export const PILOT_OUTCOMES_CANONICAL_PATH = SPONSOR_REPORT_PILOT_OUTCOMES_PATH;

export const PILOT_OUTCOMES_CLAIM_DISCIPLINE =
  "Pilot outcomes summarize finalized reviews, findings, and governance activity for the selected period — they are not a signed-review diligence Sources package by themselves, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Evidence trail or Trust Center before treating this report as procurement evidence.";

export const PILOT_OUTCOMES_SOURCES_INTRO =
  "Use these follow-ups when pilot outcomes need a fuller evidence trail, ROI methodology, or sponsor packaging.";

export type PilotOutcomesSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/insights/pilot-outcomes`. */
export const PILOT_OUTCOMES_SOURCES: readonly PilotOutcomesSourceLink[] = [
  { label: "Executive summary", href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH },
  { label: "ROI summary", href: SPONSOR_REPORT_ROI_SUMMARY_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
