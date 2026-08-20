"use client";

import {
  ArchitectureCreatedWorkspace,
  type ArchitectureCreatedWorkspaceProps,
} from "@/components/architecture/ArchitectureCreatedWorkspace";
import { REVIEW_WORKSPACE_ROOT_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";

/** TB-2367 partial — create-home lifecycle shell wrapper around ArchitectureCreatedWorkspace. */
export function ArchitectureCreatedReviewWorkspaceShell(
  props: ArchitectureCreatedWorkspaceProps,
): React.JSX.Element {
  return (
    <div data-testid={REVIEW_WORKSPACE_ROOT_TEST_ID} data-workspace-lifecycle="create-home">
      <ArchitectureCreatedWorkspace {...props} />
    </div>
  );
}
