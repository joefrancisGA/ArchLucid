"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDraftBranchQuotaQuery } from "@/hooks/use-draft-branch-quota-query";
import { branchDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { formatDraftBranchQuotaSummary } from "@/lib/draft-branch-quota-display";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
} from "@/lib/guided-intake-copy";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { draftStatusAllowsWhatIfBranch } from "@/lib/draft-intake-branch-eligibility";
import type {
  BranchDraftResponse,
  DraftBranchOverrideKind,
  DraftBranchQuotaResponse,
  DraftElicitationQuestion,
  DraftRequestStatus,
} from "@/types/draft-intake";

const OVERRIDE_KIND_OPTIONS: ReadonlyArray<{
  value: DraftBranchOverrideKind;
  label: string;
  description: string;
}> = [
  {
    value: "QuestionAnswer",
    label: "Required clarification answer",
    description: "Relax or change one answered clarification.",
  },
  {
    value: "BusinessOutcome",
    label: GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
    description: "Try a different measurable outcome while holding intent fixed.",
  },
  {
    value: "FreeTextIntent",
    label: GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL,
    description: "Try alternate intent wording while holding outcome fixed.",
  },
  {
    value: "SystemName",
    label: GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
    description: "Rename the system under review.",
  },
];

export type DraftIntakeWhatIfBranchPanelProps = {
  readonly draftId: string;
  readonly draftStatus: DraftRequestStatus | null;
  readonly disabled?: boolean;
  readonly intent: string;
  readonly outcome: string;
  readonly systemName: string;
  readonly questionOptions: DraftElicitationQuestion[];
  /** Hides clarification-answer override while the main intake flow still has pending questions. */
  readonly suppressQuestionAnswerOverride?: boolean;
  readonly onBranched: (response: BranchDraftResponse) => void;
};

/**
 * What-if branching via POST /v1/architecture/draft/{draftId}/branch (R12).
 * A branch is a ceteris-paribus draft clone — submit it as a separate review, then Compare.
 */
function resolveInitialOverrideKind(
  suppressQuestionAnswerOverride: boolean | undefined,
): DraftBranchOverrideKind {
  if (suppressQuestionAnswerOverride === true) {
    return "BusinessOutcome";
  }

  return "QuestionAnswer";
}

