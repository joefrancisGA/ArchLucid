"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { alertTuningRecommendButtonTitle } from "@/lib/enterprise-controls-context-copy";

export type AlertTuningFormRecommendChecklistProps = {
  readonly recommendSteps: readonly IntegrationConnectChecklistStep[];
  readonly recommendEmphasizedStepId: string;
};

export function AlertTuningFormRecommendChecklist(props: AlertTuningFormRecommendChecklistProps) {
  const { recommendSteps, recommendEmphasizedStepId } = props;

  return (
    <IntegrationConnectChecklist
      title="Recommend checklist"
      steps={recommendSteps}
      emphasizedStepId={recommendEmphasizedStepId}
      testIdPrefix="alert-tuning-recommend"
    />
  );
}

export type AlertTuningFormRecommendSubmitProps = {
  readonly loading: boolean;
  readonly onRecommend: () => void;
};

export function AlertTuningFormRecommendSubmit(props: AlertTuningFormRecommendSubmitProps) {
  const { loading, onRecommend } = props;

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="primary"
        size="sm"
        data-testid="alert-tuning-recommend-submit"
        onClick={() => void onRecommend()}
        disabled={loading}
        className="max-w-[240px]"
      >
        {loading ? "Running…" : "Recommend threshold"}
      </Button>
      <FieldHelpTooltip label="Recommend threshold" hint={alertTuningRecommendButtonTitle} />
    </div>
  );
}
