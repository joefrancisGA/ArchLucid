import { securenowInternalDocHref } from "@/lib/product-line/securenow-internal-doc-href";

export const SECURENOW_INVESTIGATION_EFFORT_HEADING =
  "Investigation effort" as const;

export const SECURENOW_INVESTIGATION_EFFORT_LEAD =
  "Enter your own investigation minutes first. ROI stays ROI not calculated until all five inputs are positive and not the fixture tuple. SecureNow beta remains NO_GO." as const;

export const SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL =
  "This page does not start a timer, calculate ROI, or copy a fee. This page is not a savings claim." as const;

export const SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_HEADING =
  "Synthetic worksheet walkthrough" as const;

export const SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_LEAD =
  "Training numbers only. They are not the published fixture tuple and are not stored for this workspace." as const;

export const SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS = {
  baselineHours: "4",
  afterHours: "3",
  annualInvestigations: "15",
  hourlyRate: "90",
  annualCost: "9000",
} as const;

export const SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_RESULT =
  "If these were your tenant inputs, gross annual analyst capacity value would be 1,350 and net annual value estimate would be −7,650. Your tenant ROI stays ROI not calculated until you enter five positive values above." as const;

export const SECURENOW_INVESTIGATION_EFFORT_NOTES = [
  {
    href: securenowInternalDocHref("PILOT_MEASUREMENT_LOG.md"),
    label: "Pilot measurement log",
  },
  {
    href: securenowInternalDocHref("ROI_COST_INPUT.md"),
    label: "Cost input",
  },
  {
    href: securenowInternalDocHref("ROI_FIXTURE_WORKSHEET.md"),
    label: "Fixture worksheet",
  },
  {
    href: securenowInternalDocHref("ROI_SEND_RULE.md"),
    label: "Send rule",
  },
] as const;
