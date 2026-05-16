import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";

const faqItems: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: "How does ArchLucid isolate tenant data?",
    answer:
      "ArchLucid uses database-per-tenant SQL catalogs for the primary isolation boundary, with application-layer scope enforcement inside a tenant. Optional row-level security is available but not required for production controls.",
  },
  {
    question: "What is ArchLucid's SOC 2 posture?",
    answer:
      "ArchLucid publishes SOC 2 readiness control mapping under internal security ownership. This is a readiness artifact, not a CPA attestation report — see the Trust Center for current assurance materials.",
  },
  {
    question: "Does ArchLucid require access to my Azure subscription?",
    answer:
      "Hosted SaaS does not require a customer Azure subscription for trial or standard product use. Optional read-only export packages can enrich cost narratives when buyers choose to supply them.",
  },
];

/**
 * Compact FAQPage JSON-LD derived from Trust Center facts (TB-020 FAQ gate — no keyword stuffing).
 */
export function TrustCenterFaqJsonLd() {
  const origin = getSiteMetadataBaseUrl().origin.replace(/\/$/, "");
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: `${origin}/trust`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
