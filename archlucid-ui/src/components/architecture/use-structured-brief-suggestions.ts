"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS, draftArchitectureRequest } from "@/lib/api/architecture-request-draft-api";
import { draftArchitectureRequestWithPoll } from "@/lib/api/architecture-request-draft-async-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  countStructuredBriefSuggestionApplyDelta,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse,
  applyFailureModeSuggestionIfEmpty,
  buildArchitectureDraftSuggestionSourceText,
  hasArchitectureContextForFailureModeSuggestion,
  resolveFailureModeSuggestion,
} from "@/lib/architecture/architecture-draft-structured-brief-suggestions";
import {
  estimateStructuredBriefSuggestDuration,
  formatStructuredBriefSuggestDurationBand,
} from "@/lib/architecture/structured-brief-suggest-duration-estimate";

type StructuredBriefSuggestionContextInput = Pick<
  ArchitectureDraftStructuredBriefState,
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities"
  | "qualityAttribute"
>;

export type UseStructuredBriefSuggestionsInput = {
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly suggestFromOverviewNonce?: number;
  readonly onStructuredBriefChange: (brief: ArchitectureDraftStructuredBriefState) => void;
};

function buildStructuredBriefSuggestionContext(
  brief: ArchitectureDraftStructuredBriefState,
): StructuredBriefSuggestionContextInput {
  return {
    confirmedConstraints: brief.confirmedConstraints,
    confirmedAssumptions: brief.confirmedAssumptions,
    confirmedRequiredCapabilities: brief.confirmedRequiredCapabilities,
    qualityAttribute: brief.qualityAttribute,
  };
}

function buildSuggestionSourceText(
  input: UseStructuredBriefSuggestionsInput,
  brief: ArchitectureDraftStructuredBriefState,
  includeStructuredBrief: boolean,
): string {
  return buildArchitectureDraftSuggestionSourceText({
    architectureOverview: input.freeTextIntent,
    systemName: input.systemName,
    businessOutcome: input.businessOutcome,
    structuredBrief: includeStructuredBrief ? buildStructuredBriefSuggestionContext(brief) : undefined,
  }).trim();
}

function suggestionSourceMeetsMinimum(sourceText: string): boolean {
  return sourceText.trim().length >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS;
}

function mapEvidenceContradictedAssumptions(
  items: readonly { readonly assumption?: string; readonly evidenceNote?: string }[] | undefined,
): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const item of items ?? []) {
    const assumption = item.assumption?.trim() ?? "";

    if (assumption.length === 0) {
      continue;
    }

    mapped[assumption] = item.evidenceNote?.trim() ?? "";
  }

  return mapped;
}

