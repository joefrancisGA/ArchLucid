"use client";

import Link from "next/link";

import {
  EVIDENCE_ORIENTATION_HEADING_CLASS,
  EVIDENCE_SOURCES_STYLE,
  type EvidenceOrientationSourcesStyle,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import { useWhereToGoNextVisible } from "@/components/WhereToGoNextPreferenceProvider";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { cn } from "@/lib/utils";

/** `wrap` reads as a chip row; `stacked` gives each link its own line; `columns` places intro beside a two-column link index. */
export type EvidenceOrientationSourcesLayout = "wrap" | "stacked" | "columns";

const SOURCES_LIST_CLASS: Record<Exclude<EvidenceOrientationSourcesLayout, "columns">, string> = {
  wrap: "m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0",
  stacked: "m-0 mt-2 list-none space-y-2 p-0",
};

const SOURCES_COLUMNS_PANEL_CLASS =
  "md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-6 md:gap-y-2";

const SOURCES_COLUMNS_LIST_CLASS = "m-0 mt-2 grid list-none gap-x-3 gap-y-1 p-0 sm:grid-cols-2";

/** A single follow-up reads better as a tight stack beside the intro — not a sparse two-column index. */
const SOURCES_COLUMNS_COMPACT_LIST_CLASS = "m-0 mt-2 flex list-none flex-col gap-y-1 p-0 md:mt-0";

export type EvidenceOrientationSourcesSectionProps = {
  readonly testId: string;
  readonly headingId: string;
  readonly title: string;
  readonly intro: string;
  readonly links: readonly EvidenceOrientationLink[];
  readonly style?: EvidenceOrientationSourcesStyle;
  readonly layout?: EvidenceOrientationSourcesLayout;
  /** Optional list scale override — help strips pass {@link HELP_PAGE_LAYOUT.readingBody} for strip parity. */
  readonly listClassName?: string;
  /** Optional heading scale — help specialty guides pass sectionTitle so TOC h2s match page sections. */
  readonly headingClassName?: string;
  /**
   * When true, prefixes follow-up link labels with Read (help) or Open (product) so readers know
   * the destination before click.
   */
  readonly distinguishFollowUpDestinations?: boolean;
  /** When set, the matching follow-up renders as an outline button above the link list. */
  readonly promotedSourceHref?: string;
};

/** Sources / follow-up index band shared by every evidence orientation strip. */
export function EvidenceOrientationSourcesSection({
  testId,
  headingId,
  title,
  intro,
  links,
  style = EVIDENCE_SOURCES_STYLE.operatorMuted,
  layout = "wrap",
  listClassName,
  headingClassName,
  distinguishFollowUpDestinations = true,
  promotedSourceHref,
}: EvidenceOrientationSourcesSectionProps): React.JSX.Element | null {
  const whereToGoNextVisible = useWhereToGoNextVisible();

  if (!whereToGoNextVisible) {
    return null;
  }

  const heading = (
    <h2 id={headingId} className={headingClassName ?? EVIDENCE_ORIENTATION_HEADING_CLASS}>
      {title}
    </h2>
  );
  const introParagraph = <p className={style.intro}>{intro}</p>;
  const listClassNameResolved = listClassName ?? OPERATOR_TYPOGRAPHY.body;
  const columnsLinkListClass =
    links.length <= 1 ? SOURCES_COLUMNS_COMPACT_LIST_CLASS : SOURCES_COLUMNS_LIST_CLASS;
  const linkItems = links.map((link) => {
          const linkLabel = distinguishFollowUpDestinations
            ? formatHelpFollowUpLinkAccessibleName(link.href, link.label)
            : link.label;
          const isPromoted = promotedSourceHref !== undefined && link.href === promotedSourceHref;

          return (
          <li key={`${link.href}-${link.label}`}>
            {isPromoted ? (
              <Button asChild size="sm" variant="outline">
                <Link className={style.link} href={link.href}>
                  {linkLabel}
                </Link>
              </Button>
            ) : (
              <Link className={style.link} href={link.href}>
                {linkLabel}
                {link.adminOnly === true ? (
                  <span className={cn("ml-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>(Admin)</span>
                ) : null}
              </Link>
            )}
            {link.when === undefined ? null : (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{link.when}</p>
            )}
          </li>
          );
        });

  return (
    <section
      className={cn(style.panel, layout === "columns" && SOURCES_COLUMNS_PANEL_CLASS)}
      aria-labelledby={headingId}
      data-testid={testId}
      data-layout={layout}
    >
      {layout === "columns" ? (
        <>
          <div>
            {heading}
            {introParagraph}
          </div>
          <ul className={cn(columnsLinkListClass, listClassNameResolved)}>{linkItems}</ul>
        </>
      ) : (
        <>
          {heading}
          {introParagraph}
          <ul className={cn(SOURCES_LIST_CLASS[layout], listClassNameResolved)}>{linkItems}</ul>
        </>
      )}
    </section>
  );
}
