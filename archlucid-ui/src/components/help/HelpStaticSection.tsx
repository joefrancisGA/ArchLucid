import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

type HelpStaticSectionProps = {
  readonly title: string;
  readonly children: ReactNode;
  /** Anchor id for the section heading (deep links / TOC). */
  readonly id?: string;
  readonly headingLevel?: 2 | 3 | 4;
  readonly testId?: string;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly preface?: ReactNode;
  /** Optional one-line preview below the title (replaces collapsible summary lines). */
  readonly intro?: string;
};

/**
 * Always-visible help section — replaces collapsible `<details>` on `/help/*` topics.
 */
export function HelpStaticSection(props: HelpStaticSectionProps): React.ReactElement {
  const { title, children, id, headingLevel = 3, testId, className, bodyClassName, preface, intro } = props;

  const headingClassName = cn(
    "m-0 font-medium text-al-text-primary",
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    headingLevel === 2 ? OPERATOR_TYPOGRAPHY.sectionTitle : OPERATOR_TYPOGRAPHY.cardTitle,
  );

  return (
    <section className={cn(HELP_PAGE_LAYOUT.details, className)} data-testid={testId}>
      {headingLevel === 2 ? (
        <h2 id={id} className={headingClassName}>{title}</h2>
      ) : headingLevel === 4 ? (
        <h4 id={id} className={headingClassName}>{title}</h4>
      ) : (
        <h3 id={id} className={headingClassName}>{title}</h3>
      )}
      {preface}
      {intro !== undefined && intro.trim().length > 0 ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{intro}</p>
      ) : null}
      <div className={cn("mt-3", bodyClassName)}>{children}</div>
    </section>
  );
}
