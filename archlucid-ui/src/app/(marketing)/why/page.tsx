import type { Metadata } from "next";

import { WhyArchlucidMarketingView } from "./WhyArchlucidMarketingView";
import { WHY_ARCHLUCID_COMPARISON_ROWS } from "@/marketing/why-archlucid-comparison";

export const metadata: Metadata = {
  title: "ArchLucid · Why ArchLucid",
  description:
    "How ArchLucid compares to common enterprise architecture tools — AI orchestration, governance, and audit evidence grounded in shipped V1 capabilities.",
  robots: { index: true, follow: true },
};

export default function WhyMarketingPage() {
  return <WhyArchlucidMarketingView rows={WHY_ARCHLUCID_COMPARISON_ROWS} />;
}
