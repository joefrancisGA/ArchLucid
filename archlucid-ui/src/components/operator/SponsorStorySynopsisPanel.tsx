"use client";

import Link from "next/link";

import {
  buildSponsorStorySynopsisParagraph,
  SPONSOR_STORY_SYNOPSIS_WORKING_LABEL,
  type SponsorStoryDispositionCounts,
} from "@/lib/sponsor-story-synopsis";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SponsorStorySynopsisPanelProps = {
  readonly synopsisParagraph: string;
  readonly sponsorHandoffHref?: string | null;
  readonly className?: string;
};

/** Sticky working sponsor narrative while disposing findings (TB-2183). */
export function SponsorStorySynopsisPanel(props: SponsorStorySynopsisPanelProps): React.JSX.Element {
  return (
    <aside
      aria-labelledby="sponsor-story-synopsis-heading"
      className={cn(
        "sticky top-0 z-10 space-y-2 rounded-md border border-al-border bg-al-surface-raised p-3 shadow-sm",
        props.className,
      )}
      data-testid="sponsor-story-synopsis-panel"
    >
      <p
        id="sponsor-story-synopsis-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
      >
        {SPONSOR_STORY_SYNOPSIS_WORKING_LABEL}
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="sponsor-story-synopsis-paragraph">
        {props.synopsisParagraph}
      </p>
      {props.sponsorHandoffHref !== null && props.sponsorHandoffHref !== undefined && props.sponsorHandoffHref.length > 0 ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.inline} href={props.sponsorHandoffHref} data-testid="sponsor-story-synopsis-handoff-link">
            Open sponsor handoff when finalize-ready
          </Link>
        </p>
      ) : null}
    </aside>
  );
}

export type SponsorStorySynopsisFromCountsProps = {
  readonly packageTitle: string;
  readonly counts: SponsorStoryDispositionCounts;
  readonly sponsorHandoffHref?: string | null;
  readonly className?: string;
};

export function SponsorStorySynopsisFromCounts(props: SponsorStorySynopsisFromCountsProps): React.JSX.Element {
  const synopsisParagraph = buildSponsorStorySynopsisParagraph({
    packageTitle: props.packageTitle,
    counts: props.counts,
  });

  return (
    <SponsorStorySynopsisPanel
      synopsisParagraph={synopsisParagraph}
      sponsorHandoffHref={props.sponsorHandoffHref}
      className={props.className}
    />
  );
}
