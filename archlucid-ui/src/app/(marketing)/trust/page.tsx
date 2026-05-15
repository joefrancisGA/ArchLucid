import type { Metadata } from "next";
import Link from "next/link";
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
        <a
          className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
          data-testid="trust-center-evidence-pack-download"
          download
          href="/v1/marketing/trust-center/evidence-pack.zip"
          rel="noopener"
        >
          Download public evidence summary (ZIP)
        </a>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          Public procurement-oriented bundle assembled from approved sources — not a customer-specific evidence pack. Use
          with your questionnaire process; coordinated disclosure for detailed summaries is arranged through{" "}
          <Link
            href="mailto:security@archlucid.net"
            className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
          >
            security@archlucid.net
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