export type StructuredBriefSuggestError = {
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

export function useStructuredBriefSuggestions(input: UseStructuredBriefSuggestionsInput) {
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestStageLabel, setSuggestStageLabel] = useState<string | null>(null);
  const [suggestEmpty, setSuggestEmpty] = useState(false);
  const [suggestAddedCount, setSuggestAddedCount] = useState<number | null>(null);
  const [suggestError, setSuggestError] = useState<StructuredBriefSuggestError | null>(null);
  const [failureModeSuggestBusy, setFailureModeSuggestBusy] = useState(false);
  const [failureModeSuggestEmpty, setFailureModeSuggestEmpty] = useState(false);
  const [failureModeSuggestApplied, setFailureModeSuggestApplied] = useState(false);
  const [failureModeSuggestError, setFailureModeSuggestError] = useState<StructuredBriefSuggestError | null>(null);
  const [evidenceContradictedAssumptions, setEvidenceContradictedAssumptions] = useState<Record<string, string>>({});

  const brief = input.structuredBrief;
  const overviewTrimmedLength = input.freeTextIntent.trim().length;
  const structuredBriefContext = buildStructuredBriefSuggestionContext(brief);
  const failureModeSourceText = buildSuggestionSourceText(input, brief, true);
  const hasFailureModeContext = hasArchitectureContextForFailureModeSuggestion({
    architectureOverview: input.freeTextIntent,
    structuredBrief: structuredBriefContext,
  });
  const canSuggestFailureMode =
    hasFailureModeContext
    && suggestionSourceMeetsMinimum(failureModeSourceText)
    && input.disabled !== true
    && input.blocksLlmExecution !== true
    && !failureModeSuggestBusy
    && !suggestBusy;

  const canSuggestFromOverview =
    overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
    && input.disabled !== true
    && input.blocksLlmExecution !== true
    && !suggestBusy
    && !failureModeSuggestBusy;

  const suggestDurationBand = estimateStructuredBriefSuggestDuration(overviewTrimmedLength);
  const suggestDurationHint = formatStructuredBriefSuggestDurationBand(suggestDurationBand);

  useEffect(() => {
    setEvidenceContradictedAssumptions({});
  }, [input.freeTextIntent]);

  const runSuggestFromOverview = useCallback(async (): Promise<void> => {
    const freeTextDescription = buildSuggestionSourceText(input, brief, true);

    if (
      freeTextDescription.length < ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
      || input.disabled === true
      || input.blocksLlmExecution === true
    ) {
      return;
    }

    setSuggestBusy(true);
    setSuggestStageLabel("Queued");
    setSuggestError(null);
    setSuggestEmpty(false);
    setSuggestAddedCount(null);
    setFailureModeSuggestApplied(false);
    setFailureModeSuggestEmpty(false);

    try {
      const { response } = await draftArchitectureRequestWithPoll(
        {
          freeTextDescription,
          currentConstraints: [...brief.confirmedConstraints, ...brief.suggestedConstraints],
          currentAssumptions: [...brief.confirmedAssumptions, ...brief.suggestedAssumptions],
          confirmedAssumptions: brief.confirmedAssumptions,
        },
        {
          onUpdate: (operation) => {
            setSuggestStageLabel(operation.stepLabel);
          },
        },
      );
      const applied = applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse({
        brief,
        sourceText: freeTextDescription,
        suggestedConstraints: response.suggestedConstraints ?? [],
        suggestedAssumptions: response.suggestedAssumptions ?? [],
        suggestedCapabilities: response.suggestedCapabilities ?? [],
        suggestedFailureModeNote: response.suggestedFailureModeNote,
      });
      const addedSuggestionCount = countStructuredBriefSuggestionApplyDelta(brief, applied.brief);

      input.onStructuredBriefChange(applied.brief);
      setEvidenceContradictedAssumptions(
        mapEvidenceContradictedAssumptions(response.evidenceContradictedAssumptions),
      );
      setSuggestEmpty(addedSuggestionCount === 0);
      setSuggestAddedCount(addedSuggestionCount > 0 ? addedSuggestionCount : null);

      if (addedSuggestionCount > 0) {
        window.requestAnimationFrame(() => {
          document.getElementById("architecture-draft-constraints")?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      }
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setSuggestError({
          message: error.message,
          problem: error.problem,
          correlationId: error.correlationId,
        });
      } else {
        setSuggestError({
          message: error instanceof Error ? error.message : "Could not suggest structured brief items.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setSuggestBusy(false);
      setSuggestStageLabel(null);
    }
  }, [brief, input]);

  const suggestFromOverviewMutation = useMutation({
    mutationFn: runSuggestFromOverview,
  });

  function onSuggestFromOverview(): void {
    suggestFromOverviewMutation.mutate();
  }

  useEffect(() => {
    if (input.suggestFromOverviewNonce === undefined || input.suggestFromOverviewNonce < 1) {
      return;
    }

    suggestFromOverviewMutation.mutate();
  }, [input.suggestFromOverviewNonce, suggestFromOverviewMutation]);

  async function onSuggestFailureMode(): Promise<void> {
    if (!canSuggestFailureMode) {
      return;
    }

    setFailureModeSuggestBusy(true);
    setFailureModeSuggestError(null);
    setFailureModeSuggestEmpty(false);
    setFailureModeSuggestApplied(false);

    try {
      const response = await draftArchitectureRequest({
        freeTextDescription: failureModeSourceText,
        currentConstraints: [...brief.confirmedConstraints, ...brief.suggestedConstraints],
        currentAssumptions: [...brief.confirmedAssumptions, ...brief.suggestedAssumptions],
      });
      const failureModeSuggestion = resolveFailureModeSuggestion({
        llmSuggestion: response.suggestedFailureModeNote,
        sourceText: failureModeSourceText,
      });
      const applied = applyFailureModeSuggestionIfEmpty(brief, failureModeSuggestion);

      input.onStructuredBriefChange(applied.brief);
      setFailureModeSuggestApplied(applied.applied);
      setFailureModeSuggestEmpty(!applied.applied && (failureModeSuggestion?.trim().length ?? 0) === 0);
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setFailureModeSuggestError({
          message: error.message,
          problem: error.problem,
          correlationId: error.correlationId,
        });
      } else {
        setFailureModeSuggestError({
          message: error instanceof Error ? error.message : "Could not suggest failure mode and recovery.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setFailureModeSuggestBusy(false);
    }
  }

  return {
    overviewTrimmedLength,
    failureModeSourceText,
    canSuggestFromOverview,
    canSuggestFailureMode,
    suggestBusy,
    suggestStageLabel,
    suggestEmpty,
    suggestAddedCount,
    suggestError,
    suggestDurationHint,
    evidenceContradictedAssumptions,
    setEvidenceContradictedAssumptions,
    onSuggestFromOverview,
    onSuggestFailureMode,
    failureModeSuggestBusy,
    failureModeSuggestEmpty,
    failureModeSuggestApplied,
    failureModeSuggestError,
  };
}
