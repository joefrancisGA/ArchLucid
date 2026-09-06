"use client";

import Link from "next/link";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { OperationalMetricsGate } from "@/components/operator-home/OperationalMetricsGate";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING,
  OPERATOR_HOME_START_OR_RESUME_REVIEW_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export type OperatorHomeCompactStartingActionsSectionProps = {
  /** When true, hide dual-path cards — returning tenants already chose a starting path. */
  readonly hasCommittedManifest?: boolean;
  /** Working mode uses a single resume/new-review CTA instead of peer lifecycle cards. */
  readonly workingMode?: boolean;
  /** True when the workspace already has in-flight review packages on the desk. */
  readonly hasActiveDeskWork?: boolean;
  /** When the page header already owns the resume/start primary, demote this section. */
  readonly pagePrimaryOwnedByHeader?: boolean;
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
  const sectionHeading = hasDeskWork
    ? OPERATOR_HOME_START_OR_RESUME_REVIEW_HEADING
    : OPERATOR_HOME_COMPACT_STARTING_ACTIONS_HEADING;

  const showStarterPacks = props.workingMode !== true && props.pagePrimaryOwnedByHeader !== true;
  const demoted = props.pagePrimaryOwnedByHeader === true;
  const hasVisibleBody =
    props.pagePrimaryOwnedByHeader !== true ||
    showStarterPacks ||
    !hideDualPathCards;

  if (!hasVisibleBody) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-compact-starting-actions-heading"
      className={OPERATOR_LAYOUT.sectionHeadingStack}
      data-testid="operator-home-compact-starting-actions"
      data-demoted={demoted ? "true" : undefined}
    >
      <div className={OPERATOR_LAYOUT.sectionStack}>
        <OperatorHomeCardSectionTitle id="operator-home-compact-starting-actions-heading">
          {sectionHeading}
        </OperatorHomeCardSectionTitle>
        {props.pagePrimaryOwnedByHeader === true ? null : props.workingMode === true ? (
          <OperatorHomeWorkingPrimaryCta variant={workingCtaVariant} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="primary" size="sm" className="h-8 w-fit">
              <Link href={ARCHITECTURES_NEW_PATH} data-testid="operator-home-start-new-review">
                {START_REVIEW_LABEL}
              </Link>
            </Button>
          </div>
        )}
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
