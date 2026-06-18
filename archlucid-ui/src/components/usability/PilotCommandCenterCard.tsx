"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_FIRST_RUN_STEPS,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
  PILOT_COMMAND_CENTER_TRY_SAMPLE_LINK,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { ZERO_CONFIG_DEMO_WIZARD_HREF } from "@/lib/zero-config-demo-mode";
import { cn } from "@/lib/utils";

const tertiaryLinkClass = cn(
  OPERATOR_TYPOGRAPHY.meta,
  "font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-al-accent-interactive",
);

/**
 * Single next-action command center for first-run operator home — one primary CTA, quiet supporting links.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "py-4")}
      data-testid="pilot-command-center-card"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
            {PILOT_COMMAND_CENTER_HEADING}
          </h2>

          <div className={cn("flex flex-col sm:flex-row sm:flex-wrap sm:items-center", OPERATOR_LAYOUT.inlineGap)}>
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

          <p
            className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
            data-testid="pilot-command-center-first-run-steps"
          >
            {PILOT_COMMAND_CENTER_FIRST_RUN_STEPS}
          </p>

          <p
            className={cn("m-0 flex flex-wrap items-center gap-x-1 gap-y-1", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
            data-testid="pilot-command-center-tertiary-actions"
          >
            <span>{PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL}</span>
            <Link href="/settings/cloud-connections" className={tertiaryLinkClass} data-testid="pilot-command-center-connect-azure">
              {PILOT_COMMAND_CENTER_CONNECT_AZURE}
            </Link>
            <span aria-hidden className="text-al-text-secondary/50">
              ·
            </span>
            <Link href="/settings/roles" className={tertiaryLinkClass} data-testid="pilot-command-center-invite-reviewer">
              {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
            </Link>
          </p>
        </div>

        <div className="min-w-0 lg:max-w-md lg:flex-1">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>
            {PILOT_COMMAND_CENTER_OUTCOMES_HEADING}
          </p>
          <ul
            className={cn("m-0 mt-2 flex flex-wrap list-none gap-2 p-0", OPERATOR_TYPE_SCALE.meta)}
            data-testid="pilot-command-center-outcomes"
          >
            {PILOT_COMMAND_CENTER_OUTCOMES.map((outcome) => (
              <li
                key={outcome}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50 px-2 py-1 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/50"
              >
                <span aria-hidden className="text-al-accent-interactive">
                  ✓
                </span>
                {outcome}
              </li>
            ))}
          </ul>
          <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="mt-3" />
        </div>
      </div>
    </section>
  );
}
