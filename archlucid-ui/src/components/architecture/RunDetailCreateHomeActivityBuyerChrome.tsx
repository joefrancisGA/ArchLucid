"use client";

import { RunDetailActivitySourcesPanel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailActivitySourcesPanel";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Activity workspace (REA). */
export function RunDetailCreateHomeActivityBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-activity-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <RunDetailActivitySourcesPanel />
    </div>
  );
}
