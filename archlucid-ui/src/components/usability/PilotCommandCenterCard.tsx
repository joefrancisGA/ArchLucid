"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_HOME_PRIMARY_CTA,
  BUYER_HOME_SECONDARY_CTA,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_PRIMARY_CTA,
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
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
      data-testid="pilot-command-center-card"
    >
      <h2 id="pilot-command-center-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.title)}>
        {PILOT_COMMAND_CENTER_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 max-w-2xl", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        {PILOT_COMMAND_CENTER_LEAD}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button asChild variant="primary" className="w-full justify-center sm:w-auto">
          <Link href="/reviews/new" data-testid="pilot-command-center-primary">
            {PILOT_COMMAND_CENTER_PRIMARY_CTA}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={sampleReviewHref}
            className={cn(
              OPERATOR_TYPOGRAPHY.body,
              "font-medium text-al-accent-interactive underline decoration-al-accent-interactive/40 underline-offset-2 hover:decoration-al-accent-interactive",
            )}
            data-testid="pilot-command-center-example"
          >
            {BUYER_HOME_PRIMARY_CTA}
          </Link>
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
        </div>
      </div>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.meta, "text-al-text-secondary")}>
        Prefer a guided walkthrough?{" "}
        <Link href="/reviews/new" className="font-medium text-al-accent-interactive underline underline-offset-2">
          {BUYER_HOME_SECONDARY_CTA}
        </Link>
      </p>
    </section>
  );
}
