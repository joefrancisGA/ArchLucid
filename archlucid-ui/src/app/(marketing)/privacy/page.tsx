import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { PrivacyPolicyPageClient } from "@/components/marketing/privacy-policy/PrivacyPolicyPageClient";
import { preparePrivacyPolicyContent } from "@/lib/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ArchLucid collects, uses, and protects personal information — GDPR and CCPA coverage.",
};

export default function MarketingPrivacyPolicyPage(): ReactNode {
  try {
    const content = preparePrivacyPolicyContent();

    return (
      <MarketingPageShell variant="reading" className="print:px-0">
        <PrivacyPolicyPageClient
          metadata={content.metadata}
          bodyMarkdown={content.bodyMarkdown}
          headings={content.headings}
          quickNavLinks={content.quickNavLinks}
          relatedDocuments={content.relatedDocuments}
        />
      </MarketingPageShell>
    );
  } catch {
    return (
      <MarketingPageShell variant="reading">
        <PrivacyPolicyPageClient
          metadata={{
            effectiveDate: null,
            lastReviewedUtc: null,
            documentVersion: "unversioned",
            sourcePath: "docs/go-to-market/PRIVACY_POLICY.md",
          }}
          bodyMarkdown=""
          headings={[]}
          quickNavLinks={[]}
          relatedDocuments={[]}
        />
      </MarketingPageShell>
    );
  }
}
