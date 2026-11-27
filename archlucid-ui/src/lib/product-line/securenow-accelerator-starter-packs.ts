
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_ACCELERATOR_INDEX_PATH } from "@/lib/product-line/securenow-accelerator-index-copy";

export const SECURENOW_ACCELERATOR_STARTER_PACKS_HEADING = "Starter packs (fixture)" as const;

export const SECURENOW_ACCELERATOR_STARTER_PACKS: readonly { readonly persona: string; readonly rows: readonly SecureNowHomeDestinationRow[] }[] = [
  {
    persona: "SecOps",
    rows: [
      { href: "/administration/securenow-scenario-walks#public-storage-path", label: "Public storage path", summary: "First synthetic ranked path — not customer evidence." },
      { href: "/integrations/cloud-connections", label: "Collection setup", summary: "Azure connector and capture honesty." },
    ],
  },
  {
    persona: "GRC",
    rows: [
      { href: "/administration/securenow-reviewer-packet", label: "Reviewer packet", summary: "Procurement index without fee amounts." },
      { href: SECURENOW_ACCELERATOR_INDEX_PATH, label: "Accelerator index", summary: "Full labeled catalog." },
    ],
  },
  {
    persona: "IT admin",
    rows: [
      { href: "/administration/securenow-first-hour", label: "First hour", summary: "Collection-oriented checklist — Reader role still required." },
      { href: "/infrastructure/snapshots-drift", label: "Changes and drift", summary: "Compare captures after upload." },
    ],
  },
];
