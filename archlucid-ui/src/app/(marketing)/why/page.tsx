import type { Metadata } from "next";

import { WhyArchlucidMarketingView } from "./WhyArchlucidMarketingView";
import { type WhyHardComparisonRow, WHY_COMPARISON_ROWS_SERIALIZED } from "@/lib/why-comparison";

const FRONT_DOOR_ROWS: readonly WhyHardComparisonRow[] = JSON.parse(
  WHY_COMPARISON_ROWS_SERIALIZED,
) as readonly WhyHardComparisonRow[];

export const metadata: Metadata = {
  title: "ArchLucid · Why ArchLucid",
  description:
    "How ArchLucid compares to common enterprise architecture tools — AI orchestration, governance, and audit evidence grounded in shipped V1 capabilities.",
  robots: { index: true, follow: true },
};

export default function WhyMarketingPage() {
  return <WhyArchlucidMarketingView frontDoorRows={FRONT_DOOR_ROWS} />;
}
