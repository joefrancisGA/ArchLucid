import type { ActorDescriptor, ActorSet } from "@/types/draft-intake";

export const DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL =
  "Actor was not named in the brief" as const;

export const DRAFT_INTAKE_SYSTEM_NAME_NOT_STORED_LABEL = "System name was not stored." as const;

export const DRAFT_INTAKE_REDIRECT_REASON_NOT_STORED_LABEL = "Redirect reason was not stored." as const;

export const DRAFT_INTAKE_VERDICT_SUMMARY_NOT_STORED_LABEL = "Verdict summary was not stored." as const;

export const DRAFT_INTAKE_VERDICT_SUMMARY_STORED_EMPTY_LABEL = "Verdict summary was stored empty." as const;

export const GENERATED_BRIEF_BUSINESS_OUTCOME_NOT_STORED_LABEL =
  "Generated-brief business outcome was not stored." as const;

export const DRAFT_INTAKE_ACTOR_KIND_NOT_CHOSEN_LABEL = "Kind was not chosen." as const;

export const DRAFT_INTAKE_ACTOR_TRUST_ORIGIN_NOT_CHOSEN_LABEL = "Trust origin was not chosen." as const;

export const DRAFT_INTAKE_ACTOR_INTERACTION_NOT_CHOSEN_LABEL = "Interaction was not chosen." as const;

/** Manual actor row before the operator picks kind, trust, and interaction axes. */
export function isDraftIntakeActorAxisUnset(actor: ActorDescriptor): boolean {
  return (
    actor.origin === "Inferred"
    && (actor.label?.trim() ?? "") === ""
    && actor.kind === "Human"
    && actor.trustOrigin === "Internal"
    && actor.contract === "Sync"
    && actor.confidence === 70
  );
}

/** Placeholder actor when persisted intake omitted actors — not a confirmed Primary operator. */
export function buildMissingDraftActorsPlaceholderSet(): ActorSet {
  return {
    actors: [
      {
        label: DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL,
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Inferred",
        confidence: 70,
      },
    ],
  };
}

export function isDraftIntakeActorNotNamedPlaceholder(actor: ActorDescriptor): boolean {
  const label = actor.label?.trim() ?? "";

  return label === DRAFT_INTAKE_ACTOR_NOT_NAMED_IN_BRIEF_LABEL;
}

export function formatDraftIntakeVerdictSummaryForDisplay(summary: string | null | undefined): string {
  if (summary == null) {
    return DRAFT_INTAKE_VERDICT_SUMMARY_NOT_STORED_LABEL;
  }

  const trimmed = summary.trim();

  if (trimmed.length === 0) {
    return DRAFT_INTAKE_VERDICT_SUMMARY_STORED_EMPTY_LABEL;
  }

  return trimmed;
}

export function formatDraftIntakeRedirectReasonForDisplay(redirectReason: string): string {
  const trimmed = redirectReason.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return DRAFT_INTAKE_REDIRECT_REASON_NOT_STORED_LABEL;
}

export function formatDraftIntakeSystemNameForDisplay(systemName: string): string {
  const trimmed = systemName.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return DRAFT_INTAKE_SYSTEM_NAME_NOT_STORED_LABEL;
}

export function formatGeneratedBriefBusinessOutcomeForDisplay(businessOutcome: string): string {
  const trimmed = businessOutcome.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return GENERATED_BRIEF_BUSINESS_OUTCOME_NOT_STORED_LABEL;
}
