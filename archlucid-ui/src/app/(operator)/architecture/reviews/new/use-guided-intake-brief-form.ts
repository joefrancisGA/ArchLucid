"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { starterArchitectureTemplates } from "@/data/starter-templates";
import {
  mergeScopeBulletsIntoBrief,
  scopeBriefLines,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { deriveEvidencePresenceFromFileNames } from "@/lib/evidence-gap-forecast";
import { appendIntakeAttachedFileNames } from "@/lib/intake-attached-file-names";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER,
  buildGuidedIntakeCreationAdvanceBlockerMessage,
} from "@/lib/guided-intake-copy";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";
import type { ActorSet } from "@/types/draft-intake";
import { parseScopeGateOpenFromSearch, scopeGateHrefFromSearch } from "@/lib/architecture/scope-gate-url";

import { MIN_INTENT_CHARS, MIN_OUTCOME_CHARS } from "./guided-intake-steps";
import {
  hasGuidedIntakeExampleTemplatePrefillApplied,
  markGuidedIntakeExampleTemplatePrefillApplied,
} from "./guided-intake-example-template-prefill-once";

type GuidedIntakeBriefFormOptions = {
  readonly exampleTemplate: ReviewIntakeExampleTemplate | null;
  readonly isCreateArchitectureFlow: boolean;
  readonly requiresSystemName?: boolean;
};

/**
 * The brief the operator writes on step 0, plus everything derived from it.
 *
 * Kept apart from the architecture draft workflow because these fields are pure local editing state: they exist
 * before any draft does, and the workflow only reads them (or replaces them wholesale when it loads
 * a saved architecture or forks a what-if branch).
 */
export type GuidedIntakeBriefForm = ReturnType<typeof useGuidedIntakeBriefForm>;

export function useGuidedIntakeBriefForm(options: GuidedIntakeBriefFormOptions) {
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const urlScopeGateOpen = parseScopeGateOpenFromSearch(searchParams.get("scopeGate"));
  const [freeTextIntent, setFreeTextIntent] = useState("");
  const [businessOutcome, setBusinessOutcome] = useState("");
  const [systemName, setSystemName] = useState("");
  const [actorSet, setActorSet] = useState<ActorSet>(() => ({ actors: [] }));
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const [scopeGateOpen, setScopeGateOpenState] = useState(urlScopeGateOpen);
  const scopeGateOpenRef = useRef(scopeGateOpen);
  scopeGateOpenRef.current = scopeGateOpen;
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [priorAttachedFileNames, setPriorAttachedFileNames] = useState<readonly string[]>([]);

  const {
    exampleTemplate,
    isCreateArchitectureFlow,
    requiresSystemName = false,
  } = options;
  const starterTemplate = useMemo(() => {
    const presetId = searchParams.get("preset")?.trim() ?? "";

    return starterArchitectureTemplates.find((template) => template.id === presetId) ?? null;
  }, [searchParams]);
  const starterTemplatePrefillApplied = useRef(false);

  const setScopeGateOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      setScopeGateOpenState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;

        if (scopeGateOpenRef.current !== resolved) {
          scopeGateOpenRef.current = resolved;
          commitHrefIfChanged(scopeGateHrefFromSearch(readWindowLocationSearch(), resolved, pathname), {
            notify: false,
          });
        }

        return resolved;
      });
    },
    [pathname],
  );

  useEffect(() => {
    if (scopeGateOpenRef.current !== urlScopeGateOpen) {
      scopeGateOpenRef.current = urlScopeGateOpen;
      setScopeGateOpenState(urlScopeGateOpen);
    }
  }, [urlScopeGateOpen]);

  useEffect(() => {
    const syncScopeGateFromUrl = (): void => {
      const next = parseScopeGateOpenFromSearch(
        new URLSearchParams(readWindowLocationSearch()).get("scopeGate"),
      );

      if (scopeGateOpenRef.current === next) {
        return;
      }

      scopeGateOpenRef.current = next;
      setScopeGateOpenState(next);
    };

    syncScopeGateFromUrl();
    window.addEventListener("popstate", syncScopeGateFromUrl);

    return () => {
      window.removeEventListener("popstate", syncScopeGateFromUrl);
    };
  }, []);

  useEffect(() => {
    if (exampleTemplate === null || hasGuidedIntakeExampleTemplatePrefillApplied(exampleTemplate.id)) {
      return;
    }

    markGuidedIntakeExampleTemplatePrefillApplied(exampleTemplate.id);
    setFreeTextIntent(exampleTemplate.briefText);
    setBusinessOutcome(exampleTemplate.businessOutcome);
    setSystemName(exampleTemplate.systemName);
  }, [exampleTemplate]);

  useEffect(() => {
    if (starterTemplate === null || starterTemplatePrefillApplied.current) {
      return;
    }

    starterTemplatePrefillApplied.current = true;
    setFreeTextIntent(starterTemplate.values.description ?? "");
    setBusinessOutcome(`A review-ready architecture package for ${starterTemplate.label}.`);
    setSystemName(starterTemplate.values.systemName ?? "");
  }, [starterTemplate]);

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

    if ((isCreateArchitectureFlow || requiresSystemName) && !systemNameMeetsMinimum) {
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
    // settled before the wizard leaves this step — the architecture draft is immutable once it is admitted.
    const scopeConfirmed = scopeGateOpen && scopeBullets.length > 0;

    if (!scopeConfirmed) {
      blockers.push(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
    }

    return blockers;
  }, [
    actorSet.actors.length,
    intentFieldLabel,
    intentMeetsMinimum,
    isCreateArchitectureFlow,
    requiresSystemName,
    outcomeMeetsMinimum,
    scopeBullets.length,
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
        label: actor.label,
        kind: actor.kind,
        trustOrigin: actor.trustOrigin,
        contract: actor.contract,
      })),
    }),
    [actorSet.actors, businessOutcome, freeTextIntent, systemName],
  );

  const guidedIntakeEvidencePresence = useMemo(() => {
    if (evidenceFiles.length > 0) {
      return deriveEvidencePresenceFromFileNames(evidenceFiles.map((file) => file.name));
    }

    if (freeTextIntent.trim().length > 0 || businessOutcome.trim().length > 0) {
      return deriveEvidencePresenceFromFileNames(["architecture-brief.md"]);
    }

    return deriveEvidencePresenceFromFileNames([]);
  }, [businessOutcome, evidenceFiles, freeTextIntent]);

  /** Brief text as the server should store it: confirmed scope bullets merged into the prose. */
  const briefTextForAdmission = useCallback((): string => {
    const mergedBrief = mergeScopeBulletsIntoBrief(scopeBullets, freeTextIntent);

    if (evidenceFiles.length === 0) {
      return mergedBrief;
    }

    return appendIntakeAttachedFileNames(
      mergedBrief,
      evidenceFiles.map((file) => file.name),
    );
  }, [evidenceFiles, freeTextIntent, scopeBullets]);

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
    evidenceFiles,
    setEvidenceFiles,
    priorAttachedFileNames,
    setPriorAttachedFileNames,
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
