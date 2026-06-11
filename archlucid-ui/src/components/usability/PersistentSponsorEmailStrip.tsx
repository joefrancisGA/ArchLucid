"use client";

import Link from "next/link";

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
      className="sticky top-[calc(var(--app-shell-sticky,0px)+0.5rem)] z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-teal-200 bg-teal-50/90 px-3 py-2 dark:border-teal-900 dark:bg-teal-950/40"
      data-testid="persistent-sponsor-email-strip"
    >
      <p className="m-0 text-sm text-teal-950 dark:text-teal-100">
        Review committed — email the sponsor packet or open exports below.
      </p>
      <Link
        href="#sponsor-handoff"
        className="text-sm font-semibold text-teal-900 underline underline-offset-2 dark:text-teal-200"
      >
        Jump to sponsor handoff
      </Link>
    </div>
  );
}
