"use client";

import Link from "next/link";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reviewsNewPageSubtitle } from "@/lib/reviews-new-page-copy";
import { reviewsNewShowsPathTabChrome } from "@/lib/reviews-new-page-resume-hero";
import {
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL,
  REVIEWS_NEW_OPTIONAL_CLOUD_LEAD,
  type ReviewsNewPathMode,
} from "@/lib/reviews-new-path-copy";
import { REVIEWS_NEW_CLAIM_DISCIPLINE } from "@/lib/reviews-new-evidence-copy";
import { cn } from "@/lib/utils";

import { ReviewsNewBreadcrumb } from "./ReviewsNewBreadcrumb";
import { ReviewsNewHeaderActions } from "./ReviewsNewHeaderActions";
import { useReviewsNewSpecimenPreviewPresentation } from "./use-reviews-new-specimen-preview-presentation";

type ReviewsNewPageSubtitleProps = {
  readonly buyerPolishedShell: boolean;
  readonly activePath: ReviewsNewPathMode | null;
  readonly showSpecimenHeaderLinks: boolean;
};

type ReviewsNewOptionalCloudHintProps = {
  readonly showSpecimenHeaderLinks: boolean;
};

function ReviewsNewOptionalCloudHint(props: ReviewsNewOptionalCloudHintProps): React.JSX.Element {
  return (
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
      {props.showSpecimenHeaderLinks ? (
        <SpecimenDeliverablePreviewCallout
          variant="header-links"
          sectionTestId="reviews-new-specimen-preview"
        />
      ) : null}
    </p>
  );
}

function ReviewsNewPageSubtitle(props: ReviewsNewPageSubtitleProps): React.JSX.Element {
  if (!props.buyerPolishedShell) {
    return (
      <div className="space-y-2">
        <p className="m-0">
          {REVIEWS_NEW_PAGE_LEAD} Each review becomes an{" "}
          <InlineGlossaryChip nounId="review-package">architecture package</InlineGlossaryChip> with an{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>.
        </p>
        <ReviewsNewOptionalCloudHint showSpecimenHeaderLinks={props.showSpecimenHeaderLinks} />
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
        <ReviewsNewOptionalCloudHint showSpecimenHeaderLinks={props.showSpecimenHeaderLinks} />
      ) : null}
    </div>
  );
}

type ReviewsNewPageChromeProps = {
  readonly buyerPolishedShell: boolean;
  readonly activePath: ReviewsNewPathMode | null;
};

/** Hero chrome for `/architecture/reviews/new` (RNX). */
export function ReviewsNewPageChrome(props: ReviewsNewPageChromeProps): React.JSX.Element {
  const specimenPreviewPresentation = useReviewsNewSpecimenPreviewPresentation();

  return (
    <OperatorPageHeader
      navHref={REVIEWS_NEW_PATH}
      title={START_REVIEW_LABEL}
      titleTestId="reviews-new-page-title"
      breadcrumb={props.buyerPolishedShell ? <ReviewsNewBreadcrumb activePath={props.activePath} /> : undefined}
      subtitle={
        <ReviewsNewPageSubtitle
          buyerPolishedShell={props.buyerPolishedShell}
          activePath={props.activePath}
          showSpecimenHeaderLinks={specimenPreviewPresentation.showHeaderLinks}
        />
      }
      subtitleTestId="reviews-new-page-lead"
      headingLevel="h1"
      claimDiscipline={REVIEWS_NEW_CLAIM_DISCIPLINE}
      claimDisciplineTestId="reviews-new-claim-discipline"
      actions={<ReviewsNewHeaderActions activePath={props.activePath} />}
    />
  );
}
