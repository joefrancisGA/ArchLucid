"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  mergeScopeBulletsIntoBrief,
  scopeBriefLines,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { deriveEvidencePresenceFromFileNames } from "@/lib/evidence-gap-forecast";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER,
  buildGuidedIntakeCreationAdvanceBlockerMessage,
} from "@/lib/guided-intake-copy";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";
import type { ActorSet } from "@/types/draft-intake";

import { MIN_INTENT_CHARS, MIN_OUTCOME_CHARS } from "./guided-intake-steps";

type GuidedIntakeBriefFormOptions = {
  readonly exampleTemplate: ReviewIntakeExampleTemplate | null;
  readonly isCreateArchitectureFlow: boolean;
};

/**
 * The brief the operator writes on step 0, plus everything derived from it.
 *
 * Kept apart from the draft workflow because these fields are pure local editing state: they exist
 * before any draft does, and the workflow only reads them (or replaces them wholesale when it loads
 * a saved architecture or forks a what-if branch).
 */
export type GuidedIntakeBriefForm = ReturnType<typeof useGuidedIntakeBriefForm>;

export function useGuidedIntakeBriefForm(options: GuidedIntakeBriefFormOptions) {
  const [freeTextIntent, setFreeTextIntent] = useState("");
  const [businessOutcome, setBusinessOutcome] = useState("");
  const [systemName, setSystemName] = useState("");
  const [actorSet, setActorSet] = useState<ActorSet>(() => ({ actors: [] }));
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const [scopeGateOpen, setScopeGateOpen] = useState(false);
  const exampleTemplatePrefillAppliedRef = useRef(false);

  const { exampleTemplate, isCreateArchitectureFlow } = options;

  useEffect(() => {
    if (exampleTemplate === null || exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    exampleTemplatePrefillAppliedRef.current = true;
    setFreeTextIntent(exampleTemplate.briefText);
    setBusinessOutcome(exampleTemplate.businessOutcome);
    setSystemName(exampleTemplate.systemName);
  }, [exampleTemplate]);

  const intentTrimmedLength = freeTextIntent.trim().length;
  const intentMeetsMinimum = intentTrimmedLength >= MIN_INTENT_CHARS;
  const outcomeTrimmedLength = businessOutcome.trim().length;
  const outcomeMeetsMinimum = outcomeTrimmedLength >= MIN_OUTCOME_CHARS;
  const systemNameMeetsMinimum = systemName.trim().length > 0;

  const intentFieldLabel = isCreateArchitectureFlow
    ? GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL
    : GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL;

  const advanceBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (isCreateArchitectureFlow && !systemNameMeetsMinimum) {
      blockers.push("system name");
    }

    if (!intentMeetsMinimum) {
      blockers.push(intentFieldLabel.toLowerCase());
    }

    if (!outcomeMeetsMinimum) {
      blockers.push("business outcome");
    }

    if (!isCreateArchitectureFlow && actorSet.actors.length === 0) {
      blockers.push("at least one person or system");
    }

    // Confirmed scope is merged into the brief by the patch that precedes admission, so it has to be
    // settled before the wizard leaves this step — the draft is immutable once it is admitted.
    if (!scopeGateOpen) {
      blockers.push(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
    }

    return blockers;
  }, [
    actorSet.actors.length,
    intentFieldLabel,
    intentMeetsMinimum,
    isCreateArchitectureFlow,
    outcomeMeetsMinimum,
    scopeGateOpen,
    systemNameMeetsMinimum,
  ]);

  const advanceHint = buildGuidedIntakeCreationAdvanceBlockerMessage(advanceBlockers);
  const confirmedScopeLines = useMemo(() => scopeBriefLines(scopeBullets), [scopeBullets]);

  const scopeUnderstandingInput = useMemo(
    () => ({
      architectureName: systemName,
      businessOutcome,
      architectureOverview: freeTextIntent,
      intentText: freeTextIntent,
      peopleAndSystems: actorSet.actors.map((actor) => ({
        label: actor.label?.trim() || actor.kind,
        kind: actor.kind,
      })),
    }),
    [actorSet.actors, businessOutcome, freeTextIntent, systemName],
  );

  const guidedIntakeEvidencePresence = useMemo(
    () =>
      deriveEvidencePresenceFromFileNames(
        freeTextIntent.trim().length > 0 || businessOutcome.trim().length > 0 ? ["architecture-brief.md"] : [],
      ),
    [businessOutcome, freeTextIntent],
  );

  /** Brief text as the server should store it: confirmed scope bullets merged into the prose. */
  const briefTextForAdmission = useCallback(
    (): string => mergeScopeBulletsIntoBrief(scopeBullets, freeTextIntent),
    [freeTextIntent, scopeBullets],
  );

  return {
    freeTextIntent,
    setFreeTextIntent,
    businessOutcome,
    setBusinessOutcome,
    systemName,
    setSystemName,
    actorSet,
    setActorSet,
    focusedPilotModeEnabled,
    setFocusedPilotModeEnabled,
    scopeBullets,
    setScopeBullets,
    scopeGateOpen,
    setScopeGateOpen,
    intentTrimmedLength,
    intentMeetsMinimum,
    outcomeTrimmedLength,
    outcomeMeetsMinimum,
    systemNameMeetsMinimum,
    intentFieldLabel,
    advanceBlockers,
    advanceHint,
    confirmedScopeLines,
    scopeUnderstandingInput,
    guidedIntakeEvidencePresence,
    briefTextForAdmission,
  };
}
