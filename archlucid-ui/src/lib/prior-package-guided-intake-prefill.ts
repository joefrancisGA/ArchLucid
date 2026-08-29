import type { components } from "@/lib/api-types/schemas.generated";
import {
  deriveScopeUnderstandingBullets,
  extractScopeUnderstandingLinesFromBrief,
  stripScopeUnderstandingSection,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { buildDefaultActorSet } from "@/lib/api/draft-intake-api";
import {
  extractGeneratedIntakeBriefTitle,
  isGeneratedIntakeBrief,
} from "@/lib/review-display-title";
import type { ActorDescriptor, ActorKind, ActorOrigin, ActorSet, InteractionContract, TrustOrigin } from "@/types/draft-intake";

const BUSINESS_OUTCOME_MARKER = "\n\nBusiness outcome: ";

const GENERATED_BRIEF_DEFAULT_OUTCOME =
  "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.";

const ATTACHED_FILES_MARKERS = ["\n\nAttached files:", "\n\nAttached architecture evidence:"] as const;

export type PriorPackageGuidedIntakePrefill = {
  readonly systemName: string;
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly actorSet: ActorSet;
  readonly scopeBullets: readonly ScopeUnderstandingBullet[];
  readonly scopeGateOpen: boolean;
};

export type PriorPackageArchitectureRequestLike = {
  readonly systemName?: string | null;
  readonly description?: string | null;
  readonly draftActors?: readonly components["schemas"]["ActorDescriptor"][] | null;
  readonly inlineRequirements?: readonly string[] | null;
};

type ApiActorDescriptor = components["schemas"]["ActorDescriptor"];

function toActorDescriptor(actor: ApiActorDescriptor): ActorDescriptor | null {
  const kind = actor.kind ?? "Human";
  const label = actor.label?.trim();

  if ((label ?? kind).length === 0) {
    return null;
  }

  return {
    label: label || undefined,
    kind,
    trustOrigin: actor.trustOrigin ?? "Internal",
    contract: actor.contract ?? "Sync",
    origin: actor.origin ?? "Asserted",
    confidence: actor.confidence ?? 100,
  };
}

function stripAttachedFilesSection(text: string): string {
  let result = text;

  for (const marker of ATTACHED_FILES_MARKERS) {
    const markerIndex = result.indexOf(marker);

    if (markerIndex >= 0) {
      result = result.slice(0, markerIndex);
    }
  }

  return result.trimEnd();
}

function splitDraftIntakeDescription(description: string): {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
} {
  const markerIndex = description.indexOf(BUSINESS_OUTCOME_MARKER);

  if (markerIndex < 0) {
    return {
      freeTextIntent: stripScopeUnderstandingSection(description),
      businessOutcome: "",
    };
  }

  return {
    freeTextIntent: stripScopeUnderstandingSection(description.slice(0, markerIndex)),
    businessOutcome: stripScopeUnderstandingSection(
      description.slice(markerIndex + BUSINESS_OUTCOME_MARKER.length),
    ),
  };
}

function resolveBusinessOutcome(
  parsedOutcome: string,
  inlineRequirements: readonly string[] | null | undefined,
  generatedBrief: boolean,
): string {
  const trimmedOutcome = parsedOutcome.trim();

  if (trimmedOutcome.length > 0) {
    return trimmedOutcome;
  }

  const inlineOutcome = inlineRequirements?.[0]?.trim() ?? "";

  if (inlineOutcome.length > 0) {
    return inlineOutcome;
  }

  if (generatedBrief) {
    return GENERATED_BRIEF_DEFAULT_OUTCOME;
  }

  return "";
}

function actorSetFromDraftActors(draftActors: readonly ApiActorDescriptor[] | null | undefined): ActorSet {
  const actors = (draftActors ?? [])
    .map(toActorDescriptor)
    .filter((actor): actor is ActorDescriptor => actor !== null);

  if (actors.length === 0) {
    return buildDefaultActorSet();
  }

  return { actors: [...actors] };
}

function scopeBulletsFromPriorIntake(input: {
  readonly description: string;
  readonly systemName: string;
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly actorSet: ActorSet;
}): readonly ScopeUnderstandingBullet[] {
  const persistedScopeLines = extractScopeUnderstandingLinesFromBrief(input.description);

  if (persistedScopeLines.length > 0) {
    return persistedScopeLines.map((line, index) => {
      const colonIndex = line.indexOf(":");
      const label = colonIndex >= 0 ? line.slice(0, colonIndex).trim() : "In-scope item";
      const value = colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : line.trim();

      return {
        id: `prior-scope-${index}`,
        kind: "custom",
        label,
        value,
        source: "inferred",
      };
    });
  }

  return deriveScopeUnderstandingBullets({
    architectureName: input.systemName,
    systemName: input.systemName,
    businessOutcome: input.businessOutcome,
    architectureOverview: input.freeTextIntent,
    intentText: input.freeTextIntent,
    peopleAndSystems: input.actorSet.actors.map((actor) => ({
      label: actor.label,
      kind: actor.kind,
      trustOrigin: actor.trustOrigin,
      contract: actor.contract,
    })),
  });
}

/** Maps a persisted architecture request back onto guided-intake step 0 fields for rerun handoff. */
export function derivePriorPackageGuidedIntakePrefill(
  request: PriorPackageArchitectureRequestLike,
): PriorPackageGuidedIntakePrefill | null {
  const description = request.description?.trim() ?? "";

  if (description.length === 0) {
    return null;
  }

  const generatedBrief = isGeneratedIntakeBrief(description);
  const parsed = splitDraftIntakeDescription(description);
  const systemNameFromBrief = extractGeneratedIntakeBriefTitle(description);
  const systemName = (request.systemName?.trim() || systemNameFromBrief || "").trim();
  const freeTextIntent = generatedBrief
    ? stripAttachedFilesSection(stripScopeUnderstandingSection(description))
    : parsed.freeTextIntent.trim();
  const businessOutcome = resolveBusinessOutcome(
    parsed.businessOutcome,
    request.inlineRequirements,
    generatedBrief,
  );
  const actorSet = actorSetFromDraftActors(request.draftActors);

  if (systemName.length === 0 && freeTextIntent.length === 0 && businessOutcome.length === 0) {
    return null;
  }

  const scopeBullets = scopeBulletsFromPriorIntake({
    description,
    systemName,
    freeTextIntent,
    businessOutcome,
    actorSet,
  });

  return {
    systemName,
    freeTextIntent,
    businessOutcome,
    actorSet,
    scopeBullets,
    scopeGateOpen: scopeBullets.length > 0,
  };
}
