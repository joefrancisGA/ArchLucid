"use client";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { OperationalMetricsGate } from "@/components/operator-home/OperationalMetricsGate";
import { OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export type OperatorHomeCompactStartingActionsSectionProps = {
  /** When true, hide dual-path cards — returning tenants already chose a starting path. */
  readonly hasCommittedManifest?: boolean;
  /** Working mode uses a single resume/new-review CTA instead of peer lifecycle cards. */
  readonly workingMode?: boolean;
  /** True when the workspace already has in-flight review packages on the desk. */
  readonly hasActiveDeskWork?: boolean;
};

/** Reduced-emphasis starting actions when workspace reviews already exist. */
export function OperatorHomeCompactStartingActionsSection(
  props: OperatorHomeCompactStartingActionsSectionProps,
): React.JSX.Element | null {
  const { unfinishedWorkRailCount } = useOperatorHomeWorkspaceActivity();
  const hideDualPathCards = props.hasCommittedManifest === true || props.workingMode === true;
  const hasDeskWork =
    props.hasActiveDeskWork === true ||
    (unfinishedWorkRailCount !== null && unfinishedWorkRailCount > 0);
  const workingCtaVariant = props.workingMode === true && hasDeskWork ? "outline" : "primary";

  const showStarterPacks = props.workingMode !== true;

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
        {props.workingMode === true ? <OperatorHomeWorkingPrimaryCta variant={workingCtaVariant} /> : null}
        {hideDualPathCards ? null : (
          <OperatorHomeDualPathCards variant="compact" pagePrimaryOwnedElsewhere hideExplorePath />
        )}
      </div>
      {showStarterPacks ? (
        <OperationalMetricsGate>
          <AcceleratorChooserCard />
        </OperationalMetricsGate>
      ) : null}
    </section>
  );
}
