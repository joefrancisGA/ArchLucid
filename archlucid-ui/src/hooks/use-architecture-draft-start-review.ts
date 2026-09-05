"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { useReviewStartNavigationProgress } from "@/hooks/use-review-start-navigation-progress";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import {
  validateArchitectureReviewReadiness,
  type ArchitectureDraftFieldState,
} from "@/lib/architecture/architecture-draft-readiness";
import { qualityAttributeMeetsMinimum } from "@/lib/architecture/architecture-draft-structured-brief";
import { ARCHITECTURE_DRAFT_SECTION_ANCHORS } from "@/lib/architecture/architecture-draft-form-section-anchors";
import {
  mergeScopeBulletsIntoBrief,
  scopeBulletsFingerprint,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import {
  architectureDraftQualityAttrEncourageConfirmHrefFromSearch,
  parseArchitectureDraftQualityAttrEncourageOpenFromSearch,
} from "@/lib/architecture/architecture-draft-quality-attr-encourage-confirm-url";
import {
  resolveArchitectureDraftStartReviewEmphasizedStepId,
  resolveArchitectureDraftStartReviewSteps,
} from "@/lib/architecture-draft-start-review-checklist";
import { patchDraftRequest } from "@/lib/api/draft-intake-api";
import { GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS } from "@/lib/guided-intake-copy";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

type UseArchitectureDraftStartReviewOptions = {
  readonly isNewDraft: boolean;
  readonly hasPersistedDraft: boolean;
  readonly briefFrozen: boolean;
  readonly linkedReviewId: string | null;
  readonly effectiveArchitectureId: string;
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly draft: DraftRequestResponse | null;
  readonly saveState: ArchitectureDraftSaveState;
  readonly conflictMessage: string | null;
  readonly saveDraft: () => Promise<boolean>;
  readonly syncServerUpdatedUtc: (serverUpdatedUtc: string) => void;
  readonly scopeGateOpen: boolean;
  readonly setScopeGateOpen: Dispatch<SetStateAction<boolean>>;
  readonly scopeBullets: readonly ScopeUnderstandingBullet[];
  readonly setScopeBullets: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly persistedScopeFingerprint: string | null;
};

export function useArchitectureDraftStartReview(options: UseArchitectureDraftStartReviewOptions) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const qualityAttrEncourageParam = searchParams.get("qualityAttrEncourage");
  const reviewStartProgress = useReviewStartNavigationProgress();
  const [actorSuggestionsUnresolved, setActorSuggestionsUnresolved] = useState(false);
  const [actorSuggestionGateRequestId, setActorSuggestionGateRequestId] = useState(0);
  const [startReviewError, setStartReviewError] = useState<string | null>(null);
  const [qualityAttributesEncouragementOpen, setQualityAttributesEncouragementOpenState] = useState(
    () => parseArchitectureDraftQualityAttrEncourageOpenFromSearch(qualityAttrEncourageParam),
  );

  const syncQualityAttrEncourageToUrl = useCallback(
    (open: boolean) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        architectureDraftQualityAttrEncourageConfirmHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setQualityAttributesEncouragementOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setQualityAttributesEncouragementOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncQualityAttrEncourageToUrl(next);

        return next;
      });
    },
    [syncQualityAttrEncourageToUrl],
  );

  useEffect(() => {
    setQualityAttributesEncouragementOpenState(
      parseArchitectureDraftQualityAttrEncourageOpenFromSearch(qualityAttrEncourageParam),
    );
  }, [qualityAttrEncourageParam]);

  const persistScopeConfirmation = useCallback(
    async (bullets: ScopeUnderstandingBullet[]): Promise<boolean> => {
      options.setScopeBullets(bullets);
      options.setScopeGateOpen(true);

      if (options.isNewDraft && !options.hasPersistedDraft) {
        return true;
      }

      const mergedIntent = mergeScopeBulletsIntoBrief(
        bullets,
        options.fields.freeTextIntent,
      ).trim();

      if (mergedIntent.length < GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
        return false;
      }

      try {
        const patched = await patchDraftRequest(options.effectiveArchitectureId, {
          freeTextIntent: mergedIntent,
        });
        options.syncServerUpdatedUtc(patched.updatedUtc);

        return true;
      } catch {
        return false;
      }
    },
    [
      options.effectiveArchitectureId,
      options.fields.freeTextIntent,
      options.hasPersistedDraft,
      options.isNewDraft,
      options.setScopeBullets,
      options.setScopeGateOpen,
      options.syncServerUpdatedUtc,
    ],
  );

  useEffect(() => {
    if (options.persistedScopeFingerprint === null) {
      return;
    }

    if (scopeBulletsFingerprint(options.scopeBullets) === options.persistedScopeFingerprint) {
      options.setScopeGateOpen(true);
    }
  }, [
    options.persistedScopeFingerprint,
    options.scopeBullets,
    options.setScopeGateOpen,
  ]);

  const reviewReadiness = useMemo(
    () => validateArchitectureReviewReadiness(options.fields, options.actorSet.actors),
    [options.actorSet.actors, options.fields],
  );
  const nameAndScopeConfigured =
    options.fields.systemName.trim().length > 0 &&
    options.fields.freeTextIntent.trim().length >= GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS;
  const qualityReadinessConfigured =
    qualityAttributeMeetsMinimum(options.fields.structuredBrief.qualityAttribute) && reviewReadiness.isValid;
  const draftStartReviewSteps = resolveArchitectureDraftStartReviewSteps({
    nameAndScopeConfigured,
    qualityReadinessConfigured,
    reviewStarted: options.linkedReviewId !== null,
  });
  const draftStartReviewEmphasizedStepId = resolveArchitectureDraftStartReviewEmphasizedStepId({
    nameAndScopeConfigured,
    qualityReadinessConfigured,
    reviewStarted: options.linkedReviewId !== null,
  });
  const needsPersistedDraftBeforeStart = options.isNewDraft && !options.hasPersistedDraft;
  const canStartReview =
    reviewReadiness.isValid &&
    options.scopeGateOpen &&
    !needsPersistedDraftBeforeStart &&
    options.saveState !== "saving" &&
    !options.briefFrozen &&
    options.saveState !== "error" &&
    options.saveState !== "offline" &&
    options.conflictMessage === null;

  useEffect(() => {
    setStartReviewError(null);
  }, [options.fields, options.scopeGateOpen]);

  const executeStartReview = useCallback(async () => {
    if (reviewStartProgress.isPending) {
      return;
    }

    setStartReviewError(null);
    // Staged progress starts before the save round-trip — the whole wait is server-bound, so the
    // operator must see named stages instead of an unchanged page.
    reviewStartProgress.begin();

    try {
      const saved = await options.saveDraft();

      if (!saved) {
        reviewStartProgress.reset();
        setStartReviewError("Save the architecture draft before starting a review.");

        return;
      }

      reviewStartProgress.markPreparingQuestions();

      // Confirmed scope belongs on the server copy of the brief only. Mirroring it into local
      // fields would put the block in the operator's own text and feed it back to the panel.
      if (!options.isNewDraft) {
        const mergedIntent = mergeScopeBulletsIntoBrief(
          options.scopeBullets,
          options.fields.freeTextIntent,
        ).trim();

        if (mergedIntent.length >= GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS) {
          const patched = await patchDraftRequest(options.effectiveArchitectureId, {
            freeTextIntent: mergedIntent,
          });
          options.syncServerUpdatedUtc(patched.updatedUtc);
        }
      }

      if (options.draft !== null) {
        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(options.draft, {
            linkedReviewId: options.linkedReviewId,
          }),
        );
      }

      reviewStartProgress.openReview(startReviewFromArchitectureHref(options.effectiveArchitectureId));
    } catch {
      reviewStartProgress.reset();
      setStartReviewError("Could not start the architecture review. Try again.");
    }
  }, [
    options.draft,
    options.effectiveArchitectureId,
    options.fields.freeTextIntent,
    options.isNewDraft,
    options.linkedReviewId,
    options.saveDraft,
    options.scopeBullets,
    options.syncServerUpdatedUtc,
    reviewStartProgress,
  ]);

  const handleStartReview = useCallback(async () => {
    if (reviewStartProgress.isPending) {
      return;
    }

    if (actorSuggestionsUnresolved) {
      setActorSuggestionGateRequestId((current) => current + 1);

      return;
    }

    // Client-known blockers stay on the form; CTA is disabled until canStartReview.
    if (!canStartReview) {
      return;
    }

    if (!qualityAttributeMeetsMinimum(options.fields.structuredBrief.qualityAttribute)) {
      setQualityAttributesEncouragementOpen(true);

      return;
    }

    await executeStartReview();
  }, [
    actorSuggestionsUnresolved,
    canStartReview,
    executeStartReview,
    options.fields.structuredBrief.qualityAttribute,
    reviewStartProgress.isPending,
  ]);

  const handleEncourageAddQualityAttributes = useCallback(() => {
    setQualityAttributesEncouragementOpen(false);
    scheduleScrollDeepLinkTargetIntoView(ARCHITECTURE_DRAFT_SECTION_ANCHORS.qualityAttributes);
    document
      .getElementById(ARCHITECTURE_DRAFT_SECTION_ANCHORS.qualityAttributes)
      ?.querySelector("input")
      ?.focus();
  }, []);

  const handleContinueWithoutQualityAttributes = useCallback(() => {
    setQualityAttributesEncouragementOpen(false);
    void executeStartReview();
  }, [executeStartReview]);

  return {
    reviewReadiness,
    draftStartReviewSteps,
    draftStartReviewEmphasizedStepId,
    needsPersistedDraftBeforeStart,
    canStartReview,
    actorSuggestionsUnresolved,
    setActorSuggestionsUnresolved,
    actorSuggestionGateRequestId,
    startReviewError,
    qualityAttributesEncouragementOpen,
    setQualityAttributesEncouragementOpen,
    reviewStartProgress,
    handleStartReview,
    handleEncourageAddQualityAttributes,
    handleContinueWithoutQualityAttributes,
    persistScopeConfirmation,
  };
}
