import Link from "next/link";

import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_DRAFT_HANDOFF_LOCK_SENTENCE,
} from "@/components/architecture/ArchitectureDraftHandoffPanel";
import {
  ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_NEW_VERSION_LABEL,
  ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import { architectureIdentityDraftHref, reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";

type ArchitectureIdentityDeskCurrentDraftProps = {
  readonly architectureId: string;
  readonly currentDraftId: string | null | undefined;
  readonly latestReviewId: string | null | undefined;
  readonly drafts: readonly ArchitectureIdentityChildDraftSummary[];
};

/** Current draft slot on the architecture identity desk (CA-28). */
export function ArchitectureIdentityDeskCurrentDraft(
  props: ArchitectureIdentityDeskCurrentDraftProps,
): React.JSX.Element {
  const state = resolveArchitectureIdentityCurrentDraftState(
    props.drafts,
    props.currentDraftId,
    props.latestReviewId,
  );

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
      aria-labelledby="architecture-identity-current-draft-heading"
      data-testid="architecture-identity-current-draft"
    >
      <h2 id="architecture-identity-current-draft-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL}
      </h2>

      {state.kind === "drafting" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusTag kind="in-progress" label="Open draft" />
          <Link
            href={architectureIdentityDraftHref(props.architectureId, state.draftId)}
            className={OPERATOR_LINK.nav}
            data-testid="architecture-identity-open-current-draft"
          >
            Continue draft
          </Link>
        </div>
      ) : null}

      {state.kind === "spawn-locked" ? (
        <div className="mt-2 space-y-3">
          <p className={OPERATOR_TYPOGRAPHY.body}>{ARCHITECTURE_DRAFT_HANDOFF_LOCK_SENTENCE}</p>
          <div className="flex flex-wrap items-center gap-2">
            {state.linkedReviewId !== null ? (
              <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-identity-open-review">
                <Link href={reviewDetailPath(state.linkedReviewId)}>Open review</Link>
              </Button>
            ) : null}
            <ArchitectureDraftCloneSnapshotControl
              draftId={state.draftId}
              parentArchitectureId={props.architectureId}
              buttonLabel={ARCHITECTURE_IDENTITY_DESK_NEW_VERSION_LABEL}
              testId="architecture-identity-new-version-from-snapshot"
            />
          </div>
        </div>
      ) : null}

      {state.kind === "none" ? (
        <div className="mt-2 space-y-2">
          <p className={OPERATOR_TYPOGRAPHY.body}>{ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT}</p>
          {state.cloneSourceDraftId !== null ? (
            <ArchitectureDraftCloneSnapshotControl
              draftId={state.cloneSourceDraftId}
              parentArchitectureId={props.architectureId}
              buttonLabel={ARCHITECTURE_IDENTITY_DESK_NEW_VERSION_LABEL}
              testId="architecture-identity-new-version-from-snapshot"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
