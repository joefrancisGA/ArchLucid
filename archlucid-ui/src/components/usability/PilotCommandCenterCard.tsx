"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
  PILOT_COMMAND_CENTER_TRY_SAMPLE_LINK,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { ZERO_CONFIG_DEMO_WIZARD_HREF } from "@/lib/zero-config-demo-mode";
import { cn } from "@/lib/utils";

const optionalSetupLinkClass = cn(
  OPERATOR_TYPOGRAPHY.meta,
  "font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-al-accent-interactive",
);

/**
 * Single next-action command center for first-run operator home — compact hero with one primary CTA.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "px-4 py-3")}
      data-testid="pilot-command-center-card"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
              {PILOT_COMMAND_CENTER_HEADING}
            </h2>
            <p
              className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
              data-testid="pilot-command-center-lead"
            >
              {PILOT_COMMAND_CENTER_LEAD}
            </p>
          </div>

          <div
            className={cn("flex shrink-0 flex-col sm:flex-row sm:flex-wrap sm:items-center", OPERATOR_LAYOUT.inlineGap)}
            data-testid="pilot-command-center-cta-row"
          >
            <Button asChild variant="primary" className="w-full justify-center sm:w-auto">
              <Link href="/reviews/new" data-testid="pilot-command-center-primary">
                {PILOT_COMMAND_CENTER_PRIMARY_CTA}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-center sm:w-auto">
              <Link href={ZERO_CONFIG_DEMO_WIZARD_HREF} data-testid="pilot-command-center-try-sample">
                {PILOT_COMMAND_CENTER_TRY_SAMPLE_LINK}
              </Link>
            </Button>
          </div>
        </div>

        <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="mt-0" />

        <p
          className={cn("m-0 flex flex-wrap items-center gap-x-1 gap-y-1", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
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
            href="/settings/roles"
            className={optionalSetupLinkClass}
            data-testid="pilot-command-center-invite-reviewer"
          >
            {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
          </Link>
        </p>
      </div>
    </section>
  );
}
