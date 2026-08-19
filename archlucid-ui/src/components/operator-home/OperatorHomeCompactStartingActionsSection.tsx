"use client";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperationalMetricsGate } from "@/components/operator-home/OperationalMetricsGate";
import { OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

/** Reduced-emphasis starting actions when workspace reviews already exist. */
export function OperatorHomeCompactStartingActionsSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="operator-home-compact-starting-actions-heading"
      className={OPERATOR_LAYOUT.sectionHeadingStack}
      data-testid="operator-home-compact-starting-actions"
    >
      <OperatorHomeCardSectionTitle id="operator-home-compact-starting-actions-heading">
        {OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING}
      </OperatorHomeCardSectionTitle>
      <OperatorHomeDualPathCards variant="compact" />
      <OperationalMetricsGate>
        <AcceleratorChooserCard />
      </OperationalMetricsGate>
    </section>
  );
}
