"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type PersistentSponsorEmailStripProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
};

/** Compact persistent sponsor handoff CTA after commit — anchors to the full sponsor banner on the page. */
export function PersistentSponsorEmailStrip(props: PersistentSponsorEmailStripProps) {
  if (!props.isCommitted) {
    return null;
  }

  return (
    <div
      className="sticky top-[calc(var(--app-shell-sticky,6rem)+0.5rem)] z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="persistent-sponsor-email-strip"
    >
      <p className={cn("m-0 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Review finalized — download sponsor exports below or open the full handoff package.
      </p>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href="#sponsor-handoff" data-testid="persistent-sponsor-email-strip-cta">
          Send to sponsor
        </Link>
      </Button>
    </div>
  );
}
