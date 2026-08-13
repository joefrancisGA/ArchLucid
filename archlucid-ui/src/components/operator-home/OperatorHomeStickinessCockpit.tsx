"use client";

import type { ReactElement } from "react";

import { OperatorNextActionsCard } from "@/components/operator/OperatorNextActionsCard";
import { OperatorStickinessSnapshotCard } from "@/components/operator/OperatorStickinessSnapshotCard";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

/**
 * TB-2191 — operator-home return-visit block: recommended next steps plus the pilot and
 * repeat-usage snapshot, both fed by `GET /v1/tenant/customer-success/*`.
 *
 * Each child decides its own visibility, so a workspace with no reviews renders nothing here
 * instead of empty scaffolding: `OperatorNextActionsCard` returns null when the action list is
 * empty or the buyer-polished shell env is active, and `OperatorStickinessSnapshotCard` returns
 * null until the funnel reports at least one run.
 *
 * `GET /v1/tenant/customer-success/health-score` is deliberately not surfaced here. That
 * endpoint answers with `IsCalculated = false` and every numeric field left at its default
 * until the scoring worker materializes a row, so rendering `CompositeScore` would show an
 * authoritative-looking zero with no basis behind it.
 */
export function OperatorHomeStickinessCockpit(): ReactElement {
  return (
    <div
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="operator-home-stickiness-cockpit"
    >
      <OperatorNextActionsCard />
      <OperatorStickinessSnapshotCard />
    </div>
  );
}
