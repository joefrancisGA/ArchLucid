export const SECURENOW_SCENARIO_WALKS_HEADING = "Fixture walks" as const;

export const SECURENOW_SCENARIO_WALKS_LEAD =
  "Six fixture walks. Not customer evidence. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SCENARIO_WALKS_GUARDRAIL =
  "A fixture walkthrough is not a customer outcome and not a starter proof pack." as const;

export type SecureNowScenarioWalk = {
  readonly id: string;
  readonly buyerJob: string;
  readonly honestLabel: string;
};

export const SECURENOW_SCENARIO_WALKS: readonly SecureNowScenarioWalk[] = [
  {
    id: "public-storage-path",
    buyerJob:
      "Show possible public network access on a storage account and how SecureNow ranks a path without claiming an exploit.",
    honestLabel: "Fixture, not an observed exploit.",
  },
  {
    id: "collection-gap",
    buyerJob:
      "Show that a missing or stale capture stays visible instead of implying full coverage.",
    honestLabel: "A gap is not a clean bill of health.",
  },
  {
    id: "advisory-cut-no-write",
    buyerJob:
      "Show an advisory cut point and that Azure change happens outside SecureNow.",
    honestLabel: "SecureNow does not change Azure.",
  },
  {
    id: "later-capture-not-verified",
    buyerJob:
      "Show a later capture that is missing an element and the honest not-verified outcome.",
    honestLabel: "NOT VERIFIED",
  },
  {
    id: "contributor-role-between-snapshots",
    buyerJob:
      "Show a unit fixture where removing a Contributor assignment removes probable privilege paths between snapshots.",
    honestLabel: "Unit fixture, not a sponsor demo.",
  },
  {
    id: "fixture-path-02",
    buyerJob:
      "Walk a second synthetic ranked path (fixture-path-02) with a different hop pair on the public sample page.",
    honestLabel: "Synthetic fixture. Not a customer result.",
  },
] as const;
