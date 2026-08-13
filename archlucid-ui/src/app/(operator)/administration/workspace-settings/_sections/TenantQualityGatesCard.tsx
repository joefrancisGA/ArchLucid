"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentOutputQualityGateModeQuery } from "@/hooks/use-agent-output-quality-gate-mode-query";
import {
  clearAgentOutputQualityGateModeOverride,
  type QualityGateMode,
  type TenantAgentOutputQualityGateModeResponse,
  updateAgentOutputQualityGateMode,
} from "@/lib/agent-output-quality-gate-mode-client";
import { buyerLabelForQualityGateMode } from "@/lib/quality-gate-mode-buyer-label";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { STRICT_AI_QUALITY_MODE_BUYER_LABEL, WARN_ONLY_QUALITY_MODE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type QualityGateModeControlsProps = {
  mode: TenantAgentOutputQualityGateModeResponse;
  saving: boolean;
  onSelectMode: (mode: QualityGateMode) => void;
  onClearOverride: () => void;
};

function QualityGateModeControls(props: QualityGateModeControlsProps) {
  const { mode, saving, onSelectMode, onClearOverride } = props;
  const usingOverride = mode.source === "TenantOverride";

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" data-testid="quality-gate-mode-controls">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Effective mode: <span className="font-medium">{buyerLabelForQualityGateMode(mode.effectiveMode)}</span>
        {usingOverride ? (
          <span className="text-al-text-secondary"> (workspace override)</span>
        ) : (
          <span className="text-al-text-secondary">
            {" "}
            (deployment default: {buyerLabelForQualityGateMode(mode.hostDefaultMode)})
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode.effectiveMode === "WarnOnly" ? "default" : "outline"}
          disabled={saving || mode.effectiveMode === "WarnOnly"}
          onClick={() => void onSelectMode("WarnOnly")}
        >
          {WARN_ONLY_QUALITY_MODE_BUYER_LABEL}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode.effectiveMode === "PilotStrict" ? "default" : "outline"}
          disabled={saving || mode.effectiveMode === "PilotStrict"}
          onClick={() => void onSelectMode("PilotStrict")}
        >
          {STRICT_AI_QUALITY_MODE_BUYER_LABEL}
        </Button>
        {usingOverride ? (
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void onClearOverride()}>
            Use default
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function TenantQualityGatesCard() {
  const queryClient = useQueryClient();
  const modeQuery = useAgentOutputQualityGateModeQuery();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const applyModeMutation = useMutation({
    mutationFn: updateAgentOutputQualityGateMode,
    onSuccess: async () => {
      setMutationError(null);
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.agentOutputQualityGateMode });
    },
    onError: (error: unknown) => {
      setMutationError(error instanceof Error ? error.message : String(error));
    },
  });

  const clearOverrideMutation = useMutation({
    mutationFn: clearAgentOutputQualityGateModeOverride,
    onSuccess: async () => {
      setMutationError(null);
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.agentOutputQualityGateMode });
    },
    onError: (error: unknown) => {
      setMutationError(error instanceof Error ? error.message : String(error));
    },
  });

  const saving = applyModeMutation.isPending || clearOverrideMutation.isPending;

  const applyMode = useCallback(
    (mode: QualityGateMode) => {
      applyModeMutation.mutate(mode);
    },
    [applyModeMutation],
  );

  const clearOverride = useCallback(() => {
    clearOverrideMutation.mutate();
  }, [clearOverrideMutation]);

  const loadError =
    mutationError
    ?? (modeQuery.isError
      ? modeQuery.error instanceof Error
        ? modeQuery.error.message
        : "Quality gate settings unavailable."
      : null);

  return (
    <Card data-testid="tenant-quality-gates-card">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>Quality gates</CardTitle>
          <MutatingInWorkspaceChip />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Choose whether this workspace warns on weak agent output or blocks the review.{" "}
          {WARN_ONLY_QUALITY_MODE_BUYER_LABEL} keeps the pipeline moving; {STRICT_AI_QUALITY_MODE_BUYER_LABEL} rejects
          review output that misses evidence or score floors.
        </p>

        {modeQuery.isPending ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading quality gate settings…</p>
        ) : null}
        {loadError !== null ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {loadError}
          </p>
        ) : null}
        {modeQuery.data !== undefined && loadError === null ? (
          <QualityGateModeControls
            mode={modeQuery.data}
            saving={saving}
            onSelectMode={applyMode}
            onClearOverride={clearOverride}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
