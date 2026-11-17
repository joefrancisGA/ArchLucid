import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_RETURN_HOME_SECTION_HEADING = "Come back for" as const;

export const SECURENOW_RETURN_HOME_SECTION_LEAD =
  "Open one of these when the work is still unfinished. This is not a reminder and not a usage score. SecureNow beta remains NO_GO." as const;

export const SECURENOW_RETURN_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/security/remediation-instances",
    label: "Awaiting verification",
    summary: "A later capture has not yet confirmed or rejected the condition.",
  },
  {
    href: "/infrastructure/snapshots-drift",
    label: "Recent changes",
    summary: "A newer collection differs from the previous collection.",
  },
  {
    href: "/infrastructure/diagrams",
    label: "Open questions",
    summary: "A diagram question still needs a human answer.",
  },
  {
    href: "/administration/securenow-pilot-decision",
    label: "Sponsor follow-up",
    summary: "A named owner still owes an objection, a decision, or a review date.",
  },
];
