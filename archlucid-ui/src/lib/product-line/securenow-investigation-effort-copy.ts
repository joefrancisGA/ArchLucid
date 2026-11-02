export const SECURENOW_INVESTIGATION_EFFORT_HEADING =
  "Investigation effort" as const;

export const SECURENOW_INVESTIGATION_EFFORT_LEAD =
  "Record comparable minutes in the pilot measurement log. Share a number only when the send rule passes. SecureNow beta remains NO_GO." as const;

export const SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL =
  "This page does not start a timer, calculate ROI, or copy a fee. This page is not a savings claim." as const;

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
