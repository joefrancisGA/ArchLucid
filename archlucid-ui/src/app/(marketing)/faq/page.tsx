import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";

/** Anchors referenced from `/welcome` hero (#30 bulk upload, #31 demo workspaces). */
export const metadata: Metadata = {
  title: "FAQ · ArchLucid",
  description: `Short product answers for ArchLucid (${BRAND_CATEGORY}) evaluators — bulk upload limits and demo workspaces.`,
  robots: { index: true, follow: true },
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

export default function MarketingFaqPage(): ReactNode {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Product FAQ</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        Quick answers for visitors evaluating ArchLucid as an {BRAND_CATEGORY} platform.
      </p>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/welcome">
          Back to welcome
        </Link>
      </p>

      <section id="bulk-upload-30-files" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Bulk evidence upload — file limit</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          In the operator run view, bulk evidence upload accepts up to{" "}
          <strong className="font-semibold text-neutral-900 dark:text-neutral-100">30 files</strong> per batch (product
          cap in the upload UI). For larger corpora, split batches or use your integration path per workspace policy.
        </p>
      </section>

      <section id="demo-workspaces" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Demo workspaces</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Hosted trials and product-tour seeds provision a{" "}
          <strong className="font-semibold text-neutral-900 dark:text-neutral-100">synthetic workspace</strong> with
          fabricated architecture context (for example the Contoso-style product tour) so you can explore analysis,
          findings, and governance flows without connecting production systems. The public self-demo link lands on a
          committed synthetic review run for the same purpose — not customer data.
        </p>
      </section>
    </main>
  );
}
