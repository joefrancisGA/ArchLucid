"use client";

import type { ReactElement } from "react";

import { DraftIntakeWhatIfBranchPanel } from "@/components/draft-intake/DraftIntakeWhatIfBranchPanel";
import { useArchitectureDraftQuery } from "@/hooks/use-architecture-draft-query";
import { useReviewPackageWhatIfExecute } from "@/hooks/use-review-package-what-if-execute";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

export type ReviewPackageWhatIfExecutePanelProps = {
  readonly baseRunId: string;
  readonly linkedDraft: ArchitectureDraftRegistryEntry;
  readonly disabled?: boolean;
};

/** R12 execute path from a committed review — branch one field, submit, then Compare (LS-06). */
export function ReviewPackageWhatIfExecutePanel(
  props: ReviewPackageWhatIfExecutePanelProps,
): ReactElement | null {
  const draftQuery = useArchitectureDraftQuery(props.linkedDraft.draftId);
  const { busy, errorMessage, executeBranch } = useReviewPackageWhatIfExecute(props.baseRunId);
  const draft = draftQuery.data;

  if (draft === undefined) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
        Loading what-if branch tools…
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <DraftIntakeWhatIfBranchPanel
        draftId={draft.draftId}
        draftStatus={draft.status}
        disabled={props.disabled === true || busy}
        intent={draft.document.freeTextIntent}
        outcome={draft.document.businessOutcome ?? ""}
        systemName={draft.document.systemName ?? ""}
        questionOptions={[]}
        suppressQuestionAnswerOverride={true}
        onBranched={(response) => {
          void executeBranch(response);
        }}
      />
      {errorMessage !== null ? (
        <p
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-package-what-if-execute-blocked-reason"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
