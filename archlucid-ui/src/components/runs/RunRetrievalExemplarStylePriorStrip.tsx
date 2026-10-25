import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

type RunRetrievalExemplarStylePriorStripProps = {
  readonly summary: RunRetrievalGroundingSummary;
};

/** Topology reference-architecture style-prior observability on run detail (TB-663). */
export function RunRetrievalExemplarStylePriorStrip(
  props: RunRetrievalExemplarStylePriorStripProps,
): ReactElement {
  const summary = props.summary;
  const rawExemplarCount = summary.topologyReferenceArchitectureExemplarCount;
  const exemplarCountStored = typeof rawExemplarCount === "number" && Number.isFinite(rawExemplarCount);
  const exemplarCountDisplay = exemplarCountStored
    ? String(Math.trunc(rawExemplarCount))
    : "Exemplar chunk count was not stored.";
  const exemplarMissing = summary.topologyReferenceArchitectureExemplarMissing === true;
  const documentIdsRaw = summary.topologyReferenceArchitectureExemplarDocumentIds;
  const documentIdsStored = documentIdsRaw !== null && documentIdsRaw !== undefined;
  const documentIds = documentIdsStored ? documentIdsRaw : [];

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2.5 dark:border-neutral-700",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="run-retrieval-exemplar-style-prior"
      id="run-retrieval-exemplar-style-prior"
    >
      <p className="m-0 font-medium text-al-text-primary">Reference architecture style prior (Architecture structure)</p>

      {exemplarMissing ? (
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-300">
          No reference architecture exemplar matched. Architecture structure was derived from request context only
          (fail-open by design).
        </p>
      ) : (
        <>
          <dl className="m-0 mt-2 grid gap-1 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-x-4">
            <dt>Exemplar chunks</dt>
            <dd className="m-0 tabular-nums sm:justify-self-end">{exemplarCountDisplay}</dd>
            <dt>Exemplar documents</dt>
            <dd className={cn("m-0 break-all font-mono sm:justify-self-end", OPERATOR_TYPOGRAPHY.micro)}>
              {!documentIdsStored
                ? "Exemplar document ids were not stored."
                : documentIds.length > 0
                  ? documentIds.join(", ")
                  : "No exemplar document ids were stored."}
            </dd>
          </dl>
          <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-300">
            Style prior only — not cited in findings. Exemplars guide architecture structure; compliance and evidence
            citations use separate corpora.
          </p>
        </>
      )}
    </div>
  );
}
