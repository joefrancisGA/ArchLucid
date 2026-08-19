import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";

type MarketingAccessibilityContentSectionProps = {
  id: string;
  title: string;
  markdownBody: string;
  tableCaption: string;
  headingLevel?: 2 | 3;
};

/**
 * One policy-backed section for the public accessibility page; `markdownBody` must come from `ACCESSIBILITY.md`
 * so marketing copy cannot drift from the repo-wide source.
 */
export function MarketingAccessibilityContentSection(props: MarketingAccessibilityContentSectionProps): ReactNode {
  const HeadingTag = props.headingLevel === 3 ? "h3" : "h2";
  const headingClass =
    props.headingLevel === 3
      ? (cn("mt-6 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle))
      : (cn("mt-10 font-semibold tracking-tight text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle));

  return (
    <section aria-labelledby={props.id} className="scroll-mt-24">
      <HeadingTag id={props.id} className={headingClass}>
        {props.title}
      </HeadingTag>
      <MarketingAccessibilityMarkdownFragment markdownBody={props.markdownBody} tableCaption={props.tableCaption} />
    </section>
  );
}
