import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingTrustCenterBuyerBody } from "@/components/marketing/MarketingTrustCenterBuyerBody";
import { TrustCenterFocusScroll } from "@/components/marketing/TrustCenterFocusScroll";
import { TrustCenterFaqJsonLd } from "@/components/TrustCenterFaqJsonLd";
import { Button } from "@/components/ui/button";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <MarketingPageShell variant="reading">
      <Suspense fallback={null}>
        <TrustCenterFocusScroll />
      </Suspense>
      <TrustCenterFaqJsonLd />
      <MarketingTrustCenterBuyerBody lastReviewedUtc={lastReviewedUtc} />

      <div className="mt-10">
        <p className={`m-0 ${MARKETING_TYPOGRAPHY.meta}`}>
          <span className="font-medium text-al-text-primary">Public evidence summary</span>
          <span> · Version 2026.05</span>
          {lastReviewedUtc !== null ? (
            <>
              {" "}
              · Last reviewed {lastReviewedUtc}
            </>
          ) : null}
          <span> · Public-safe excerpt for questionnaires — suitable for initial diligence intake</span>
        </p>
        <Button asChild variant="primary" size="default" className="mt-2">
          <a
            data-testid="trust-center-evidence-pack-download"
            href="mailto:security@archlucid.net?subject=Public%20evidence%20summary%20request"
            rel="noopener"
          >
            Request evidence summary
          </a>
        </Button>
        <p className={`mt-2 ${MARKETING_TYPOGRAPHY.meta}`}>
          We send the current public-safe evidence summary by email to ensure buyers receive the latest approved version.
          Email security review to request it — we confirm diligence intake when needed.
        </p>
      </div>
    </MarketingPageShell>
  );
}
