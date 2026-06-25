import type { ReactElement } from "react";

import { FindingInspectJsonPayload } from "@/components/FindingInspectJsonPayload";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type FindingInspectReasoningPayloadDetailsProps = {
  readonly reasoningTrace: string | null | undefined;
  readonly typedPayload: unknown;
};

/** Raw operator traceability — inspect-only; omitted from sponsor-facing finding detail. */
export function FindingInspectReasoningPayloadDetails({
  reasoningTrace,
  typedPayload,
}: FindingInspectReasoningPayloadDetailsProps): ReactElement {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const rationaleLabel = buyerPolished ? "Review rationale (technical)" : "View AI Reasoning";
  const evaluationLabel = buyerPolished ? "Structured evaluation record" : "AI Audit Inspection";

  return (
    <>
      <details className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <summary className={cn("cursor-pointer select-none px-4 py-3 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          {rationaleLabel}
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          {reasoningTrace ? (
            <p className={cn("m-0 whitespace-pre-wrap leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {reasoningTrace}
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No rationale trace available for this finding.
            </p>
          )}
        </div>
      </details>

      <details className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40">
        <summary className={cn("cursor-pointer select-none px-4 py-3 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          {evaluationLabel}
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          <FindingInspectJsonPayload value={typedPayload ?? null} />
        </div>
      </details>
    </>
  );
}
