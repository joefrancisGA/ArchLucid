export const SECURENOW_INVESTIGATION_EFFORT_HEADING =
  "Investigation effort" as const;

export const SECURENOW_INVESTIGATION_EFFORT_LEAD =
  "Record comparable minutes in the pilot measurement log. Share a number only when the send rule passes. SecureNow beta remains NO_GO." as const;

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
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/PILOT_MEASUREMENT_LOG.md",
    label: "Pilot measurement log",
  },
  {
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_COST_INPUT.md",
    label: "Cost input",
  },
  {
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_FIXTURE_WORKSHEET.md",
    label: "Fixture worksheet",
  },
  {
    href: "https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/ROI_SEND_RULE.md",
    label: "Send rule",
  },
] as const;
