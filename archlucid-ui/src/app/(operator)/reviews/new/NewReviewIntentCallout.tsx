"use client";

import { useSearchParams } from "next/navigation";

/**
 * Surfaces query-string intent from {@link PostCommitRetentionRail} revised-review chooser — lineage attachment remains API-owned.
 */
export function NewReviewIntentCallout() {
  const searchParams = useSearchParams();
  const intent: string = searchParams.get("intent")?.trim() ?? "";
  const cloneFrom: string = searchParams.get("cloneFromRunId")?.trim() ?? "";

  if (intent === "revised-clone" && cloneFrom.length > 0) {
    return (
      <div
        className="rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-neutral-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50"
        role="status"
      >
        <strong className="font-semibold">Revised review (carry-forward).</strong> Started from review{" "}
        <span className="font-mono text-xs">{cloneFrom}</span>. Finish the wizard — prior-manifest linkage follows tenant
        capability.
      </div>
    );
  }

  if (intent === "revised-fresh") {
    return (
      <div
        className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100"
        role="status"
      >
        <strong className="font-semibold">Revised review (fresh start).</strong> This pass does not assume attachment to a
        prior manifest — supply a new brief when prompted.
      </div>
    );
  }

  return null;
}
