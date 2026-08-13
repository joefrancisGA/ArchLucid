import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

function shortList(items: readonly string[], limit: number): string {
  if (items.length === 0)
    return "-";

  const visible = items.slice(0, limit);
  const suffix = items.length > limit ? ` +${items.length - limit}` : "";

  return `${visible.join(", ")}${suffix}`;
}

type RunRetrievalExemplarStylePriorStripProps = {
  readonly summary: RunRetrievalGroundingSummary;
};

/** Topology reference-architecture style-prior observability on run detail (TB-663). */
export function RunRetrievalExemplarStylePriorStrip(
  props: RunRetrievalExemplarStylePriorStripProps,
): ReactElement {
  const summary = props.summary;
  const exemplarCount = summary.topologyReferenceArchitectureExemplarCount ?? 0;
  const exemplarMissing = summary.topologyReferenceArchitectureExemplarMissing === true;
  const documentIds = summary.topologyReferenceArchitectureExemplarDocumentIds ?? [];

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
            <dd className="m-0 tabular-nums sm:justify-self-end">{exemplarCount}</dd>
            <dt>Exemplar documents</dt>
            <dd
              className={cn("m-0 font-mono sm:justify-self-end", OPERATOR_TYPOGRAPHY.micro)}
              title={documentIds.join(", ")}
            >
              {shortList(documentIds, 2)}
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
