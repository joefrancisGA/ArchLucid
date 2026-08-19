import { cn } from "@/lib/utils";

import {
  BUYER_EVIDENCE_GRAPH_PICKER_LOADING,
  BUYER_EVIDENCE_GRAPH_PICKER_NO_PACKAGES,
  BUYER_EVIDENCE_GRAPH_PICKER_NO_SELECTION,
  BUYER_EVIDENCE_GRAPH_PICKER_REAL_REVIEW,
  BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GraphReviewPickerState } from "@/lib/graph-page-state";

export type GraphReviewPickerStatusProps = {
  readonly state: GraphReviewPickerState;
  readonly reviewLabel?: string;
  readonly className?: string;
};

function resolvePickerStatusCopy(
  state: GraphReviewPickerState,
  reviewLabel: string | undefined,
): string {
  switch (state) {
    case "loading":
      return BUYER_EVIDENCE_GRAPH_PICKER_LOADING;
    case "no-packages":
      return BUYER_EVIDENCE_GRAPH_PICKER_NO_PACKAGES;
    case "no-selection":
      return BUYER_EVIDENCE_GRAPH_PICKER_NO_SELECTION;
    case "sample-review":
      return BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW;
    case "real-review":
      return reviewLabel !== undefined && reviewLabel.trim().length > 0
        ? `${BUYER_EVIDENCE_GRAPH_PICKER_REAL_REVIEW}: ${reviewLabel.trim()}`
        : BUYER_EVIDENCE_GRAPH_PICKER_REAL_REVIEW;
    default: {
      const exhaustive: never = state;

      return exhaustive;
    }
  }
}

/** Short status line under the review picker — clarifies sample vs real selection. */
export function GraphReviewPickerStatus(props: GraphReviewPickerStatusProps) {
  const copy = resolvePickerStatusCopy(props.state, props.reviewLabel);

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid="graph-review-picker-status"
      data-picker-state={props.state}
    >
      {copy}
    </p>
  );
}
