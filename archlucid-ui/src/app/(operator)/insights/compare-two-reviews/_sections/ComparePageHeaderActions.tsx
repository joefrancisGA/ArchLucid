"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

type ComparePageHeaderActionsProps = {
  readonly buyerPolished: boolean;
};

/** Header actions for `/insights/compare-two-reviews` (CXX). */
export function ComparePageHeaderActions(props: ComparePageHeaderActionsProps): React.JSX.Element | null {
  if (props.buyerPolished) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="compare-page-header-actions">
      <PageContextualHelpButton />
    </div>
  );
}
