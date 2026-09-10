"use client";

import Link from "next/link";

import { useArchitectureDraftQuery } from "@/hooks/use-architecture-draft-query";
import {
  ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_EMPTY,
  ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_LABEL,
  ARCHITECTURE_OPEN_QUESTIONS_HELPER,
} from "@/lib/architecture/architecture-open-questions-copy";
import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import { architectureIdentityDraftHref } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";

type ArchitectureIdentityDeskOpenQuestionsProps = {
  readonly architectureId: string;
  readonly currentDraftId: string | null | undefined;
  readonly latestReviewId: string | null | undefined;
  readonly drafts: readonly ArchitectureIdentityChildDraftSummary[];
};

/** Read-only open-questions preview on the architecture desk (WS-19). */
export function ArchitectureIdentityDeskOpenQuestions(
  props: ArchitectureIdentityDeskOpenQuestionsProps,
): React.JSX.Element | null {
  const state = resolveArchitectureIdentityCurrentDraftState(
    props.drafts,
    props.currentDraftId,
    props.latestReviewId,
  );

  if (state.kind !== "drafting") {
    return null;
  }

  const draftQuery = useArchitectureDraftQuery(state.draftId);
  const openQuestions = draftQuery.data?.document.openQuestions?.trim() ?? "";

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
      aria-labelledby="architecture-identity-open-questions-heading"
      data-testid="architecture-identity-open-questions"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="architecture-identity-open-questions-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_LABEL}
        </h2>
        <Link
          href={architectureIdentityDraftHref(props.architectureId, state.draftId)}
          className={OPERATOR_LINK.nav}
          data-testid="architecture-identity-open-questions-edit-link"
        >
          Edit in draft editor
        </Link>
      </div>
      <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
        {ARCHITECTURE_OPEN_QUESTIONS_HELPER}
      </p>
      <p className={cn("mt-3 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-identity-open-questions-body">
        {openQuestions.length > 0 ? openQuestions : ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_EMPTY}
      </p>
    </section>
  );
}
