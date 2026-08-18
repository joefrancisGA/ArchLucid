import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

import {
  REVIEWS_NEW_BREADCRUMB_DETAILED_TOPIC_TITLE,
  REVIEWS_NEW_BREADCRUMB_REVIEWS_LABEL,
  REVIEWS_NEW_BREADCRUMB_REVIEWS_PATH,
  REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE,
} from "./reviews-new-page-surface-copy";

type ReviewsNewBreadcrumbProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

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
        items={[
          ...items.slice(0, -1),
          { label: REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE, href: "/architecture/reviews/new" },
          { label: REVIEWS_NEW_BREADCRUMB_DETAILED_TOPIC_TITLE },
        ]}
      />
    );
  }

  return <OperatorPageBreadcrumb data-testid="reviews-new-breadcrumb" items={items} />;
}
