import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingSecurityTrustView } from "@/components/marketing/MarketingSecurityTrustView";
import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  parseTrustCenterLastReviewedUtc,
  readTrustCenterMarkdown,
} from "@/lib/trust-center-marketing";

export function generateMetadata(): Metadata {
  const productName = productLineDisplayName(resolveProductLineIdFromEnv());

  return {
    title: "Assurance status",
    description:
      `Assurance engagement metadata for ${productName} — public summaries, diligence-only materials, and planned cycles — with NDA handling for sensitive reports.`,
  };
}

export default function MarketingAssuranceStatusPage(): ReactNode {
  let lastReviewedUtc: string | null = null;

  try {
    lastReviewedUtc = parseTrustCenterLastReviewedUtc(readTrustCenterMarkdown());
  } catch {
    lastReviewedUtc = null;
  }

  return <MarketingSecurityTrustView lastReviewedUtc={lastReviewedUtc} />;
}
