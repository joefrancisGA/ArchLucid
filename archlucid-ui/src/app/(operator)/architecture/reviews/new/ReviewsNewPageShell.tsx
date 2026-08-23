"use client";

import { useSearchParams } from "next/navigation";

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

function reviewsNewBuyerChromeRendersInShell(pathQuery: string): boolean {
  return pathQuery !== "guided-intake";
}

/** Shared `/architecture/reviews/new` layout — skip link, header, and intake workspace (RNX / REN / REQ / ENE). */
export function ReviewsNewPageShell(props: ReviewsNewPageShellProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchParams = useSearchParams();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const showBuyerChromeInShell = buyerPolishedShell && reviewsNewBuyerChromeRendersInShell(pathQuery);

  return (
    <OperatorPageContainer variant="workflow" withContextRail={buyerPolishedShell}>
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
        {showBuyerChromeInShell ? <ReviewsNewBuyerChrome /> : null}
      </div>
    </OperatorPageContainer>
  );
}
