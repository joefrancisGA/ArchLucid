"use client";

import type { ReactElement } from "react";

import { OperatorStickinessSnapshotCard } from "@/components/operator/OperatorStickinessSnapshotCard";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

/**
 * TB-2191 — operator-home return-visit block: pilot and repeat-usage snapshot fed by
 * `GET /v1/tenant/customer-success/stickiness-snapshot`.
 *
 * TB-2232 — recommended next steps moved to `OperatorHomeCanonicalNextActionSlot` in the
 * command center hero so home shows one guidance widget.
 */
export function OperatorHomeStickinessCockpit(): ReactElement {
  return (
    <div
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="operator-home-stickiness-cockpit"
    >
      <OperatorStickinessSnapshotCard />
    </div>
  );
}
