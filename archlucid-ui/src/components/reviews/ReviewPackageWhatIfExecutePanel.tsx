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
  const draftQuery = useArchitectureDraftQuery(props.linkedDraft.architectureId);
  const { busy, executeBranch } = useReviewPackageWhatIfExecute(props.baseRunId);
  const draft = draftQuery.data;

  if (draft === undefined) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
        Loading what-if branch tools…
      </p>
    );
  }

  return (
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
  );
}
