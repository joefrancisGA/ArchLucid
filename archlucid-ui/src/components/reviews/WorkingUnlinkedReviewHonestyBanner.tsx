"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  WORKING_UNLINKED_REVIEW_HONESTY_COPY,
  WORKING_UNLINKED_REVIEW_HONESTY_TITLE,
  isUnlinkedArchitectureReviewJob,
} from "@/lib/architecture/working-unlinked-review-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WorkingUnlinkedReviewHonestyBannerProps = {
  readonly architectureId: string | null | undefined;
  readonly className?: string;
};

/** AO-49: peer review chrome cannot masquerade as a complete architecture desk. */
export function WorkingUnlinkedReviewHonestyBanner(
  props: WorkingUnlinkedReviewHonestyBannerProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode || !isUnlinkedArchitectureReviewJob(props.architectureId)) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.warnShell, "p-4", props.className)}
      data-testid="working-unlinked-review-honesty-banner"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {WORKING_UNLINKED_REVIEW_HONESTY_TITLE}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {WORKING_UNLINKED_REVIEW_HONESTY_COPY}
      </p>
    </div>
  );
}
