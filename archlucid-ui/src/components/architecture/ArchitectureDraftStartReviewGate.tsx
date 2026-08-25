"use client";

import type { ArchitectureDraftValidationResult } from "@/lib/architecture/architecture-draft-readiness";
import { GUIDED_INTAKE_ACTOR_SUGGESTIONS_READINESS_HINT } from "@/lib/guided-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatArchitectureReviewReadinessMessage } from "@/lib/architecture/architecture-review-readiness-copy";
import { cn } from "@/lib/utils";

type ArchitectureDraftStartReviewGateProps = {
  readonly linkedReviewId: string | null;
  readonly briefFrozen: boolean;
  readonly reviewReadiness: ArchitectureDraftValidationResult;
  readonly needsPersistedDraftBeforeStart: boolean;
  readonly scopeGateOpen: boolean;
  readonly actorSuggestionsUnresolved: boolean;
};

export function ArchitectureDraftStartReviewGate(
  props: ArchitectureDraftStartReviewGateProps,
): React.JSX.Element | null {
  if (props.linkedReviewId !== null || props.briefFrozen) {
    return null;
  }

  return (
    <>
      {!props.reviewReadiness.isValid ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-red-800 dark:text-red-300")}
          role="alert"
          data-testid="architecture-draft-review-readiness"
        >
          {formatArchitectureReviewReadinessMessage(props.reviewReadiness.blockers)}
        </p>
      ) : null}
      {props.reviewReadiness.isValid &&
      !props.needsPersistedDraftBeforeStart &&
      props.scopeGateOpen &&
      props.actorSuggestionsUnresolved ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
          role="status"
          data-testid="architecture-draft-actor-suggestions-readiness"
        >
          {GUIDED_INTAKE_ACTOR_SUGGESTIONS_READINESS_HINT}
        </p>
      ) : null}
      {props.reviewReadiness.isValid &&
      !props.needsPersistedDraftBeforeStart &&
      !props.scopeGateOpen ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
          role="status"
          data-testid="architecture-draft-scope-readiness"
        >
          Confirm the in-scope understanding before starting a review.
        </p>
      ) : null}
    </>
  );
}
