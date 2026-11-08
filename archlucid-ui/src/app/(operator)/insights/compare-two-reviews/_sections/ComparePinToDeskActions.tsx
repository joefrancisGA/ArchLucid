"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { PinReviewToDeskButton } from "@/components/reviews/PinReviewToDeskButton";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";
import { cn } from "@/lib/utils";

export type ComparePinToDeskActionsProps = {
  readonly baselineRunId: string;
  readonly updatedRunId: string;
};

/** DR-11 — open review desk with one compare side pinned beside the other. */
export function ComparePinToDeskActions(props: ComparePinToDeskActionsProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const baseline = props.baselineRunId.trim();
  const updated = props.updatedRunId.trim();
  const queryArchitectureId = searchParams.get("architectureId")?.trim() ?? "";
  const deskArchitectureId =
    queryArchitectureId.length > 0
      ? queryArchitectureId
      : resolveGlobalSearchDeskArchitectureId({
          runId: updated.length > 0 ? updated : baseline,
          pathname,
          search: searchParams.toString(),
        }) ?? "";

  if (!isWorkingMode) {
    return <></>;
  }

  if (baseline.length === 0 || updated.length === 0 || baseline === updated) {
    return <></>;
  }

  return (
    <section
      className="space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800"
      data-testid="compare-pin-to-desk-actions"
      aria-label="Pin compare side on review desk"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Work both reviews on one desk
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Pin one review beside the other without leaving the primary tab strip.
      </p>
      <div className="flex flex-wrap gap-2">
        <PinReviewToDeskButton
          pinRunId={baseline}
          primaryRunId={updated}
          architectureId={deskArchitectureId.length > 0 ? deskArchitectureId : undefined}
          label="Pin baseline on updated desk"
          testId="compare-pin-baseline-on-updated"
        />
        <PinReviewToDeskButton
          pinRunId={updated}
          primaryRunId={baseline}
          architectureId={deskArchitectureId.length > 0 ? deskArchitectureId : undefined}
          label="Pin updated on baseline desk"
          testId="compare-pin-updated-on-baseline"
        />
      </div>
    </section>
  );
}
