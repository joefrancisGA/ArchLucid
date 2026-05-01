import type { Metadata } from "next";
import Link from "next/link";

import { loadSeeItDemoPreview } from "./load-see-it-demo-preview";
import { normalizeSeeItMarketingPayload } from "./normalize-see-it-payload";
import { SeeItMarketingBody } from "./SeeItMarketingBody";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ArchLucid · See it in 30 seconds",
  description:
    "No-install look at a sample healthcare architecture review: finalized manifest snapshot, counts, and artifact descriptors — with a static fallback when live preview is unavailable.",
  robots: { index: true, follow: true },
  other: {
    "data-demo": "true",
  },
};

export default async function SeeItMarketingPage() {
  const { source, payload } = await loadSeeItDemoPreview();
  const normalized = normalizeSeeItMarketingPayload(payload);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        See a real finalized manifest in 30 seconds
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        A real finalized manifest from the Claims Intake sample review — live API when configured, static snapshot otherwise.
      </p>
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        Sample data.{" "}
        <Link className="text-teal-800 underline underline-offset-2 dark:text-teal-200" href="/WORKED_EXAMPLE_ROI.pdf">
          See worked example ROI (PDF)
        </Link>
        .
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-teal-50/60 p-4 dark:border-neutral-700 dark:bg-teal-950/30">
        <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-50">
          See a full sample review output — no sign-in
        </p>
        <p className="mt-2 m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Open the read-only demo walkthrough with manifest, audit trail, and artifacts — the same projection buyers use on
          the commit page (public API optional; static fallback when offline).
        </p>
        <div className="mt-4">
          <Link
            href="/demo/preview"
            className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            data-testid="see-it-cta-demo-preview"
          >
            Open full demo preview
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <SeeItMarketingBody source={source} payload={normalized} />
      </div>
    </main>
  );
}
