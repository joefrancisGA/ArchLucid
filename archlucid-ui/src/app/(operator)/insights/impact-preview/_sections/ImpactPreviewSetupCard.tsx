"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveImpactPreviewSimulateEmphasizedStepId,
  resolveImpactPreviewSimulateSteps,
} from "@/lib/impact-preview-simulate-checklist";
import {
  IMPACT_PREVIEW_ACTION_SIMULATE,
  IMPACT_PREVIEW_BASELINE_LABEL,
  IMPACT_PREVIEW_COMPARISON_SCOPE_LABEL,
  IMPACT_PREVIEW_PROPOSED_CHANGE_LABEL,
  IMPACT_PREVIEW_SCOPE_COST,
  IMPACT_PREVIEW_SCOPE_EVIDENCE,
  IMPACT_PREVIEW_SCOPE_FINDINGS,
  IMPACT_PREVIEW_SCOPE_GOVERNANCE,
  IMPACT_PREVIEW_SCOPE_RISK,
  IMPACT_PREVIEW_SETUP_CARD_TITLE,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewBaselineOption, ImpactPreviewComparisonScope } from "@/lib/impact-preview-page-types";
import type { EvolutionCandidateChangeSetResponse } from "@/types/evolution";

export type ImpactPreviewSetupCardProps = {
  readonly candidates: readonly EvolutionCandidateChangeSetResponse[];
  readonly selectedCandidateId: string | null;
  readonly onSelectCandidate: (candidateId: string) => void;
  readonly baselineOptions: readonly ImpactPreviewBaselineOption[];
  readonly selectedBaselineId: string | null;
  readonly onSelectBaseline: (baselineId: string) => void;
  readonly comparisonScope: ImpactPreviewComparisonScope;
  readonly onToggleScope: (key: keyof ImpactPreviewComparisonScope) => void;
  readonly canSimulate: boolean;
  readonly simulateBusy: boolean;
  readonly listLoading: boolean;
  readonly onSimulate: () => void;
  readonly simulateComplete: boolean;
};

const SCOPE_ITEMS: ReadonlyArray<{ readonly key: keyof ImpactPreviewComparisonScope; readonly label: string }> = [
  { key: "findings", label: IMPACT_PREVIEW_SCOPE_FINDINGS },
  { key: "risk", label: IMPACT_PREVIEW_SCOPE_RISK },
  { key: "cost", label: IMPACT_PREVIEW_SCOPE_COST },
  { key: "governance", label: IMPACT_PREVIEW_SCOPE_GOVERNANCE },
  { key: "evidence", label: IMPACT_PREVIEW_SCOPE_EVIDENCE },
];

export function ImpactPreviewSetupCard(props: ImpactPreviewSetupCardProps): React.JSX.Element {
  const selectedCandidate = props.selectedCandidateId ?? "";
  const simulateSteps = resolveImpactPreviewSimulateSteps({
    baselinePicked: (props.selectedBaselineId ?? "").trim().length > 0,
    candidatePicked: selectedCandidate.trim().length > 0,
    simulateComplete: props.simulateComplete,
  });
  const simulateEmphasizedStepId = resolveImpactPreviewSimulateEmphasizedStepId({
    baselinePicked: (props.selectedBaselineId ?? "").trim().length > 0,
    candidatePicked: selectedCandidate.trim().length > 0,
    simulateComplete: props.simulateComplete,
  });

  return (
    <Card data-testid="impact-preview-setup-card">
      <CardHeader className="pb-3">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{IMPACT_PREVIEW_SETUP_CARD_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntegrationConnectChecklist
          title="Simulate checklist"
          steps={simulateSteps}
          emphasizedStepId={simulateEmphasizedStepId}
          testIdPrefix="impact-preview-simulate"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="impact-preview-proposed-change">{IMPACT_PREVIEW_PROPOSED_CHANGE_LABEL}</Label>
            <Select
              value={selectedCandidate}
              onValueChange={(value) => {
                props.onSelectCandidate(value);
              }}
            >
              <SelectTrigger id="impact-preview-proposed-change" data-testid="impact-preview-proposed-change-select">
                <SelectValue placeholder="Select a proposed change" />
              </SelectTrigger>
              <SelectContent>
                {props.candidates.map((candidate) => (
                  <SelectItem key={candidate.candidateChangeSetId} value={candidate.candidateChangeSetId}>
                    {candidate.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact-preview-baseline">{IMPACT_PREVIEW_BASELINE_LABEL}</Label>
            <Select
              value={props.selectedBaselineId ?? ""}
              onValueChange={(value) => {
                props.onSelectBaseline(value);
              }}
            >
              <SelectTrigger id="impact-preview-baseline" data-testid="impact-preview-baseline-select">
                <SelectValue placeholder="Select a baseline review" />
              </SelectTrigger>
              <SelectContent>
                {props.baselineOptions.map((option) => (
                  <SelectItem key={option.runId} value={option.runId}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{IMPACT_PREVIEW_COMPARISON_SCOPE_LABEL}</legend>
          <div className="flex flex-wrap gap-3">
            {SCOPE_ITEMS.map((item) => (
              <label key={item.key} className={cn("inline-flex items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <input
                  type="checkbox"
                  checked={props.comparisonScope[item.key]}
                  onChange={() => {
                    props.onToggleScope(item.key);
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        {props.canSimulate && props.selectedCandidateId !== null ? (
          <Button
            type="button"
            disabled={props.simulateBusy || props.selectedBaselineId === null}
            onClick={() => {
              props.onSimulate();
            }}
            data-testid="impact-preview-simulate-button"
          >
            {props.simulateBusy ? "Simulating…" : IMPACT_PREVIEW_ACTION_SIMULATE}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
