import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTechnicalReferenceNavigation } from "@/components/help/HelpTechnicalReferenceNavigation";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLI_USAGE_HELP_REFERENCE_LANDING } from "@/lib/help/help-cli-usage-reference-content";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpCliUsageTechnicalReferenceViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Navigable technical reference for `/help/cli-usage` (TB-948). */
export function HelpCliUsageTechnicalReferenceView(
  props: HelpCliUsageTechnicalReferenceViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preserveMaintenanceMetadata = entry.audience === "developer";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    preserveMaintenanceMetadata,
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headingGroups = groupHelpMarkdownHeadings(headings);
  const majorSections = headings.filter((heading) => heading.level === 2);

  return (
    <article className={cn(OPERATOR_LAYOUT.majorSectionGap, HELP_PAGE_LAYOUT.technicalReferenceArticle)}>
      <a href="#cli-usage-reference-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to CLI reference
      </a>
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <HelpTopicTitleRow title={entry.title} />
            <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>{entry.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        </div>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.label}`}>
          Engineering runbook — CLI commands, environment variables, and log detail. For symptom-first operator help,
          open{" "}
          <Link href={inAppHelpHref("troubleshooting")} className={`underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}>
            Troubleshooting
          </Link>
          .
        </p>
      </header>
<section
        aria-labelledby="cli-usage-reference-landing-heading"
        className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
        data-testid="help-cli-usage-reference-landing"
      >
        <div className="space-y-1">
          <h2 id="cli-usage-reference-landing-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Reference overview
          </h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.purpose}</p>
        </div>

        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Audience</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.audience}</dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Support status</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.stability}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Authoritative source</dt>
            <dd className={cn("m-0 mt-1 font-mono text-sm", OPERATOR_TYPOGRAPHY.body)}>
              {CLI_USAGE_HELP_REFERENCE_LANDING.documentSource}
            </dd>
          </div>
        </dl>

        <div>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Major reference groups</h3>
          <ul className="m-0 mt-2 flex flex-wrap gap-2 p-0 list-none" data-testid="help-cli-usage-major-groups">
            {majorSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "inline-flex rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm no-underline transition-colors hover:border-teal-600/40 hover:bg-teal-50/40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-teal-600/40 dark:hover:bg-teal-950/20",
                    DESIGN_TOKENS.accent.link,
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className={HELP_PAGE_LAYOUT.technicalReferenceGrid}>
        <div
          id="cli-usage-reference-content"
          className={HELP_PAGE_LAYOUT.technicalReferenceColumn}
          data-testid="help-cli-usage-reference-content"
          tabIndex={-1}
        >
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preserveMaintenanceMetadata={preserveMaintenanceMetadata}
          />
        </div>
        <HelpTechnicalReferenceNavigation groups={headingGroups} enableScrollSpy />
      </div>
    </article>
  );
}
