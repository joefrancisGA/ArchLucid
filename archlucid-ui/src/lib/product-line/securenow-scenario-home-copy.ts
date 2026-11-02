import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SCENARIO_HOME_SECTION_HEADING = "Fixture walks" as const;

export const SECURENOW_SCENARIO_HOME_SECTION_LEAD =
  "Pick one fixture. Do not present it as a customer outcome. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SCENARIO_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/administration/securenow-scenario-walks",
    label: "Five fixture walks",
    summary:
      "Honest labels for storage, collection gaps, advisory cuts, not-verified, and a unit fixture.",
  },
] as const;
