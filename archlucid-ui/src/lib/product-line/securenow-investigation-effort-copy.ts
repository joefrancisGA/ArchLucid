export const SECURENOW_INVESTIGATION_EFFORT_HEADING =
  "Investigation effort" as const;

export const SECURENOW_INVESTIGATION_EFFORT_LEAD =
  "Record comparable minutes in the pilot measurement log. Share a number only when the send rule passes. SecureNow beta remains NO_GO." as const;

export const SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL =
  "This page does not start a timer, calculate ROI, or copy a fee." as const;

export const SECURENOW_INVESTIGATION_EFFORT_NOTES = [
  {
    href: "docs/securenow/PILOT_MEASUREMENT_LOG.md",
    label: "Pilot measurement log",
  },
  {
    href: "docs/securenow/ROI_COST_INPUT.md",
    label: "Cost input",
  },
  {
    href: "docs/securenow/ROI_FIXTURE_WORKSHEET.md",
    label: "Fixture worksheet",
  },
  {
    href: "docs/securenow/ROI_SEND_RULE.md",
    label: "Send rule",
  },
] as const;
