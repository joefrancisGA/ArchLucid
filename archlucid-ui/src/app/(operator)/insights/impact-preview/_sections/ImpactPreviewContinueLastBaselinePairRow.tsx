"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { ImpactPreviewLastBaselinePair } from "@/lib/impact-preview/impact-preview-last-baseline-pair-storage";
import { cn } from "@/lib/utils";

export type ImpactPreviewContinueLastBaselinePairRowProps = {
  readonly pair: ImpactPreviewLastBaselinePair;
  readonly onResume: (pair: ImpactPreviewLastBaselinePair) => void;
};

/** Pinned continue row for the most recently compared impact-preview pair. */
export function ImpactPreviewContinueLastBaselinePairRow(
  props: ImpactPreviewContinueLastBaselinePairRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="impact-preview-continue-last-pair-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="impact-preview-continue-last-baseline-pair-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="impact-preview-continue-last-pair-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last baseline pair
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Resume the last baseline review and candidate change set.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="impact-preview-continue-last-baseline-pair-open"
          onClick={() => {
            props.onResume(props.pair);
          }}
        >
          Resume pair
        </Button>
      </div>
    </section>
  );
}
