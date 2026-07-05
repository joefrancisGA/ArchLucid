import Link from "next/link";

import { InlineGuidance } from "@/components/InlineGuidance";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OPERATOR_HOME_CONTINUE_SETUP_BODY } from "@/lib/buyer-polish-copy";
import { formatSetupReadinessCompleteLabel } from "@/lib/operator-home-workspace-metrics";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeContinueSetupCardProps = {
  readonly readyCount?: number;
  readonly totalCount?: number;
  readonly loading?: boolean;
};

/** Slim home card linking to Getting started for workspace setup without internal checklist jargon (TB-443). */
export function OperatorHomeContinueSetupCard(props: OperatorHomeContinueSetupCardProps = {}) {
  const showReadinessStatus =
    props.loading !== true
    && typeof props.readyCount === "number"
    && typeof props.totalCount === "number"
    && props.totalCount > 0;

  return (
    <section
      aria-labelledby="continue-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "flex items-center justify-between gap-4")}
      data-testid="home-block-continue-setup"
    >
      <div className={cn("min-w-0 flex-1", OPERATOR_LAYOUT.sectionHeadingStack)}>
        <OperatorHomeCardSectionTitle id="continue-setup-heading">Continue setup</OperatorHomeCardSectionTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          <InlineGuidance label="Optional setup:" labelTestId="inline-guidance-optional-setup">
            {OPERATOR_HOME_CONTINUE_SETUP_BODY}
          </InlineGuidance>
        </p>
        {showReadinessStatus ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
            <InlineGuidance label="Setup readiness:" labelTestId="inline-guidance-setup-readiness">
              {formatSetupReadinessCompleteLabel(props.readyCount ?? 0, props.totalCount ?? 0)}
            </InlineGuidance>
          </p>
        ) : null}
      </div>
      <Link
        href="/onboarding"
        className={cn(
          "inline-flex shrink-0 items-center rounded-md border border-neutral-300 px-3 py-1.5",
          OPERATOR_TYPE_SCALE.button,
          "font-medium text-al-text-primary hover:border-neutral-400 hover:bg-[var(--al-layer-hover)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)]",
          "dark:border-neutral-700 dark:hover:border-neutral-600",
        )}
      >
        Open setup guide
      </Link>
    </section>
  );
}
