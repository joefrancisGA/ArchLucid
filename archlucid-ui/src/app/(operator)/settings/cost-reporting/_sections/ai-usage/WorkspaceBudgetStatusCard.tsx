"use client";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageGovernanceControls } from "@/lib/ai-usage-dashboard-model";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly governance: AiUsageGovernanceControls | null;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly remainingBudgetUsd: number | null;
  readonly budgetTotalUsd: number | null;
  readonly usedAmountUsd: number | null;
};

export function WorkspaceBudgetStatusCard(props: Props) {
  const { governance } = props;

  return (
    <Card data-testid="workspace-budget-status-card">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace budget status</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Current budget posture and enforcement settings for this workspace.
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        <AiUsageSectionState
          state={props.state}
          title="Workspace budget status"
          testId="workspace-budget-status-state"
          permissionMessage="Workspace budget controls require Execute authority."
          inactiveMessage="Budget monitoring is not active for this workspace."
        >
          {props.budgetTotalUsd !== null && props.remainingBudgetUsd !== null ? (
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="workspace-budget-status-summary">
              ${props.remainingBudgetUsd.toFixed(2)} remaining of ${props.budgetTotalUsd.toFixed(2)}
              {props.usedAmountUsd !== null ? ` · $${props.usedAmountUsd.toFixed(2)} used` : ""}
            </p>
          ) : null}

          {governance !== null ? (
            <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className="text-al-text-secondary">Monthly budget</dt>
                <dd className="m-0 font-medium tabular-nums">
                  {governance.monthlyBudgetUsd !== null ? `$${governance.monthlyBudgetUsd.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Warning threshold</dt>
                <dd className="m-0 font-medium tabular-nums">
                  {governance.warningThresholdPercent !== null ? `${governance.warningThresholdPercent}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Limit behavior</dt>
                <dd className="m-0 font-medium">
                  {governance.hardStopEnabled ? "Hard stop when budget is exhausted" : "Soft limit — workflows may continue with warnings"}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Reset period</dt>
                <dd className="m-0 font-medium">{governance.resetPeriod ?? "UTC month"}</dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Workspace kind</dt>
                <dd className="m-0 font-medium">{governance.workspaceKind ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Customer AI provider</dt>
                <dd className="m-0 font-medium">
                  <span
                    className={cn(
                      "inline-flex rounded px-2 py-0.5",
                      governance.customerAiProviderConfigured
                        ? operatorSemanticSurface("ready")
                        : operatorSemanticSurface("warn"),
                    )}
                  >
                    {governance.customerAiProviderConfigured ? "Configured" : "Not configured"}
                  </span>
                </dd>
              </div>
            </dl>
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
