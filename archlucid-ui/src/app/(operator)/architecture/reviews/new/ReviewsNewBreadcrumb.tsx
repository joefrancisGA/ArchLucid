import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

import {
  REVIEWS_NEW_BREADCRUMB_DETAILED_TOPIC_TITLE,
  REVIEWS_NEW_BREADCRUMB_GUIDED_INTAKE_TOPIC_TITLE,
  REVIEWS_NEW_BREADCRUMB_QUICK_REVIEW_TOPIC_TITLE,
  REVIEWS_NEW_BREADCRUMB_REVIEWS_LABEL,
  REVIEWS_NEW_BREADCRUMB_REVIEWS_PATH,
  REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE,
} from "./reviews-new-page-surface-copy";

type ReviewsNewBreadcrumbProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

function reviewsNewPathTabBreadcrumbItems(
  topicTitle: string,
): ReadonlyArray<{ readonly label: string; readonly href?: string }> {
  return [
    { label: REVIEWS_NEW_BREADCRUMB_REVIEWS_LABEL, href: REVIEWS_NEW_BREADCRUMB_REVIEWS_PATH },
    { label: REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE, href: "/architecture/reviews/new" },
    { label: topicTitle },
  ];
}

/** Architecture trail for start-review intake (RNX / REN / REQ / ENE). */
export function ReviewsNewBreadcrumb(props: ReviewsNewBreadcrumbProps): React.JSX.Element {
  const items = [
    { label: REVIEWS_NEW_BREADCRUMB_REVIEWS_LABEL, href: REVIEWS_NEW_BREADCRUMB_REVIEWS_PATH },
    { label: REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE },
  ];

  if (props.activePath === "detailed") {
    return (
      <OperatorPageBreadcrumb
        data-testid="reviews-new-breadcrumb"
        items={reviewsNewPathTabBreadcrumbItems(REVIEWS_NEW_BREADCRUMB_DETAILED_TOPIC_TITLE)}
      />
    );
  }

  if (props.activePath === "guided-intake") {
    return (
      <OperatorPageBreadcrumb
        data-testid="reviews-new-breadcrumb"
        items={reviewsNewPathTabBreadcrumbItems(REVIEWS_NEW_BREADCRUMB_GUIDED_INTAKE_TOPIC_TITLE)}
      />
    );
  }

  if (props.activePath === "quick-review") {
    return (
      <OperatorPageBreadcrumb
        data-testid="reviews-new-breadcrumb"
        items={reviewsNewPathTabBreadcrumbItems(REVIEWS_NEW_BREADCRUMB_QUICK_REVIEW_TOPIC_TITLE)}
      />
    );
  }

  return <OperatorPageBreadcrumb data-testid="reviews-new-breadcrumb" items={items} />;
}
