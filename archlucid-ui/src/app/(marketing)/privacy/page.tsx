import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { PrivacyPolicyPageClient } from "@/components/marketing/privacy-policy/PrivacyPolicyPageClient";
import type { PrivacyPolicyPreparedContent } from "@/lib/privacy-policy-content";
import { preparePrivacyPolicyContent } from "@/lib/privacy-policy-prepare.server";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ArchLucid collects, uses, and protects personal information — GDPR and CCPA coverage.",
};

function loadPrivacyPolicyContent(): PrivacyPolicyPreparedContent {
  try {
    return preparePrivacyPolicyContent();
  } catch {
    return {
      metadata: {
        effectiveDate: null,
        lastReviewedUtc: null,
        documentVersion: "unversioned",
        sourcePath: "docs/go-to-market/PRIVACY_POLICY.md",
      },
      bodyMarkdown: "",
      headings: [],
      quickNavLinks: [],
      relatedDocuments: [],
    };
  }
}

export default function MarketingPrivacyPolicyPage(): ReactNode {
  const content = loadPrivacyPolicyContent();

  return (
    <MarketingPageShell variant="trust" className="print:px-0">
      <PrivacyPolicyPageClient
        metadata={content.metadata}
        bodyMarkdown={content.bodyMarkdown}
        headings={content.headings}
        quickNavLinks={content.quickNavLinks}
        relatedDocuments={content.relatedDocuments}
      />
    </MarketingPageShell>
  );
}
