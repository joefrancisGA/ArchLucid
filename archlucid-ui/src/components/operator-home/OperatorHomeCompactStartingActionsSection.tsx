"use client";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { OperationalMetricsGate } from "@/components/operator-home/OperationalMetricsGate";
import { OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export type OperatorHomeCompactStartingActionsSectionProps = {
  /** When true, hide dual-path cards — returning tenants already chose a starting path. */
  readonly hasCommittedManifest?: boolean;
  /** Working mode uses a single resume/new-review CTA instead of peer lifecycle cards. */
  readonly workingMode?: boolean;
};

/** Reduced-emphasis starting actions when workspace reviews already exist. */
export function OperatorHomeCompactStartingActionsSection(
  props: OperatorHomeCompactStartingActionsSectionProps,
): React.JSX.Element {
  const hideDualPathCards = props.hasCommittedManifest === true || props.workingMode === true;

  return (
    <section
      aria-labelledby="operator-home-compact-starting-actions-heading"
      className={OPERATOR_LAYOUT.sectionHeadingStack}
      data-testid="operator-home-compact-starting-actions"
    >
      <div className={OPERATOR_LAYOUT.sectionStack}>
        <OperatorHomeCardSectionTitle id="operator-home-compact-starting-actions-heading">
          {OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING}
        </OperatorHomeCardSectionTitle>
        {props.workingMode === true ? <OperatorHomeWorkingPrimaryCta /> : null}
        {hideDualPathCards ? null : (
          <OperatorHomeDualPathCards variant="compact" pagePrimaryOwnedElsewhere hideExplorePath />
        )}
      </div>
      <OperationalMetricsGate>
        <AcceleratorChooserCard />
      </OperationalMetricsGate>
    </section>
  );
}
