import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";
import {
  parseTrustCenterLastReviewedUtc,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";

export const metadata: Metadata = {
  title: "Assurance status",
  description:
    "Assurance engagement metadata for ArchLucid — public summaries, diligence-only materials, and planned cycles — with NDA handling for sensitive reports.",
};

export default function MarketingAssuranceStatusPage(): ReactNode {
  let lastReviewedUtc: string | null = null;

  try {
    lastReviewedUtc = parseTrustCenterLastReviewedUtc(readTrustCenterMarkdown());
  } catch {
    lastReviewedUtc = null;
  }

  return <MarketingSecurityTrustView lastReviewedUtc={lastReviewedUtc} />;
}
