import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  parsePrivacyPolicyLastReviewedUtc,
  readPrivacyPolicyMarkdown,
} from "@/lib/privacy-policy-marketing";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ArchLucid collects, uses, and protects personal information — GDPR and CCPA coverage.",
};

function stripLeadingHeaderForBody(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length && (lines[i]?.trim().length === 0 || lines[i]?.trimStart().startsWith(">")))
    i++;

  if (i < lines.length && lines[i]?.startsWith("# "))
    i++;

  while (i < lines.length && lines[i]?.trim().length === 0)
    i++;

  if (i < lines.length && /<!--\s*PRIVACY_POLICY_LAST_REVIEWED_UTC:/.test(lines[i] ?? ""))
    i++;

  while (i < lines.length && lines[i]?.trim().length === 0)
    i++;

  if (i < lines.length && lines[i]?.startsWith("**Effective date"))
    i++;

  while (i < lines.length && lines[i]?.trim().length === 0)
    i++;

  if (i < lines.length && lines[i]?.startsWith("**Last reviewed"))
    i++;

  while (i < lines.length && lines[i]?.trim().length === 0)
    i++;

  if (i < lines.length && lines[i]?.trim() === "---")
    i++;

  while (i < lines.length && lines[i]?.trim().length === 0)
    i++;

  return lines.slice(i).join("\n").trim();
}

export default function MarketingPrivacyPolicyPage(): ReactNode {
  let markdown: string;
  let lastReviewed: string | null = null;

  try {
    markdown = readPrivacyPolicyMarkdown();
    lastReviewed = parsePrivacyPolicyLastReviewedUtc(markdown);
  } catch {
    markdown = "";
  }

  const bodyMarkdown = markdown.length > 0 ? stripLeadingHeaderForBody(markdown) : "";

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10" tabIndex={-1}>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {lastReviewed
          ? `Last reviewed (UTC): ${lastReviewed}.`
          : "How ArchLucid handles personal information."}
      </p>
      <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
        This policy covers GDPR and CCPA. For operator-facing processing activity records, see the{" "}
        <Link
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
          href="/trust"
        >
          Trust Center
        </Link>
        . For data processing agreement terms, contact us at{" "}
        <a
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
          href="mailto:privacy@archlucid.net"
        >
          privacy@archlucid.net
        </a>
        .
      </p>

      {bodyMarkdown.length > 0 ? (
        <div className="mt-8">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={bodyMarkdown}
            tableCaption="ArchLucid privacy policy details"
          />
        </div>
      ) : (
        <PrivacyPolicyFallback />
      )}
    </main>
  );
}

function PrivacyPolicyFallback(): ReactNode {
  return (
    <div className="mt-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        The privacy policy content was not found at build time. Contact{" "}
        <a
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
          href="mailto:privacy@archlucid.net"
        >
          privacy@archlucid.net
        </a>{" "}
        for a copy.
      </p>
    </div>
  );
}
