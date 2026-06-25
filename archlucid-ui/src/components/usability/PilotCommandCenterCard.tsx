"use client";

import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
  PILOT_PATH_PREVIEW_STEPS,
  resolveOperatorHomeHeroHeading,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const optionalSetupLinkClass = cn(
  OPERATOR_TYPE_SCALE.meta,
  "font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-al-accent-interactive",
);

/**
 * Single next-action command center for first-run operator home — compact hero with one primary CTA.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  const hasWorkspaceActivity = useNavCommittedArchitectureReview();
  const heroHeading = resolveOperatorHomeHeroHeading(hasWorkspaceActivity);

  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "heroCard")}
      data-testid="pilot-command-center-card"
    >
      <div className="heroHeader flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
            {heroHeading}
          </h2>
          <p
            className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
            data-testid="pilot-command-center-lead"
          >
            {PILOT_COMMAND_CENTER_LEAD}
          </p>
        </div>

        <div
          className={cn("heroActions flex shrink-0 flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}
          data-testid="pilot-command-center-cta-row"
        >
          <Button asChild variant="primary" size="sm" className="h-8">
            <Link href="/reviews/new" data-testid="pilot-command-center-primary">
              {PILOT_COMMAND_CENTER_PRIMARY_CTA}
            </Link>
          </Button>
        </div>
      </div>

      <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="heroSteps mt-2" />

      <p
        className={cn(
          "heroOptionalSetup m-0 mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5",
          OPERATOR_TYPE_SCALE.meta,
          "text-al-text-secondary/80",
        )}
        data-testid="pilot-command-center-optional-setup"
      >
        <span>{PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL}</span>
        <Link
          href="/settings/cloud-connections"
          className={optionalSetupLinkClass}
          data-testid="pilot-command-center-connect-azure"
        >
          {PILOT_COMMAND_CENTER_CONNECT_AZURE}
        </Link>
        <span aria-hidden className="text-al-text-secondary/60">
          ·
        </span>
        <Link
          href="/settings/roles?tab=users"
          className={optionalSetupLinkClass}
          data-testid="pilot-command-center-invite-reviewer"
        >
          {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
        </Link>
      </p>
    </section>
  );
}
