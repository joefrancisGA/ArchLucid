import type { Metadata } from "next";

import { WhyArchlucidMarketingView } from "./WhyArchlucidMarketingView";
import { BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import {
  MARKETING_WHY_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import { type WhyHardComparisonRow, WHY_COMPARISON_ROWS_SERIALIZED } from "@/lib/why-comparison";

const FRONT_DOOR_ROWS: readonly WhyHardComparisonRow[] = JSON.parse(
  WHY_COMPARISON_ROWS_SERIALIZED,
) as readonly WhyHardComparisonRow[];

export const metadata: Metadata = {
  title: "ArchLucid · Why ArchLucid",
  description: MARKETING_WHY_OG_DESCRIPTION,
  ...buildMarketingSocialMetadata("Why ArchLucid", MARKETING_WHY_OG_DESCRIPTION, "/why"),
  robots: { index: true, follow: true },
  // SEO/analytics: `BRAND_CATEGORY_LEGACY` from the seam (~30-day outbound resolve window).
  // Tracker: `docs/architecture/REBRAND_WORKSTREAM_2026_05_07.md`.
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

export default function WhyMarketingPage() {
  return <WhyArchlucidMarketingView frontDoorRows={FRONT_DOOR_ROWS} />;
}
