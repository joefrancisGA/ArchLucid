import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_PILOT_SPINE_PATH } from "@/lib/product-line/securenow-pilot-spine-copy";

export const SECURENOW_PILOT_SPINE_HOME_SECTION_HEADING = "Pilot walkthrough" as const;

export const SECURENOW_PILOT_SPINE_HOME_SECTION_LEAD =
  "Six fixture beats with deep links into the product. Not customer evidence. SecureNow beta remains NO_GO." as const;

export const SECURENOW_PILOT_SPINE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_PILOT_SPINE_PATH,
    label: "Open the six-beat checklist",
    summary: "Scope, ranked path, cut point, engineer action, not verified, and disposition — synthetic fixture only.",
    recommendedFirst: true,
  },
  {
    href: "/securenow-sample",
    label: "Public sample (same beats)",
    summary: "Marketing-readable version. Each beat links into the operator walk when you are signed in.",
  },
  {
    href: "/administration/securenow-scenario-walks",
    label: "Additional fixture scenarios",
    summary: "Unit fixtures for collection gaps, cut-only views, and contributor-between-captures cases.",
  },
] as const;
