import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_ACCELERATOR_INDEX_PATH } from "@/lib/product-line/securenow-accelerator-index-copy";
import {
  SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF,
  SECURENOW_SPECIALTY_TEMPLATES_HREF,
} from "@/lib/product-line/securenow-accelerator-template-links";

export const SECURENOW_ACCELERATOR_HOME_QUICK_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_ACCELERATOR_INDEX_PATH,
    label: "Open accelerator index",
    summary: "Full labeled catalog — pilot spine, readout pack, scenario walks, and collection setup.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_SPECIALTY_TEMPLATES_HREF,
    label: "Specialty review templates",
    summary: "Illustrative intake templates with read-only previews — not tenant capture.",
  },
  {
    href: SECURENOW_GOLDEN_SPONSOR_WALKTHROUGH_HREF,
    label: "Golden sponsor export walkthrough",
    summary: "Illustrative ArchLucid sample review path — separate from SecureNow capture.",
  },
  {
    href: "/administration/securenow-scenario-walks#fixture-path-03",
    label: "Vault secrets fixture (fixture-path-03)",
    summary: "Third synthetic walk plus sponsor disposition rehearsal on the public sample.",
  },
];
