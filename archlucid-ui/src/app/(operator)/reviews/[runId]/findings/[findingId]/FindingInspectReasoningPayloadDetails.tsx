import type { ReactElement } from "react";

import { FindingInspectJsonPayload } from "@/components/FindingInspectJsonPayload";

export type FindingInspectReasoningPayloadDetailsProps = {
  readonly reasoningTrace: string | null | undefined;
  readonly typedPayload: unknown;
};

/** Raw operator traceability — inspect-only; omitted from sponsor-facing finding detail. */
export function FindingInspectReasoningPayloadDetails({
  reasoningTrace,
  typedPayload,
}: FindingInspectReasoningPayloadDetailsProps): ReactElement {
  return (
    <>
      <details className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          View AI Reasoning
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          {reasoningTrace ? (
            <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {reasoningTrace}
            </p>
          ) : (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              No reasoning trace available for this finding.
            </p>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          AI Audit Inspection
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          <FindingInspectJsonPayload value={typedPayload ?? null} />
        </div>
      </details>
    </>
  );
}
