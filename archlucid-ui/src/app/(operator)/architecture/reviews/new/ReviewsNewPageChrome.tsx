"use client";

import Link from "next/link";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HELP_LINK_LABEL,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_HREF,
  REVIEWS_NEW_CLOUD_CONNECTIONS_HUB_LINK_LABEL,
  REVIEWS_NEW_OPTIONAL_CLOUD_LEAD,
} from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";

/** Hero + Evidence chrome for `/architecture/reviews/new` (RNX). */
export function ReviewsNewPageChrome(): React.JSX.Element {
  return (
    <>
      <OperatorPageHeader
        title={START_REVIEW_LABEL}
        titleTestId="reviews-new-page-title"
        subtitle={
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
        }
        subtitleTestId="reviews-new-page-lead"
        headingLevel="h1"
        actions={<PageContextualHelpButton />}
      />
      <PathChooserCreateObjectVocabularyRail currentSurfaceId="reviews-new" />
    </>
  );
}
