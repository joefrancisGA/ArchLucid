import { StatusTag } from "@/components/ui/status-tag";
import type { RunSummary } from "@/types/authority";
import {
  resolveReviewsHubWaitingOnKind,
  resolveReviewsHubWaitingOnLabel,
} from "@/lib/reviews/reviews-hub-decision-velocity-copy";

type ReviewsHubWaitingOnChipProps = { readonly run: RunSummary };

export function ReviewsHubWaitingOnChip(props: ReviewsHubWaitingOnChipProps): React.JSX.Element | null {
  const kind = resolveReviewsHubWaitingOnKind(props.run);

  if (kind === null) return null;

  return (
    <StatusTag kind="neutral" label={resolveReviewsHubWaitingOnLabel(kind)} data-testid="reviews-hub-waiting-on-chip" />
  );
}
