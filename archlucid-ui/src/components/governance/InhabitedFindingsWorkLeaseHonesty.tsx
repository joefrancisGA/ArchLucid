"use client";

import type { ReactElement } from "react";

import {
  INHABIT_FINDINGS_DRAFT_LEASE_BODY,
  INHABIT_FINDINGS_DRAFT_LEASE_TITLE,
  INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_BODY,
  INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_TITLE,
} from "@/lib/inhabit/inhabit-work-lease-findings-copy";
import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InhabitedFindingsWorkLeaseHonestyProps = {
  readonly drafts: readonly ArchitectureIdentityChildDraftSummary[];
  readonly currentDraftId?: string | null;
  readonly latestReviewId?: string | null;
  readonly draftLeaseHeldByOther?: boolean;
};

/** IH-057 — honest lease copy on findings (spawn-lock CAS vs draft lease). */
export function InhabitedFindingsWorkLeaseHonesty(
  props: InhabitedFindingsWorkLeaseHonestyProps,
): ReactElement | null {
  const draftState = resolveArchitectureIdentityCurrentDraftState(
    props.drafts,
    props.currentDraftId,
    props.latestReviewId,
  );

  if (draftState.kind === "spawn-locked") {
    return (
      <div
        className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
        data-testid="inhabited-findings-spawn-locked-lease-honesty"
      >
        <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_TITLE}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INHABIT_FINDINGS_SPAWN_LOCKED_LEASE_BODY}
        </p>
      </div>
    );
  }

  if (props.draftLeaseHeldByOther === true && draftState.kind === "drafting") {
    return (
      <div
        className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
        data-testid="inhabited-findings-draft-lease-honesty"
      >
        <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{INHABIT_FINDINGS_DRAFT_LEASE_TITLE}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INHABIT_FINDINGS_DRAFT_LEASE_BODY}
        </p>
      </div>
    );
  }

  return null;
}
