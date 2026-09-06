"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS, draftArchitectureRequest } from "@/lib/api/architecture-request-draft-api";
import {
  draftArchitectureRequestWithPoll,
  resumeDraftArchitectureRequestWithPoll,
} from "@/lib/api/architecture-request-draft-async-api";
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
import { ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture/architecture-routes";
import {
  findTrackedAdvisoryDraftForArchitecture,
  markAdvisoryDraftInFlightConsumed,
} from "@/lib/operations/advisory-draft-in-flight";

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
  readonly draftId?: string;
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

  useEffect(() => {
    setEvidenceContradictedAssumptions({});
  }, [input.freeTextIntent]);

  const draftId = input.draftId?.trim() || ARCHITECTURE_NEW_DRAFT_SEGMENT;
  const resumeStartedRef = useRef(false);
  const suggestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      suggestAbortRef.current?.abort();
    };
  }, []);

  const applySuggestResponse = useCallback(
    (
      response: {
        readonly suggestedConstraints?: readonly string[];
        readonly suggestedAssumptions?: readonly string[];
        readonly suggestedCapabilities?: readonly string[];
        readonly suggestedFailureModeNote?: string | null;
        readonly evidenceContradictedAssumptions?: readonly {
          readonly assumption?: string;
          readonly evidenceNote?: string;
        }[];
      },
      sourceText: string,
    ): void => {
      const applied = applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse({
        brief,
        sourceText,
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
    },
    [brief, input],
  );

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

    suggestAbortRef.current?.abort();
    const abortController = new AbortController();
    suggestAbortRef.current = abortController;

    try {
      const { response, operation } = await draftArchitectureRequestWithPoll(
        {
          freeTextDescription,
          currentConstraints: [...brief.confirmedConstraints, ...brief.suggestedConstraints],
          currentAssumptions: [...brief.confirmedAssumptions, ...brief.suggestedAssumptions],
          confirmedAssumptions: brief.confirmedAssumptions,
        },
        {
          draftId,
          signal: abortController.signal,
          onUpdate: (operationUpdate) => {
            setSuggestStageLabel(operationUpdate.stepLabel);
          },
        },
      );
      applySuggestResponse(response, freeTextDescription);
      markAdvisoryDraftInFlightConsumed(operation.operationId);
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      const tracked = findTrackedAdvisoryDraftForArchitecture(draftId);

      if (tracked !== null) {
        markAdvisoryDraftInFlightConsumed(tracked.operationId);
      }

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
  }, [applySuggestResponse, draftId, brief, input]);

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

  // Returning to this draft should finish applying a queued Suggest from overview that kept running
  // after the operator left the page.
  useEffect(() => {
    if (resumeStartedRef.current) {
      return;
    }

    const tracked = findTrackedAdvisoryDraftForArchitecture(draftId);

    if (tracked === null) {
      return;
    }

    resumeStartedRef.current = true;
    const operationId = tracked.operationId;
    const freeTextDescription = buildSuggestionSourceText(input, brief, true);

    setSuggestBusy(true);
    setSuggestStageLabel(tracked.stepLabel);
    setSuggestError(null);

    suggestAbortRef.current?.abort();
    const abortController = new AbortController();
    suggestAbortRef.current = abortController;

    void (async () => {
      try {
        const { response } = await resumeDraftArchitectureRequestWithPoll(operationId, {
          draftId,
          signal: abortController.signal,
          onUpdate: (operationUpdate) => {
            setSuggestStageLabel(operationUpdate.stepLabel);
          },
        });
        applySuggestResponse(response, freeTextDescription);
        markAdvisoryDraftInFlightConsumed(operationId);
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }

        markAdvisoryDraftInFlightConsumed(operationId);

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
    })();
  }, [applySuggestResponse, draftId, brief, input]);

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

export type StructuredBriefSuggestionsState = ReturnType<typeof useStructuredBriefSuggestions>;
