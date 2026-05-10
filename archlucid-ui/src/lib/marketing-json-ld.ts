/**
 * Honest SoftwareApplication JSON-LD for public marketing (TB-020).
 * Does not emit aggregateRating, reviewCount, or other ungrounded social proof.
 */
export function buildMarketingSoftwareApplicationLd(siteOrigin: string): Record<string, unknown> {
  const origin = siteOrigin.endsWith("/") ? siteOrigin.slice(0, -1) : siteOrigin;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ArchLucid",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "ArchLucid turns scattered architecture evidence into a prioritized, evidence-linked architecture review package — structured findings, traceability, and exportable outputs for enterprise architects and sponsors.",
    url: origin,
    publisher: {
      "@type": "Organization",
      name: "ArchLucid",
      url: origin,
    },
  };
}
