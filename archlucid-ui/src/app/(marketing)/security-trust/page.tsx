import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";

export const metadata: Metadata = {
  title: "Security & trust",
  description:
    "Assurance engagement metadata for ArchLucid — public summaries, diligence-only materials, and planned cycles — with NDA handling for sensitive reports.",
};

export default function MarketingSecurityTrustPage(): ReactNode {
  return <MarketingSecurityTrustView />;
}
