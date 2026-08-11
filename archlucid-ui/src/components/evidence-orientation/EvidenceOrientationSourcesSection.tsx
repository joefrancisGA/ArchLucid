import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { cn } from "@/lib/utils";

/** Panel wash: most Sources bands sit on a muted panel; follow-up bands sit on the raised surface. */
export type EvidenceOrientationSourcesSurface = "muted" | "raised";

const SOURCES_SURFACE_CLASS: Record<EvidenceOrientationSourcesSurface, string> = {
  muted: "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  raised: "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800",
};

/** `wrap` reads as a chip row; `stacked` gives each link its own line so a `when` caption can follow it. */
export type EvidenceOrientationSourcesLayout = "wrap" | "stacked";

const SOURCES_LIST_CLASS: Record<EvidenceOrientationSourcesLayout, string> = {
  wrap: "m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0",
  stacked: "m-0 mt-2 list-none space-y-2 p-0",
};

/** Keeps each Sources link at the 24px minimum pointer target without inflating the chip row. */
const SOURCES_LINK_CLASS = "inline-flex min-h-6 items-center py-1 font-medium";

export type EvidenceOrientationSourcesSectionProps = {
  readonly testId: string;
  readonly headingId: string;
  readonly title: string;
  readonly intro: string;
  readonly links: readonly EvidenceOrientationLink[];
  readonly surface?: EvidenceOrientationSourcesSurface;
  readonly layout?: EvidenceOrientationSourcesLayout;
};

/** Sources / follow-up index band shared by every evidence orientation strip. */
export function EvidenceOrientationSourcesSection({
  testId,
  headingId,
  title,
  intro,
  links,
  surface = "muted",
  layout = "wrap",
}: EvidenceOrientationSourcesSectionProps): React.JSX.Element {
  return (
    <section className={SOURCES_SURFACE_CLASS[surface]} aria-labelledby={headingId} data-testid={testId}>
      <h2 id={headingId} className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {title}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{intro}</p>
      <ul className={cn(SOURCES_LIST_CLASS[layout], OPERATOR_TYPOGRAPHY.body)}>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link className={cn(OPERATOR_LINK.inline, SOURCES_LINK_CLASS)} href={link.href}>
              {link.label}
              {link.adminOnly === true ? (
                <span className={cn("ml-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>(Admin)</span>
              ) : null}
            </Link>
            {link.when === undefined ? null : (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{link.when}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
