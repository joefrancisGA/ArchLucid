import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";

type SampleReviewPackageSummaryProps = {
  readonly runId: string;
  readonly manifestId?: string | null;
  readonly artifactCount: number;
  readonly findingCount: number | null;
};

/** Demo-only first-value summary for the curated sample review package. */
export function SampleReviewPackageSummary({
  runId,
  manifestId,
  artifactCount,
  findingCount,
}: SampleReviewPackageSummaryProps): ReactElement {
  const findingCountDisplay = findingCount ?? SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;

  return (
    <section
      aria-labelledby="sample-review-package-summary-heading"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide">Sample first-value summary</p>
      <h2 id="sample-review-package-summary-heading" className="m-0 mt-1 text-lg font-semibold">
        Claims Intake sample review package
      </h2>
      <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed">
        This is demo data. Use it to inspect the reviewed manifest, findings, evidence trail, and artifacts before
        starting a real architecture review. Do not use these numbers as customer ROI evidence.
      </p>

      <dl className="mt-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
          <dt className="text-[11px] font-medium uppercase tracking-wide opacity-80">Review ID</dt>
          <dd className="m-0 truncate font-mono text-xs">{runId}</dd>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
          <dt className="text-[11px] font-medium uppercase tracking-wide opacity-80">Findings</dt>
          <dd className="m-0 text-lg font-semibold">{findingCountDisplay}</dd>
          <p className="m-0 text-[11px] opacity-80">Demo severity mix; inspect finding details below.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
          <dt className="text-[11px] font-medium uppercase tracking-wide opacity-80">Artifacts</dt>
          <dd className="m-0 text-lg font-semibold">{artifactCount}</dd>
          <p className="m-0 text-[11px] opacity-80">Generated outputs attached to the reviewed manifest.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
          <dt className="text-[11px] font-medium uppercase tracking-wide opacity-80">Evidence confidence</dt>
          <dd className="m-0 text-lg font-semibold">Demo only</dd>
          <p className="m-0 text-[11px] opacity-80">Connect a workspace for tenant proof.</p>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {manifestId ? (
          <Button asChild variant="outline" className="h-9 border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-700 dark:bg-neutral-950/60 dark:text-amber-100">
            <Link href={`/manifests/${encodeURIComponent(manifestId)}`}>Open sample manifest</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" className="h-9 border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-700 dark:bg-neutral-950/60 dark:text-amber-100">
          <Link href="/reviews/new">Start a real review</Link>
        </Button>
      </div>
    </section>
  );
}
