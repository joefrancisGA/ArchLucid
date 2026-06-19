"use client";

import { useEffect, useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
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
import { branchDraftRequest, getDraftBranchQuota } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { formatDraftBranchQuotaSummary } from "@/lib/draft-branch-quota-display";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type {
  BranchDraftResponse,
  DraftBranchOverrideKind,
  DraftBranchQuotaResponse,
  DraftElicitationQuestion,
} from "@/types/draft-intake";

const OVERRIDE_KIND_OPTIONS: ReadonlyArray<{
  value: DraftBranchOverrideKind;
  label: string;
  description: string;
}> = [
  {
    value: "QuestionAnswer",
    label: "MUST question answer",
    description: "Relax or change one answered intake question.",
  },
  {
    value: "BusinessOutcome",
    label: "Business outcome",
    description: "Try a different measurable outcome while holding intent fixed.",
  },
  {
    value: "FreeTextIntent",
    label: "Architecture intent",
    description: "Try alternate intent wording while holding outcome fixed.",
  },
  {
    value: "SystemName",
    label: "System name",
    description: "Rename the system under review.",
  },
];

export type DraftIntakeWhatIfBranchPanelProps = {
  readonly draftId: string;
  readonly disabled?: boolean;
  readonly defaultOpen?: boolean;
  readonly intent: string;
  readonly outcome: string;
  readonly systemName: string;
  readonly questionOptions: DraftElicitationQuestion[];
  readonly onBranched: (response: BranchDraftResponse) => void;
};

/**
 * What-if branching via POST /v1/architecture/draft/{draftId}/branch (R12).
 * A branch is a ceteris-paribus draft clone — submit it as a separate review, then Compare.
 */
export function DraftIntakeWhatIfBranchPanel(props: DraftIntakeWhatIfBranchPanelProps) {
  const defaultQuestionKey = props.questionOptions[0]?.questionKey ?? "";

  const [overrideKind, setOverrideKind] = useState<DraftBranchOverrideKind>("QuestionAnswer");
  const [overrideKey, setOverrideKey] = useState(defaultQuestionKey);
  const [overrideValue, setOverrideValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<DraftBranchQuotaResponse | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const panelDisabled = props.disabled === true || busy;
  const quotaAllowsBranch = quota?.canBranch !== false;

  useEffect(() => {
    let cancelled = false;

    async function loadQuota(): Promise<void> {
      setQuotaError(null);

      try {
        const loaded = await getDraftBranchQuota(props.draftId);

        if (!cancelled) {
          setQuota(loaded);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setQuota(null);
          setQuotaError(
            loadError instanceof Error ? loadError.message : "Failed to load branch quota.",
          );
        }
      }
    }

    void loadQuota();

    return () => {
      cancelled = true;
    };
  }, [props.draftId]);

  const selectedKindMeta = useMemo(
    () => OVERRIDE_KIND_OPTIONS.find((option) => option.value === overrideKind) ?? OVERRIDE_KIND_OPTIONS[0],
    [overrideKind],
  );

  const canBranch = useMemo(() => {
    const trimmedValue = overrideValue.trim();

    if (trimmedValue.length === 0) {
      return false;
    }

    if (overrideKind === "QuestionAnswer" && overrideKey.trim().length === 0) {
      return false;
    }

    return true;
  }, [overrideKey, overrideKind, overrideValue]);

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
    <CollapsibleSection title="Explore a what-if branch" defaultOpen={props.defaultOpen === true}>
      <div className="draft-intake-what-if-panel space-y-4" data-testid="draft-intake-what-if-panel">
        <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Clone this admitted draft with one change, submit it as a separate architecture review, then use{" "}
          <strong>Compare two reviews</strong> to diff the committed manifests (R12).
        </p>

        {quota !== null ? (
          <p
            className="m-0 text-xs text-neutral-600 dark:text-neutral-400"
            data-testid="draft-intake-what-if-quota"
          >
            {formatDraftBranchQuotaSummary(quota)}
          </p>
        ) : null}

        {quotaError !== null ? (
          <p className="m-0 text-xs text-amber-700 dark:text-amber-300">{quotaError}</p>
        ) : null}

        {!quotaAllowsBranch ? (
          <p className="m-0 text-xs font-medium text-amber-800 dark:text-amber-200">
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
              {OVERRIDE_KIND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-500">{selectedKindMeta.description}</p>
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
                <SelectValue placeholder="Select a MUST question" />
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
    </CollapsibleSection>
  );
}
