"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_HELP_LINK,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_TOGGLE,
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
  PILOT_COMMAND_CENTER_SAMPLE_LINK,
  PILOT_COMMAND_CENTER_STEPS_HEADING,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** Single next-action command center for first-run operator home — one primary CTA, quiet supporting links. */
export function PilotCommandCenterCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-3 sm:p-4")}
      data-testid="pilot-command-center-card"
    >
      <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
        {PILOT_COMMAND_CENTER_HEADING}
      </h2>
      <p className={cn("m-0 mt-1.5 max-w-2xl", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        {PILOT_COMMAND_CENTER_LEAD}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
        <Link
          href="/help/core-pilot"
          className={cn(
            OPERATOR_TYPOGRAPHY.meta,
            "text-center font-medium text-al-text-secondary underline decoration-al-text-secondary/40 underline-offset-2 hover:text-al-text-primary hover:decoration-al-accent-interactive sm:text-left",
          )}
          data-testid="pilot-command-center-help"
        >
          {PILOT_COMMAND_CENTER_HELP_LINK}
        </Link>
      </div>

      <div className="mt-3 border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>
          {PILOT_COMMAND_CENTER_OUTCOMES_HEADING}
        </p>
        <ul
          className={cn("m-0 mt-1.5 grid list-none gap-x-4 gap-y-1 p-0 sm:grid-cols-2", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}
          data-testid="pilot-command-center-outcomes"
        >
          {PILOT_COMMAND_CENTER_OUTCOMES.map((outcome) => (
            <li key={outcome} className="flex items-center gap-1.5">
              <span aria-hidden className="text-al-accent-interactive">
                ✓
              </span>
              {outcome}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className={cn("m-0 mb-1.5", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>
          {PILOT_COMMAND_CENTER_STEPS_HEADING}
        </p>
        <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="mt-0" />
      </div>

      <Collapsible className="mt-3 border-t border-neutral-200/80 pt-2 dark:border-neutral-800">
        <CollapsibleTrigger
          className={cn(
            OPERATOR_TYPOGRAPHY.meta,
            "text-left font-medium text-al-text-secondary underline-offset-2 hover:text-al-text-primary hover:underline",
          )}
          data-testid="pilot-command-center-optional-setup-toggle"
        >
          {PILOT_COMMAND_CENTER_OPTIONAL_SETUP_TOGGLE}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <Link
            href="/settings/cloud-connections"
            className={cn(OPERATOR_TYPOGRAPHY.meta, "text-al-text-secondary underline underline-offset-2 hover:text-al-text-primary")}
          >
            {PILOT_COMMAND_CENTER_CONNECT_AZURE}
          </Link>
          <Link
            href="/settings/roles"
            className={cn(OPERATOR_TYPOGRAPHY.meta, "text-al-text-secondary underline underline-offset-2 hover:text-al-text-primary")}
          >
            {PILOT_COMMAND_CENTER_INVITE_REVIEWER}
          </Link>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
