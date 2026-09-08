"use client";

import Link from "next/link";

import { StatusTag } from "@/components/StatusTag";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageGovernanceControls } from "@/lib/ai-usage-dashboard-model";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly governance: AiUsageGovernanceControls | null;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly remainingBudgetUsd: number | null;
  readonly budgetTotalUsd: number | null;
  readonly usedAmountUsd: number | null;
  readonly onRetry?: () => void;
};

export function WorkspaceBudgetStatusCard(props: Props) {
  const { governance } = props;
  const resetLabel =
    governance?.billingPeriodResetLabel !== null && governance?.billingPeriodResetLabel !== undefined
      ? `Resets ${governance.billingPeriodResetLabel}`
      : governance?.resetPeriod ?? "UTC month";

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
          onRetry={props.onRetry}
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
                  {governance.monthlyBudgetUsd !== null ? `$${governance.monthlyBudgetUsd.toFixed(2)}` : " — "}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Warning threshold</dt>
                <dd className="m-0 font-medium tabular-nums">
                  {governance.warningThresholdPercent !== null ? `${governance.warningThresholdPercent}%` : " — "}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Limit behavior</dt>
                <dd className="m-0">
                  {governance.hardStopEnabled ? (
                    <StatusTag kind="blocked" label="Hard stop at cap" data-testid="workspace-budget-limit-behavior-tag" />
                  ) : (
                    <StatusTag
                      kind="needs-attention"
                      label="Soft limit — warnings only"
                      data-testid="workspace-budget-limit-behavior-tag"
                    />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Reset period</dt>
                <dd className="m-0 font-medium" data-testid="workspace-budget-reset-period">
                  {resetLabel}
                </dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Workspace kind</dt>
                <dd className="m-0 font-medium">{governance.workspaceKind ?? " — "}</dd>
              </div>
              <div>
                <dt className="text-al-text-secondary">Customer AI provider</dt>
                <dd className="m-0 space-y-1">
                  {governance.customerAiProviderConfigured ? (
                    <StatusTag kind="ready" label="Configured" data-testid="workspace-budget-provider-tag" />
                  ) : (
                    <>
                      <StatusTag kind="needs-attention" label="Not configured" data-testid="workspace-budget-provider-tag" />
                      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                        <Link href={MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH} className={OPERATOR_LINK.nav}>
                          Configure provider in model policy
                        </Link>
                      </p>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
