"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
  PILOT_PATH_PREVIEW_STEPS,
  resolveOperatorHomeHeroHeading,
} from "@/lib/buyer-polish-copy";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";
import { resolvePilotNextBestAction, type PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import { cn } from "@/lib/utils";

const optionalSetupButtonClass = "h-7";

const DEFAULT_NEXT_ACTION: PilotNextBestAction = {
  label: "Start review",
  href: "/reviews/new",
  bridgeCopy: "Each architecture review is tracked as one review package from capture through signed review record and export.",
};

/**
 * Single next-action command center for operator Overview — compact hero with one state-aware primary CTA.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const heroHeading = resolveOperatorHomeHeroHeading(hasCommittedArchitectureReview);
  const [nextAction, setNextAction] = useState<PilotNextBestAction>(DEFAULT_NEXT_ACTION);

  useEffect(() => {
    let cancelled = false;

    async function loadNextAction(): Promise<void> {
      try {
        const ctx = await fetchCorePilotCommitContext();

        if (cancelled) {
          return;
        }

        setNextAction(resolvePilotNextBestAction(ctx, hasCommittedArchitectureReview));
      } catch {
        if (!cancelled) {
          setNextAction(DEFAULT_NEXT_ACTION);
        }
      }
    }

    void loadNextAction();

    return () => {
      cancelled = true;
    };
  }, [hasCommittedArchitectureReview]);

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
            {nextAction.bridgeCopy}
          </p>
        </div>

        <div
          className={cn("heroActions flex shrink-0 flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}
          data-testid="pilot-command-center-cta-row"
        >
          <Button asChild variant="primary" size="sm" className="h-8">
            <Link href={nextAction.href} data-testid="pilot-next-best-action">
              {nextAction.label}
            </Link>
          </Button>
        </div>
      </div>

      {!hasCommittedArchitectureReview ? (
        <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="heroSteps mt-2" />
      ) : null}

      {!hasCommittedArchitectureReview ? (
        <div className="heroOptionalSetup mt-2 space-y-2" data-testid="pilot-command-center-optional-setup">
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
            {PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL}
          </p>
          <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
            <Button asChild variant="outline" size="sm" className={optionalSetupButtonClass}>
              <Link href={CLOUD_CONNECTIONS_PATH} data-testid="pilot-command-center-connect-azure">
                {PILOT_COMMAND_CENTER_CONNECT_AZURE}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className={optionalSetupButtonClass}>
              <Link href={INVITE_REVIEWER_PATH} data-testid="pilot-command-center-invite-reviewer">
                {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
