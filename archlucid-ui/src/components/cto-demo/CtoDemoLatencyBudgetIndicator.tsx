"use client";

import { StatusTag } from "@/components/ui/status-tag";
import {
  BUYER_CTO_DEMO_LATENCY_EXCEEDED,
  BUYER_CTO_DEMO_LATENCY_OK,
} from "@/lib/buyer/buyer-polish-copy";

export type CtoDemoLatencyBudgetIndicatorProps = {
  readonly running: boolean;
  readonly budgetMs: number;
  readonly elapsedMs: number;
};

/** Shows whether a live demo action is still inside the presenter latency budget (#20). */
export function CtoDemoLatencyBudgetIndicator(props: CtoDemoLatencyBudgetIndicatorProps): React.JSX.Element | null {
  const { running, budgetMs, elapsedMs } = props;

  if (!running && elapsedMs === 0) {
    return null;
  }

  const exceeded = elapsedMs > budgetMs;

  return (
    <StatusTag
      kind={exceeded ? "blocked" : "ready"}
      label={exceeded ? BUYER_CTO_DEMO_LATENCY_EXCEEDED : BUYER_CTO_DEMO_LATENCY_OK}
      data-testid="cto-demo-latency-budget-indicator"
    />
  );
}
