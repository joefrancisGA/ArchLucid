import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_ACCELERATOR_INDEX_PATH = "/administration/securenow-accelerator-index" as const;

export const SECURENOW_ACCELERATOR_INDEX_HEADING = "Accelerator index (fixture)" as const;

export const SECURENOW_ACCELERATOR_INDEX_LEAD =
  "Labeled walks and review packs. Synthetic until you capture your subscription. SecureNow beta remains NO_GO." as const;

export const SECURENOW_ACCELERATOR_INDEX_GUARDRAIL =
  "None of these rows are customer accelerators or sealed outcomes." as const;

export const SECURENOW_ACCELERATOR_INDEX_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/administration/securenow-pilot-spine",
    label: "Pilot walkthrough (start here)",
    summary: "Six fixture beats with operator deep links.",
    recommendedFirst: true,
  },
  {
    href: "/administration/securenow-readout-pack",
    label: "Readout pack",
    summary: "Filled fixture anchors and draft remediation patterns.",
  },
  {
    href: "/administration/securenow-reviewer-packet",
    label: "Reviewer packet",
    summary: "Procurement index, SKU meters, and workspace checklist.",
  },
  {
    href: "/administration/securenow-scenario-walks",
    label: "Scenario walks",
    summary: "Additional fixture scenarios with product handoffs.",
  },
  {
    href: "/administration/securenow-first-hour",
    label: "First hour",
    summary: "Collection-oriented checklist — Reader role still required.",
  },
  {
    href: "/integrations/cloud-connections",
    label: "Collection setup",
    summary: "Cloud provider, subscription, and capture status.",
  },
];
