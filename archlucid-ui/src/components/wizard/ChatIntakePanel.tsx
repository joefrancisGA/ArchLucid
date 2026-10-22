"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseChatIntake } from "@/lib/api/architecture-chat-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { mergeChatIntakeIntoWizardValues } from "@/lib/chat-intake-to-wizard";
import { useWizardAiSuggestedFields } from "@/lib/wizard-ai-suggested-fields";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type ChatIntakePanelProps = {
  /** Called after wizard fields are populated so parents can advance steps or show confirmation. */
  onParsed?: () => void;
};

/**
 * Paste-first intake: maps unstructured text into wizard fields via POST /v1/architecture/chat-intake.
 */
export function ChatIntakePanel(props: ChatIntakePanelProps) {
  const { onParsed } = props;
  const { getValues, reset, clearErrors } = useFormContext<WizardFormValues>();
  const { markAiSuggested } = useWizardAiSuggestedFields();
  const [rawText, setRawText] = useState("");
  const [parseBusy, setParseBusy] = useState(false);
  const [parseError, setParseError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  async function onParseArchitecture(): Promise<void> {
    const trimmed = rawText.trim();

    if (trimmed.length < 20 || parseBusy) {
      return;
    }

    setParseBusy(true);
    setParseError(null);
    setParseSuccess(null);

    try {
      const parsed = await parseChatIntake(trimmed);
      const merged = mergeChatIntakeIntoWizardValues(getValues(), parsed);

      clearErrors();
      reset(merged, { keepDefaultValues: false });

      markAiSuggested("constraints", parsed.constraints ?? []);
      markAiSuggested("requiredCapabilities", parsed.requiredCapabilities ?? []);
      markAiSuggested("assumptions", parsed.assumptions ?? []);
      markAiSuggested("topologyHints", parsed.topologyHints ?? []);
      markAiSuggested("securityBaselineHints", parsed.securityBaselineHints ?? []);

      setParseSuccess("Parsed into the wizard below — review every field before submitting.");
      onParsed?.();
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setParseError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setParseError({
          message: e instanceof Error ? e.message : "Could not parse architecture text.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setParseBusy(false);
    }
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="chat-intake-panel"
    >
      <div>
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Paste unstructured text</p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Drop a Slack thread, Jira ticket, or rough markdown brief. ArchLucid maps it into review fields — no JSON
          required.
        </p>
      </div>
      <Textarea
        id="chat-intake-raw-text"
        rows={6}
        className="min-h-[120px]"
        value={rawText}
        onChange={(event) => {
          setRawText(event.target.value);
          setParseSuccess(null);
        }}
        placeholder="Paste architecture context here (minimum 20 characters)…"
        aria-describedby="chat-intake-raw-text-hint"
        data-testid="chat-intake-raw-text"
      />
      <p id="chat-intake-raw-text-hint" className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {rawText.trim().length} characters (minimum 20)
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={parseBusy || rawText.trim().length < 20}
          onClick={() => void onParseArchitecture()}
          data-testid="chat-intake-parse-button"
        >
          {parseBusy ? "Parsing…" : "Parse into wizard"}
        </Button>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Does not create a review until you submit the wizard.
        </p>
      </div>
      {parseSuccess !== null ? (
        <p className={cn("m-0 text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="chat-intake-parse-success">
          {parseSuccess}
        </p>
      ) : null}
      {parseError !== null ? (
        <OperatorApiProblem
          problem={parseError.problem}
          fallbackMessage={parseError.message}
          correlationId={parseError.correlationId}
        />
      ) : null}
    </div>
  );
}
