import { Badge } from "@/components/ui/badge";
import type { RunSummary } from "@/types/authority";
import {
  resolveReviewsHubDecisionSlaBadge,
  reviewsHubDecisionSlaBadgeClassName,
} from "@/lib/reviews/reviews-hub-decision-velocity-copy";

type ReviewsHubDecisionSlaBadgeProps = { readonly run: RunSummary };

export function ReviewsHubDecisionSlaBadge(props: ReviewsHubDecisionSlaBadgeProps): React.JSX.Element | null {
  const badge = resolveReviewsHubDecisionSlaBadge(props.run);

  if (badge === null) return null;

  return (
    <Badge variant="outline" className={reviewsHubDecisionSlaBadgeClassName(badge)} data-testid="reviews-hub-decision-sla-badge">
      {badge}
    </Badge>
  );
}
