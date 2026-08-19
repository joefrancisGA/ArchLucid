import { buildMarketingSoftwareApplicationLd } from "@/lib/marketing-json-ld";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

/**
 * Injects JSON-LD for SoftwareApplication on marketing routes (TB-020, step 1 — no third-party analytics).
 */
export function MarketingJsonLd() {
  const ld = buildMarketingSoftwareApplicationLd(getSiteMetadataBaseUrl().origin);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