export function DraftIntakeWhatIfBranchPanel(props: DraftIntakeWhatIfBranchPanelProps) {
  const branchAllowed = draftStatusAllowsWhatIfBranch(props.draftStatus);
  const defaultQuestionKey = props.questionOptions[0]?.questionKey ?? "";
  const suppressQuestionAnswerOverride = props.suppressQuestionAnswerOverride === true;

  const availableOverrideKinds = useMemo(() => {
    if (!branchAllowed) {
      return OVERRIDE_KIND_OPTIONS;
    }

    if (!suppressQuestionAnswerOverride) {
      return OVERRIDE_KIND_OPTIONS;
    }

    return OVERRIDE_KIND_OPTIONS.filter((option) => option.value !== "QuestionAnswer");
  }, [branchAllowed, suppressQuestionAnswerOverride]);

  const [overrideKind, setOverrideKind] = useState<DraftBranchOverrideKind>(() =>
    resolveInitialOverrideKind(suppressQuestionAnswerOverride),
  );
  const [overrideKey, setOverrideKey] = useState(defaultQuestionKey);
  const [overrideValue, setOverrideValue] = useState(() =>
    resolveInitialOverrideKind(suppressQuestionAnswerOverride) === "BusinessOutcome" ? props.outcome : "",
  );
  const [busy, setBusy] = useState(false);
  const quotaQuery = useDraftBranchQuotaQuery(props.draftId, { enabled: branchAllowed });
  const quota = quotaQuery.data ?? null;
  const quotaError =
    quotaQuery.isError
      ? (quotaQuery.error instanceof Error ? quotaQuery.error.message : "Failed to load branch quota.")
      : null;
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const panelDisabled = props.disabled === true || busy;
  const quotaAllowsBranch = quota?.canBranch !== false;

  useEffect(() => {
    if (!branchAllowed) {
      return;
    }

    if (suppressQuestionAnswerOverride && overrideKind === "QuestionAnswer") {
      setOverrideKind("BusinessOutcome");
      setOverrideValue(props.outcome);
    }
  }, [branchAllowed, overrideKind, props.outcome, suppressQuestionAnswerOverride]);

  const selectedKindMeta = useMemo(
    () =>
      availableOverrideKinds.find((option) => option.value === overrideKind) ??
      availableOverrideKinds[0] ??
      OVERRIDE_KIND_OPTIONS[0],
    [availableOverrideKinds, overrideKind],
  );

  const canBranch = useMemo(() => {
    if (!branchAllowed) {
      return false;
    }

    const trimmedValue = overrideValue.trim();

    if (trimmedValue.length === 0) {
      return false;
    }

    if (overrideKind === "QuestionAnswer" && overrideKey.trim().length === 0) {
      return false;
    }

    return true;
  }, [branchAllowed, overrideKey, overrideKind, overrideValue]);

  if (!branchAllowed) {
    return null;
  }

  function seedOverrideValue(kind: DraftBranchOverrideKind): string {
    if (kind === "BusinessOutcome") {
      return props.outcome;
    }

    if (kind === "FreeTextIntent") {
      return props.intent;
    }

    if (kind === "SystemName") {
      return props.systemName;
    }

    return "";
  }

  async function submitBranch(): Promise<void> {
    if (!canBranch || panelDisabled) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await branchDraftRequest(props.draftId, {
        overrideKind,
        overrideKey: overrideKind === "QuestionAnswer" ? overrideKey.trim() : undefined,
        overrideValue: overrideValue.trim(),
      });

      props.onBranched(response);
      setOverrideValue("");
    } catch (submitError: unknown) {
      if (isApiRequestError(submitError)) {
        setError({
          message: submitError.message,
          problem: submitError.problem,
          correlationId: submitError.correlationId,
        });
      } else {
        setError({
          message: submitError instanceof Error ? submitError.message : "Branch request failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="draft-intake-what-if-panel space-y-4" data-testid="draft-intake-what-if-panel">
      <div>
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Explore a what-if branch</p>
        <p className={cn("mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Clone this admitted draft with one change, submit it as a separate architecture review, then use{" "}
          <strong>Compare two reviews</strong> to see how the outcomes differ.
        </p>
      </div>

        {quota !== null ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="draft-intake-what-if-quota"
          >
            {formatDraftBranchQuotaSummary(quota)}
          </p>
        ) : null}

        {quotaError !== null ? (
          <p className={cn("m-0 text-amber-700 dark:text-amber-300", OPERATOR_TYPOGRAPHY.helper)}>{quotaError}</p>
        ) : null}

        {!quotaAllowsBranch ? (
          <p className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            Branch cap reached for this parent draft — submit an existing branch or start a new intake.
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`draft-intake-what-if-kind-${props.draftId}`}>Override dimension</Label>
          <Select
            value={overrideKind}
            disabled={panelDisabled}
            onValueChange={(value) => {
              const kind = value as DraftBranchOverrideKind;
              setOverrideKind(kind);
              setOverrideValue(seedOverrideValue(kind));
            }}
          >
            <SelectTrigger
              id={`draft-intake-what-if-kind-${props.draftId}`}
              data-testid="draft-intake-what-if-kind"
            >
              <SelectValue placeholder="Choose override" />
            </SelectTrigger>
            <SelectContent>
              {availableOverrideKinds.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{selectedKindMeta.description}</p>
        </div>

        {overrideKind === "QuestionAnswer" ? (
          <div className="space-y-2">
            <Label htmlFor={`draft-intake-what-if-key-${props.draftId}`}>Question</Label>
            <Select
              value={overrideKey.length > 0 ? overrideKey : undefined}
              disabled={panelDisabled || props.questionOptions.length === 0}
              onValueChange={(value) => {
                setOverrideKey(value);
              }}
            >
              <SelectTrigger
                id={`draft-intake-what-if-key-${props.draftId}`}
                data-testid="draft-intake-what-if-question"
              >
                <SelectValue placeholder="Select a clarification" />
              </SelectTrigger>
              <SelectContent>
                {props.questionOptions.map((question) => (
                  <SelectItem key={question.questionKey} value={question.questionKey}>
                    {question.prompt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`draft-intake-what-if-value-${props.draftId}`}>New value</Label>
          <Textarea
            id={`draft-intake-what-if-value-${props.draftId}`}
            rows={3}
            value={overrideValue}
            disabled={panelDisabled}
            data-testid="draft-intake-what-if-value"
            onChange={(event) => {
              setOverrideValue(event.target.value);
            }}
          />
        </div>

        {error !== null ? (
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
          />
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={panelDisabled || !canBranch || !quotaAllowsBranch}
          data-testid="draft-intake-what-if-submit"
          onClick={() => {
            void submitBranch();
          }}
        >
          {busy ? "Branching…" : "Create what-if branch"}
        </Button>
    </div>
  );
}
