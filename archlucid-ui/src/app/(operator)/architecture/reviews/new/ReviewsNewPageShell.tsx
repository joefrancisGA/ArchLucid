"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ReviewsNewBuyerChrome } from "./ReviewsNewBuyerChrome";
import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";
import {
  REVIEWS_NEW_PRIMARY_CONTENT_ID,
  REVIEWS_NEW_SKIP_LINK_LABEL,
} from "./reviews-new-page-surface-copy";

type ReviewsNewPageShellProps = {
  readonly children: React.ReactNode;
};

/** Shared `/architecture/reviews/new` layout — skip link, header, and intake workspace (RNX / REN / REQ / ENE). */
export function ReviewsNewPageShell(props: ReviewsNewPageShellProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageContainer variant="workflow">
      {buyerPolishedShell ? (
        <a
          href={`#${REVIEWS_NEW_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {REVIEWS_NEW_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <ReviewsNewPageChrome />
      <div
        id={REVIEWS_NEW_PRIMARY_CONTENT_ID}
        className="mt-6 scroll-mt-24"
        data-testid="reviews-new-primary-content"
      >
        {props.children}
        {buyerPolishedShell ? <ReviewsNewBuyerChrome /> : null}
      </div>
    </OperatorPageContainer>
  );
}
