"use client";

import {
  ArchitectureCreatedWorkspace,
  type ArchitectureCreatedWorkspaceProps,
} from "@/components/architecture/ArchitectureCreatedWorkspace";
import {
  ReviewDetailWorkspace,
  type ReviewDetailWorkspaceProps,
} from "@/components/reviews/ReviewDetailWorkspace";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";

export const REVIEW_WORKSPACE_ROOT_TEST_ID = "review-workspace-shell";

export const REVIEW_WORKSPACE_TAB_STRIP_TEST_ID = "review-workspace-tab-strip";

export type ReviewWorkspaceShellCreateHomeProps = {
  readonly lifecycle: "create-home";
  readonly createHome: ArchitectureCreatedWorkspaceProps;
};

export type ReviewWorkspaceShellCommittedProps = ReviewDetailWorkspaceProps & {
  readonly lifecycle: "in-review" | "finalized";
};

export type ReviewWorkspaceShellProps = ReviewWorkspaceShellCreateHomeProps | ReviewWorkspaceShellCommittedProps;

/** TB-2367 — shared review workspace shell for create-home and committed lifecycles. */
export function ReviewWorkspaceShell(props: ReviewWorkspaceShellProps): React.JSX.Element {
  if (props.lifecycle === "create-home") {
    return (
      <div data-testid={REVIEW_WORKSPACE_ROOT_TEST_ID} data-workspace-lifecycle={props.lifecycle}>
        <ArchitectureCreatedWorkspace {...props.createHome} />
      </div>
    );
  }

  const committedProps = props as ReviewWorkspaceShellCommittedProps;

  return (
    <div data-testid={REVIEW_WORKSPACE_ROOT_TEST_ID} data-workspace-lifecycle={committedProps.lifecycle}>
      <ReviewDetailWorkspace {...committedProps} lifecycle={committedProps.lifecycle} />
    </div>
  );
}
