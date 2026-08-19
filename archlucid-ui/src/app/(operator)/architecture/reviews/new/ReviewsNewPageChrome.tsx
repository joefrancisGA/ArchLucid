"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reviewsNewPageSubtitle } from "@/lib/reviews-new-page-copy";
import {
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL,
  REVIEWS_NEW_OPTIONAL_CLOUD_LEAD,
  type ReviewsNewPathMode,
} from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";

import { ReviewsNewBreadcrumb } from "./ReviewsNewBreadcrumb";

function resolveReviewsNewPathMode(pathQuery: string): ReviewsNewPathMode | null {
  if (pathQuery === "detailed" || pathQuery === "guided-intake" || pathQuery === "quick-review") {
    return pathQuery;
  }

  return null;
}

function reviewsNewShowsPathTabChrome(
  buyerPolishedShell: boolean,
  activePath: ReviewsNewPathMode | null,
): boolean {
  return buyerPolishedShell && activePath !== null && activePath !== "quick-review";
}

type ReviewsNewPageSubtitleProps = {
  readonly buyerPolishedShell: boolean;
  readonly activePath: ReviewsNewPathMode | null;
};

function ReviewsNewPageSubtitle(props: ReviewsNewPageSubtitleProps): React.JSX.Element {
  if (!props.buyerPolishedShell) {
    return (
      <div className="space-y-2">
        <p className="m-0">
          {REVIEWS_NEW_PAGE_LEAD} Each review becomes an{" "}
          <InlineGlossaryChip nounId="review-package">architecture package</InlineGlossaryChip> with an{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>.
        </p>
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="reviews-new-optional-cloud-hint"
        >
          {REVIEWS_NEW_OPTIONAL_CLOUD_LEAD}{" "}
          <Link
            href={REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF}
            className={OPERATOR_LINK.nav}
            data-testid="reviews-new-cloud-connections-help-link"
          >
            {REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL}
          </Link>
          <span className="text-al-text-secondary"> · </span>
          <Link
            href={REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF}
            className={OPERATOR_LINK.nav}
            data-testid="reviews-new-cloud-connections-hub-link"
          >
            {REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL}
          </Link>
        </p>
      </div>
    );
  }

  const onPathTab = reviewsNewShowsPathTabChrome(props.buyerPolishedShell, props.activePath);

  return (
    <div className="space-y-2">
      <p className="m-0" data-testid="reviews-new-page-subtitle">
        {reviewsNewPageSubtitle(props.buyerPolishedShell, props.activePath)}
      </p>
      {!onPathTab ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="reviews-new-optional-cloud-hint"
        >
          {REVIEWS_NEW_OPTIONAL_CLOUD_LEAD}{" "}
          <Link
            href={REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF}
            className={OPERATOR_LINK.nav}
            data-testid="reviews-new-cloud-connections-help-link"
          >
            {REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL}
          </Link>
          <span className="text-al-text-secondary"> · </span>
          <Link
            href={REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF}
            className={OPERATOR_LINK.nav}
            data-testid="reviews-new-cloud-connections-hub-link"
          >
            {REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/** Hero + Evidence chrome for `/architecture/reviews/new` (RNX). */
export function ReviewsNewPageChrome(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchParams = useSearchParams();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const activePath = resolveReviewsNewPathMode(pathQuery);
  const onPathTab = reviewsNewShowsPathTabChrome(buyerPolishedShell, activePath);
  const showContextualHelp = !(buyerPolishedShell && onPathTab);

  return (
    <>
      <OperatorPageHeader
        navHref={REVIEWS_NEW_PATH}
        title={START_REVIEW_LABEL}
        titleTestId="reviews-new-page-title"
        breadcrumb={buyerPolishedShell ? <ReviewsNewBreadcrumb activePath={activePath} /> : undefined}
        subtitle={
          <ReviewsNewPageSubtitle buyerPolishedShell={buyerPolishedShell} activePath={activePath} />
        }
        subtitleTestId="reviews-new-page-lead"
        headingLevel="h1"
        actions={showContextualHelp ? <PageContextualHelpButton /> : undefined}
      />
      {!onPathTab ? <PathChooserCreateObjectVocabularyRail currentSurfaceId="reviews-new" /> : null}
    </>
  );
}
