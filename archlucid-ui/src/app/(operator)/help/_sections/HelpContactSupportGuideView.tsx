import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ContactSupportHelpEmailSection } from "@/components/help/ContactSupportHelpEmailSection";
import { ContactSupportHelpOrientationStack } from "@/components/help/ContactSupportHelpOrientationStack";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  CONTACT_SUPPORT_HELP_BREADCRUMB_TOPIC_TITLE,
  CONTACT_SUPPORT_HELP_GUIDE_HEADINGS,
  CONTACT_SUPPORT_HELP_OVERVIEW,
  CONTACT_SUPPORT_HELP_PAGE_TITLE,
  CONTACT_SUPPORT_HELP_PATH,
  CONTACT_SUPPORT_HELP_PATH_ROWS,
  CONTACT_SUPPORT_HELP_PATH_TABLE_HEADING,
  CONTACT_SUPPORT_HELP_RELATED,
  CONTACT_SUPPORT_HELP_RELATED_HEADING,
  CONTACT_SUPPORT_HELP_SUBTITLE,
  CONTACT_SUPPORT_HELP_ACTIONS_SECTION_TITLE,
} from "@/lib/contact-support-help-guide-content";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpContactSupportGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

/** Operator contact support orientation for `/help/contact-support`. */
export function HelpContactSupportGuideView(props: HelpContactSupportGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(CONTACT_SUPPORT_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-contact-support-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={CONTACT_SUPPORT_HELP_PAGE_TITLE}
        titleTestId="help-contact-support-page-title"
        subtitle={CONTACT_SUPPORT_HELP_SUBTITLE}
        navHref={CONTACT_SUPPORT_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-contact-support-overview">
            {CONTACT_SUPPORT_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="contact-support-actions"
            className="space-y-3"
            data-testid="help-contact-support-actions-section"
          >
            <HelpSectionHeading id="contact-support-actions">
              {CONTACT_SUPPORT_HELP_ACTIONS_SECTION_TITLE}
            </HelpSectionHeading>
            <ContactSupportHelpOrientationStack />
          </section>

          <section
            aria-labelledby="choose-the-right-path"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-contact-support-path-table-section"
          >
            <HelpSectionHeading id="choose-the-right-path">
              {CONTACT_SUPPORT_HELP_PATH_TABLE_HEADING}
            </HelpSectionHeading>
            <div className="overflow-x-auto">
              <table className={HELP_PAGE_LAYOUT.table} data-testid="help-contact-support-path-table">
                <thead>
                  <tr>
                    <th scope="col">Situation</th>
                    <th scope="col">What to do</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTACT_SUPPORT_HELP_PATH_ROWS.map((row) => (
                    <tr key={row.situation}>
                      <td className="align-top text-al-text-primary">{row.situation}</td>
                      <td className="align-top">
                        {row.actionHref.startsWith("mailto:") ? (
                          <a className={OPERATOR_LINK.inline} href={row.actionHref}>
                            {row.actionLabel}
                          </a>
                        ) : (
                          <Link className={OPERATOR_LINK.inline} href={row.actionHref}>
                            {row.actionLabel}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ContactSupportHelpEmailSection />

          <section
            aria-labelledby="related-topics"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-contact-support-related-section"
          >
            <HelpSectionHeading id="related-topics">{CONTACT_SUPPORT_HELP_RELATED_HEADING}</HelpSectionHeading>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
              {CONTACT_SUPPORT_HELP_RELATED.map((link) => (
                <li key={link.href}>
                  <Link className={OPERATOR_LINK.inline} href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={CONTACT_SUPPORT_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
