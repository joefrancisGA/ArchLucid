"use client";

import { useCallback, useId, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  buildStructuredBriefSuggestionExplainCacheKey,
  explainStructuredBriefSuggestion,
  type StructuredBriefSuggestionKind,
} from "@/lib/api/structured-brief-suggestion-explain-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  getStructuredBriefSuggestionExplainCache,
  setStructuredBriefSuggestionExplainCache,
} from "@/lib/architecture/structured-brief-suggestion-explain-cache";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_EXPLAIN_SUGGESTION_BUTTON,
  GUIDED_INTAKE_EXPLAIN_SUGGESTION_LOADING,
  GUIDED_INTAKE_EXPLAIN_SUGGESTION_RETRY_BUTTON,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type StructuredBriefSuggestionExplainPanelProps = {
  readonly suggestionKind: StructuredBriefSuggestionKind;
  readonly suggestionText: string;
  readonly sourceText: string;
  readonly disabled?: boolean;
  readonly testId?: string;
};

/**
 * Disclosure that fetches a plain-English rationale on first open.
 * Confirm and Deny stay on the parent row; this panel only reveals copy.
 */
export function StructuredBriefSuggestionExplainPanel(
  props: StructuredBriefSuggestionExplainPanelProps,
): React.JSX.Element {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const loadExplanation = useCallback(async (): Promise<void> => {
    const cacheKey = await buildStructuredBriefSuggestionExplainCacheKey({
      suggestionKind: props.suggestionKind,
      suggestionText: props.suggestionText,
      sourceText: props.sourceText,
    });

    const cached = getStructuredBriefSuggestionExplainCache(cacheKey);

    if (cached !== null) {
      setExplanation(cached.explanation);
      setError(null);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await explainStructuredBriefSuggestion({
        sourceText: props.sourceText,
        suggestionKind: props.suggestionKind,
        suggestionText: props.suggestionText,
      });

      setStructuredBriefSuggestionExplainCache(cacheKey, response);
      setExplanation(response.explanation);
    } catch (caught: unknown) {
      if (isApiRequestError(caught)) {
        setError({
          message: caught.message,
          problem: caught.problem,
          correlationId: caught.correlationId,
        });
      } else {
        setError({
          message: caught instanceof Error ? caught.message : "Could not load explanation.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [props.suggestionKind, props.suggestionText, props.sourceText]);

  const handleOpenChange = (nextOpen: boolean): void => {
    setOpen(nextOpen);

    if (nextOpen && explanation === null && !loading) {
      void loadExplanation();
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      data-testid={props.testId ?? "structured-brief-suggestion-explain"}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled === true}
          aria-expanded={open}
          aria-controls={panelId}
          className="gap-1"
        >
          <span>{GUIDED_INTAKE_EXPLAIN_SUGGESTION_BUTTON}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-180" : "rotate-0")}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        id={panelId}
        className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
        data-testid={props.testId ? `${props.testId}-panel` : "structured-brief-suggestion-explain-panel"}
      >
        {loading ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
          >
            {GUIDED_INTAKE_EXPLAIN_SUGGESTION_LOADING}
          </p>
        ) : null}
        {error !== null ? (
          <div className="space-y-2">
            <OperatorApiProblem
              problem={error.problem}
              fallbackMessage={error.message}
              correlationId={error.correlationId}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid={props.testId ? `${props.testId}-retry` : "structured-brief-suggestion-explain-retry"}
              onClick={() => {
                void loadExplanation();
              }}
            >
              {GUIDED_INTAKE_EXPLAIN_SUGGESTION_RETRY_BUTTON}
            </Button>
          </div>
        ) : null}
        {explanation !== null && error === null && !loading ? (
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {explanation}
          </p>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
