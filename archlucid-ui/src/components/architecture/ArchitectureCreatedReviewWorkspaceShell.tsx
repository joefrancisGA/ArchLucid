"use client";

import {
  ReviewWorkspaceShell,
  type ReviewWorkspaceShellProps,
} from "@/components/reviews/ReviewWorkspaceShell";
import type { ArchitectureCreatedWorkspaceProps } from "@/components/architecture/ArchitectureCreatedWorkspace";

/** TB-2367 — create-home entry delegates to the unified review workspace shell. */
export function ArchitectureCreatedReviewWorkspaceShell(
  props: ArchitectureCreatedWorkspaceProps,
): React.JSX.Element {
  const shellProps: ReviewWorkspaceShellProps = {
    lifecycle: "create-home",
    createHome: props,
  };

  return <ReviewWorkspaceShell {...shellProps} />;
}
