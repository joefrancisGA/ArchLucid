import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SPONSOR_HOME_SECTION_HEADING = "For sponsors" as const;

export const SECURENOW_SPONSOR_HOME_SECTION_LEAD =
  "Internal readout preparation. Evidence must be reviewed and authorized before sponsor sharing. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SPONSOR_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/why-securenow#reviewer-pack",
    label: "Readout preparation",
    summary: "Review the evidence sequence, limitations, and owner decision before a sponsor briefing.",
  },
  {
    href: "/why-securenow",
    label: "Executive packet context",
    summary: "Use the template and fill guide; customer outcomes remain uncollected until a real pilot.",
  },
  {
    href: "/administration/securenow-pilot-decision",
    label: "Pilot decision path",
    summary: "Prepare the human proceed, extend, or stop disposition with owners and follow-ups.",
  },
];
