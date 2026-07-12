import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingTrustCenterBuyerBody } from "@/components/marketing/MarketingTrustCenterBuyerBody";
import { TrustCenterFocusScroll } from "@/components/marketing/TrustCenterFocusScroll";
import { TrustCenterFaqJsonLd } from "@/components/TrustCenterFaqJsonLd";
import {
  parseTrustCenterLastReviewedUtc,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "ArchLucid security posture, assurance posture, questionnaires, contact paths, and evidence bundle — summarized for procurement and IT security reviewers.",
};

export default function MarketingTrustCenterPage(): ReactNode {
  let lastReviewedUtc: string | null = null;

  try {
    lastReviewedUtc = parseTrustCenterLastReviewedUtc(readTrustCenterMarkdown());
  } catch {
    lastReviewedUtc = null;
  }

  return (
    <MarketingPageShell variant="trust" data-testid="trust-center-page">
      <Suspense fallback={null}>
        <TrustCenterFocusScroll />
      </Suspense>
      <TrustCenterFaqJsonLd />
      <MarketingTrustCenterBuyerBody lastReviewedUtc={lastReviewedUtc} />
    </MarketingPageShell>
  );
}
