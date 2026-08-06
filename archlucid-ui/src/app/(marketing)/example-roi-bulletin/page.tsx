import type { Metadata } from "next";
import Link from "next/link";

import { ExampleRoiBulletinEvidenceOrientationStrip } from "@/components/marketing/ExampleRoiBulletinEvidenceOrientationStrip";
import {
  adminRoiBulletinPreviewHref,
  EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF,
  illustrativeQuarterLabelFromSample,
} from "@/lib/marketing/example-roi-bulletin-honesty";
import { loadSampleAggregateRoiBulletinSyntheticMarkdown } from "@/marketing/load-sample-aggregate-roi-bulletin-synthetic";

// TB-1520: noindex until buyer-facing CTA rewrite (TB-1518) lands — avoids SERP contributor-path leakage.
export const metadata: Metadata = {
  title: "ArchLucid · Example aggregate ROI bulletin (synthetic)",
  description:
    "Illustrative aggregate baseline bulletin shape for procurement — not production data; real publication gates on operator admin preview with minTenants.",
  robots: { index: false, follow: true },
};

export default function ExampleRoiBulletinMarketingPage() {
  const markdown = loadSampleAggregateRoiBulletinSyntheticMarkdown();
  const illustrativeQuarter = illustrativeQuarterLabelFromSample(markdown);
  const operatorAdminPreviewHref = adminRoiBulletinPreviewHref(illustrativeQuarter);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Example aggregate ROI bulletin (synthetic)
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        This page shows the <strong>Markdown shape</strong> of a quarterly aggregate baseline bulletin before{" "}
        <strong>N ≥ 5</strong> qualifying tenants exist. It is <strong>not</strong> a signed publication and must{" "}
        <strong>never</strong> receive a <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">## … ROI bulletin signed:</code>{" "}
        entry in the product changelog.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Illustrative quarter label in the sample: <strong>{illustrativeQuarter}</strong> (static example — not the
        current publication period).
      </p>

      <ExampleRoiBulletinEvidenceOrientationStrip />

      <section
        className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 mt-6 p-4 text-sm"
        aria-label="Admin-only real publication gate"
      >
        <p className="m-0 font-medium">Admin-only: real aggregate preview (Admin API)</p>
        <p className="mt-2 m-0 leading-relaxed">
          Authentic aggregate numbers require an API key with <strong>Admin access</strong> after sign-in. The same
          contract the ArchLucid CLI uses is exposed as a same-origin link (returns <strong>401/403</strong> without
          credentials — expected on this public page):
        </p>
        <p className="mt-3 m-0">
          <Link
            className="font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200"
            href={operatorAdminPreviewHref}
          >
            Open admin-only preview (sign-in required)
          </Link>
        </p>
      </section>

      <section className="mt-8" aria-labelledby="synthetic-md-heading">
        <h2 id="synthetic-md-heading" className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Checked-in sample Markdown
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Checked-in sample Markdown (rendered below for convenience).
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
          {markdown}
        </pre>
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <p className="m-0">
          For methodology and sponsor-safe interpretation, see{" "}
          <Link className="underline underline-offset-2" href={EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF}>
            Pilot ROI model (help)
          </Link>
          . Signed-in admins can generate a synthetic CLI draft with{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
            archlucid roi-bulletin --quarter {illustrativeQuarter} --synthetic
          </code>
          .
        </p>
      </section>
    </main>
  );
}
