"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_HELP_LINK,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
  PILOT_COMMAND_CENTER_SAMPLE_LINK,
  PILOT_COMMAND_CENTER_STEPS_HEADING,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

const tertiaryLinkClass = cn(
  OPERATOR_TYPOGRAPHY.meta,
  "font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-al-accent-interactive",
);

/**
 * Single next-action command center for first-run operator home — one primary CTA, quiet supporting links.
 *
 * Relocation note (home keeps deep links for first-run discoverability only):
 * - Connect Azure also lives under Settings → Cloud connections and the evidence intake / new-review wizard.
 * - Invite reviewer also lives under Settings → Roles and governance approval flows on review packages.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body)}
      data-testid="pilot-command-center-card"
    >
      <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
        {PILOT_COMMAND_CENTER_HEADING}
      </h2>
      <p className={cn("m-0 mt-3 max-w-2xl", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        {PILOT_COMMAND_CENTER_LEAD}
      </p>

      <div className={cn("mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center", OPERATOR_LAYOUT.unrelatedClusterGap)}>
        <Button asChild variant="primary" className="w-full justify-center sm:w-auto">
          <Link href="/reviews/new" data-testid="pilot-command-center-primary">
            {PILOT_COMMAND_CENTER_PRIMARY_CTA}
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-center sm:w-auto">
          <Link href={sampleReviewHref} data-testid="pilot-command-center-example">
            {PILOT_COMMAND_CENTER_SAMPLE_LINK}
          </Link>
        </Button>
        <Link href="/help/core-pilot" className={cn(tertiaryLinkClass, "text-center sm:text-left")} data-testid="pilot-command-center-help">
          {PILOT_COMMAND_CENTER_HELP_LINK}
        </Link>
      </div>

      <p
        className={cn("m-0 mt-3 flex flex-wrap items-center gap-x-1 gap-y-1", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
        data-testid="pilot-command-center-tertiary-actions"
      >
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

      <div className={cn("mt-4 grid border-t border-neutral-200/80 pt-4 dark:border-neutral-800 sm:grid-cols-2", OPERATOR_LAYOUT.controlClusterGap)}>
        <div>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>
            {PILOT_COMMAND_CENTER_OUTCOMES_HEADING}
          </p>
          <ul
            className={cn("m-0 mt-2 grid list-none gap-x-3 gap-y-1 p-0 grid-cols-2", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
            data-testid="pilot-command-center-outcomes"
          >
            {PILOT_COMMAND_CENTER_OUTCOMES.map((outcome) => (
              <li key={outcome} className="flex items-center gap-2">
                <span aria-hidden className="text-al-accent-interactive">
                  ✓
                </span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>
            {PILOT_COMMAND_CENTER_STEPS_HEADING}
          </p>
          <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="mt-2" />
        </div>
      </div>
    </section>
  );
}
