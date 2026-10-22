"use client";

import { useMemo } from "react";

import { ReviewPackageContinueLastRow } from "@/components/reviews/ReviewPackageContinueLastRow";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeContinueLastReviewPackageSectionProps = {
  readonly runs: readonly RunSummary[];
  readonly buttonVariant?: "primary" | "outline";
};

/** Working Home resume row for the last-open review package (CD-11). */
export function OperatorHomeContinueLastReviewPackageSection(
  props: OperatorHomeContinueLastReviewPackageSectionProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const drafts = useArchitectureDraftRegistryEntries();
  const target = useMemo(
    () =>
      resolveContinueLastReviewPackageTarget(props.runs, undefined, {
        workingMode: isWorkingMode,
        draftRegistryEntries: drafts,
      }),
    [drafts, isWorkingMode, props.runs],
  );

  if (target === null) {
    return null;
  }

  return <ReviewPackageContinueLastRow target={target} buttonVariant={props.buttonVariant ?? "primary"} />;
}
