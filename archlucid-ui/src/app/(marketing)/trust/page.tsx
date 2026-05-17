import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingTrustCenterBuyerBody } from "@/components/marketing/MarketingTrustCenterBuyerBody";
import { TrustCenterFaqJsonLd } from "@/components/TrustCenterFaqJsonLd";
import {
  parseTrustCenterLastReviewedUtc,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";

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
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10" tabIndex={-1}>
      <TrustCenterFaqJsonLd />
      <MarketingTrustCenterBuyerBody lastReviewedUtc={lastReviewedUtc} />

      <div className="mt-10">
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Public evidence summary</span>
          <span> · Version 2026.05</span>
          {lastReviewedUtc !== null ? (
            <>
              {" "}
              · Last reviewed {lastReviewedUtc}
            </>
          ) : null}
          <span> · Public-safe excerpt for questionnaires (not a customer-specific evidence pack)</span>
        </p>
        <a
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
          data-testid="trust-center-evidence-pack-download"
          href="mailto:security@archlucid.net?subject=Public%20evidence%20summary%20request"
          rel="noopener"
        >
          Request evidence summary
        </a>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Email triggers procurement-safe routing — we send the current public bundle or confirm diligence intake (same
          materials summarized above).
        </p>
      </div>
    </main>
  );
}
