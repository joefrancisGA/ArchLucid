"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFindingEngineControlsQuery } from "@/hooks/use-finding-engine-controls-query";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  clearTenantFindingEngineControlsOverrides,
  type TenantFindingEngineControlsResponse,
  updateTenantFindingEngineControls,
} from "@/lib/tenant-finding-engine-controls-client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ToggleRowProps = {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly hostDefault: boolean;
  readonly overridden: boolean;
  readonly disabled: boolean;
  readonly onChange: (checked: boolean) => void;
};

function ToggleRow(props: ToggleRowProps) {
  const { label, description, checked, hostDefault, overridden, disabled, onChange } = props;

  return (
    <div className="space-y-1 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
      <label className={cn("flex items-start gap-2", OPERATOR_TYPOGRAPHY.body)}>
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          data-testid={`finding-engine-toggle-${label}`}
        />
        <span>
          <span className="font-medium text-al-text-primary">{label}</span>
          <span className="block text-al-text-secondary">{description}</span>
          <span className="block text-al-text-secondary text-[12px]">
            Deployment default: {hostDefault ? "On" : "Off"}
            {overridden ? " (workspace override)" : ""}
          </span>
        </span>
      </label>
    </div>
  );
}

export function TenantFindingEngineControlsCard() {
  const queryClient = useQueryClient();
  const controlsQuery = useFindingEngineControlsQuery();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TenantFindingEngineControlsResponse | null>(null);

  useEffect(() => {
    if (controlsQuery.data !== undefined) {
      setDraft(controlsQuery.data);
    }
  }, [controlsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateTenantFindingEngineControls,
    onSuccess: async () => {
      setMutationError(null);
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.findingEngineControls });
    },
    onError: (error: unknown) => {
      setMutationError(error instanceof Error ? error.message : String(error));
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearTenantFindingEngineControlsOverrides,
    onSuccess: async () => {
      setMutationError(null);
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.findingEngineControls });
    },
    onError: (error: unknown) => {
      setMutationError(error instanceof Error ? error.message : String(error));
    },
  });

  const saving = saveMutation.isPending || clearMutation.isPending;
  const hasOverride =
    draft?.enableLlmJudgeOverridden === true
    || draft?.enableLlmJudgeForEngineFindingsOverridden === true
    || draft?.portfolioRecurrenceEnabledOverridden === true;

  const saveDraft = useCallback(
    (next: TenantFindingEngineControlsResponse) => {
      setDraft(next);
      saveMutation.mutate({
        enableLlmJudge: next.effectiveEnableLlmJudge,
        enableLlmJudgeForEngineFindings: next.effectiveEnableLlmJudgeForEngineFindings,
        portfolioRecurrenceEnabled: next.effectivePortfolioRecurrenceEnabled,
      });
    },
    [saveMutation],
  );

  const loadError =
    mutationError
    ?? (controlsQuery.isError
      ? controlsQuery.error instanceof Error
        ? controlsQuery.error.message
        : "Finding engine settings unavailable."
      : null);

  return (
    <Card data-testid="tenant-finding-engine-controls-card">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>Finding engines</CardTitle>
          <MutatingInWorkspaceChip />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Optional finding engines that add Premium LLM judge passes or scan other systems in this workspace. Leave off
          unless you accept extra model cost and cross-review reads.
        </p>

        {controlsQuery.isPending ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading finding engine settings…</p>
        ) : null}
        {loadError !== null ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {loadError}
          </p>
        ) : null}

        {draft !== null && loadError === null ? (
          <div className="space-y-2" data-testid="finding-engine-controls">
            <ToggleRow
              label="Insight-density LLM judge"
              description="Runs a Premium judge on promoted architecture findings."
              checked={draft.effectiveEnableLlmJudge}
              hostDefault={draft.hostDefaultEnableLlmJudge}
              overridden={draft.enableLlmJudgeOverridden}
              disabled={saving}
              onChange={(checked) =>
                saveDraft({
                  ...draft,
                  effectiveEnableLlmJudge: checked,
                  enableLlmJudgeOverridden: true,
                })}
            />
            <ToggleRow
              label="Engine finding judge"
              description="Also judges deterministic engine findings (separate from architecture findings)."
              checked={draft.effectiveEnableLlmJudgeForEngineFindings}
              hostDefault={draft.hostDefaultEnableLlmJudgeForEngineFindings}
              overridden={draft.enableLlmJudgeForEngineFindingsOverridden}
              disabled={saving}
              onChange={(checked) =>
                saveDraft({
                  ...draft,
                  effectiveEnableLlmJudgeForEngineFindings: checked,
                  enableLlmJudgeForEngineFindingsOverridden: true,
                })}
            />
            <ToggleRow
              label="Portfolio recurrence scan"
              description="Reports when the same finding identity appears across multiple systems."
              checked={draft.effectivePortfolioRecurrenceEnabled}
              hostDefault={draft.hostDefaultPortfolioRecurrenceEnabled}
              overridden={draft.portfolioRecurrenceEnabledOverridden}
              disabled={saving}
              onChange={(checked) =>
                saveDraft({
                  ...draft,
                  effectivePortfolioRecurrenceEnabled: checked,
                  portfolioRecurrenceEnabledOverridden: true,
                })}
            />
            {hasOverride ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => clearMutation.mutate()}
              >
                Use deployment defaults
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
