import { StatusTag } from "@/components/ui/status-tag";
import {
  isReviewGuideRequiredStatusLabel,
  mapReviewGuideRequiredStatusToTagKind,
} from "@/lib/review-guide-help-required-status";

type ReviewGuideRequiredStatusCellProps = {
  readonly statusLabel: string;
};

/** StatusTag cell for the Review guide field-reference Required column. */
export function ReviewGuideRequiredStatusCell(
  props: ReviewGuideRequiredStatusCellProps,
): React.JSX.Element {
  const trimmed = props.statusLabel.trim();

  if (!isReviewGuideRequiredStatusLabel(trimmed)) {
    return <span>{trimmed}</span>;
  }

  return (
    <StatusTag
      kind={mapReviewGuideRequiredStatusToTagKind(trimmed)}
      label={trimmed}
      data-testid="review-guide-required-status-tag"
    />
  );
}
