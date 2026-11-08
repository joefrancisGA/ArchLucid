import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { securenowInternalDocHref } from "@/lib/product-line/securenow-internal-doc-href";

export const SECURENOW_SPONSOR_HOME_SECTION_HEADING = "For sponsors" as const;

export const SECURENOW_SPONSOR_HOME_SECTION_LEAD =
  "Internal readout preparation. Evidence must be reviewed and authorized before sponsor sharing. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SPONSOR_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/why-securenow#reviewer-pack",
    label: "Readout preparation",
    summary:
      "Review the evidence sequence, limitations, and owner decision before a sponsor briefing.",
  },
  {
    href: securenowInternalDocHref("EXECUTIVE_PACKET_FILL_GUIDE.md"),
    label: "Executive packet context",
    summary: "Map each packet field to an evidence owner. Leave customer outcomes blank.",
  },
  {
    href: "/administration/securenow-pilot-decision",
    label: "Pilot decision path",
    summary:
      "Prepare the human proceed, extend, or stop disposition with owners and follow-ups.",
  },
  {
    href: "/administration/securenow-pilot-decision#decision-cycle",
    label: "Decision cycle",
    summary: "Open the blank qualify-to-close log. Do not write a duration.",
  },
  {
    href: "/administration/securenow-investigation-effort",
    label: "Investigation effort",
    summary:
      "Record comparable minutes and read the send rule before a number leaves the room.",
  },
  {
    href: securenowInternalDocHref("SPONSOR_READOUT_OUTLINE.md"),
    label: "Readout outline",
    summary: "Stage 6 facilitation. Not an approved offer and not customer evidence.",
  },
];
