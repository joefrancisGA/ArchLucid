"use client";

import type { ReactNode } from "react";

import {
  ReviewDetailWorkspace,
  type ReviewDetailWorkspaceProps,
} from "@/components/reviews/ReviewDetailWorkspace";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";

export const REVIEW_WORKSPACE_ROOT_TEST_ID = "review-workspace-shell";

export const REVIEW_WORKSPACE_TAB_STRIP_TEST_ID = "review-workspace-tab-strip";

export type ReviewWorkspaceShellProps = ReviewDetailWorkspaceProps & {
  readonly lifecycle: ReviewWorkspaceLifecycle;
};

/** TB-2367 — shared review workspace shell for create-home and committed lifecycles. */
export function ReviewWorkspaceShell(props: ReviewWorkspaceShellProps): React.JSX.Element {
  return (
    <div data-testid={REVIEW_WORKSPACE_ROOT_TEST_ID} data-workspace-lifecycle={props.lifecycle}>
      <ReviewDetailWorkspace {...props} />
    </div>
  );
}
