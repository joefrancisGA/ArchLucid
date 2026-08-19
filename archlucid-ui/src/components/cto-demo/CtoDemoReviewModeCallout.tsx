"use client";

import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CtoDemoReviewExecutionMode = "simulator" | "live";

export type CtoDemoReviewModeCalloutProps = {
  readonly mode: CtoDemoReviewExecutionMode;
  readonly onModeChange: (mode: CtoDemoReviewExecutionMode) => void;
};

export function CtoDemoReviewModeCallout(props: CtoDemoReviewModeCalloutProps): React.JSX.Element {
  const { mode, onModeChange } = props;
  const isLive = mode === "live";

  return (
    <div className="space-y-2" data-testid="cto-demo-review-mode-callout">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Review execution mode">
        <button
          type="button"
          className={cn("rounded-full border px-3 py-1 font-medium", OPERATOR_TYPOGRAPHY.helper,
            !isLive
              ? "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
              : "border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
          )}
          aria-pressed={!isLive}
          onClick={() => {
            onModeChange("simulator");
          }}
        >
          Simulator — faster
        </button>
        <button
          type="button"
          className={cn("rounded-full border px-3 py-1 font-medium", OPERATOR_TYPOGRAPHY.helper,
            isLive
              ? "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100"
              : "border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
          )}
          aria-pressed={isLive}
          onClick={() => {
            onModeChange("live");
          }}
        >
          Live — Azure OpenAI
        </button>
      </div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>
        {isLive ? (
          <>
            <StatusTag kind="ready" label="Live mode" className="mr-1.5 inline-flex align-middle" />
            Uses your Azure OpenAI deployment. Same pipeline, same policy packs, same signed output format as the showcase.
          </>
        ) : (
          <>
            <StatusTag kind="needs-attention" label="Simulator" className="mr-1.5 inline-flex align-middle" />
            Deterministic, instant results using a sandboxed pipeline. Switch to live mode for Azure OpenAI inference.
          </>
        )}
      </p>
    </div>
  );
}
