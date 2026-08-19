"use client";

import Link from "next/link";

import { InviteeFirstScreenSpecimen } from "@/components/operator/InviteeFirstScreenSpecimen";
import { Button } from "@/components/ui/button";
import type { InviteeFirstOrientationCopy } from "@/lib/invitee-first-orientation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InviteeFirstOrientationPanelProps = {
  readonly copy: InviteeFirstOrientationCopy;
  readonly className?: string;
};

/** Reviewer-first job framing for invited readers (TB-2182). Specimen steps: TB-2235. */
export function InviteeFirstOrientationPanel(props: InviteeFirstOrientationPanelProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="invitee-first-orientation-heading"
      className={cn(
        "space-y-3 rounded-md border border-al-border bg-al-surface-raised p-4",
        props.className,
      )}
      data-testid="invitee-first-orientation-panel"
    >
      <h2
        id="invitee-first-orientation-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {props.copy.heading}
      </h2>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="invitee-first-orientation-job">
        {props.copy.jobSentence}
      </p>
      <InviteeFirstScreenSpecimen />
      <Button asChild variant="primary" size="sm">
        <Link href={props.copy.findingsCtaHref} data-testid="invitee-first-orientation-primary">
          {props.copy.findingsCtaLabel}
        </Link>
      </Button>
    </section>
  );
}
