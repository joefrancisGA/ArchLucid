import Link from "next/link";

import {
  EVIDENCE_ORIENTATION_HEADING_CLASS,
  EVIDENCE_SOURCES_STYLE,
  type EvidenceOrientationSourcesStyle,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { cn } from "@/lib/utils";

/** `wrap` reads as a chip row; `stacked` gives each link its own line so a `when` caption can follow it. */
export type EvidenceOrientationSourcesLayout = "wrap" | "stacked";

const SOURCES_LIST_CLASS: Record<EvidenceOrientationSourcesLayout, string> = {
  wrap: "m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0",
  stacked: "m-0 mt-2 list-none space-y-2 p-0",
};

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
}: EvidenceOrientationSourcesSectionProps): React.JSX.Element {
  return (
    <section className={style.panel} aria-labelledby={headingId} data-testid={testId}>
      <h2 id={headingId} className={EVIDENCE_ORIENTATION_HEADING_CLASS}>
        {title}
      </h2>
      <p className={style.intro}>{intro}</p>
      <ul className={cn(SOURCES_LIST_CLASS[layout], listClassName ?? OPERATOR_TYPOGRAPHY.body)}>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link className={style.link} href={link.href}>
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
