import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ConfigurationReferenceHelpClaimDisciplineStrip } from "@/components/help/ConfigurationReferenceHelpClaimDisciplineStrip";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CONFIGURATION_REFERENCE_HELP_OVERVIEW,
  CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
  CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
  CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS,
} from "@/lib/configuration-reference-help-guide-content";
import {
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/configuration-reference-help-ia-dual";
import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import {
  CONFIGURATION_REFERENCE_HELP_RELATED_HEADING,
  CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID,
  configurationReferenceHelpRelatedGuides,
} from "@/lib/configuration-reference-help-related-guides";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpConfigurationReferenceGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin configuration task orientation for `/help/configuration-reference` (TB-1326 / TB-1328). */
export function HelpConfigurationReferenceGuideView(
  props: HelpConfigurationReferenceGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const relatedGuides = configurationReferenceHelpRelatedGuides();

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-configuration-reference-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CONFIGURATION_REFERENCE_HELP_PAGE_TITLE}
        titleTestId="help-configuration-reference-page-title"
        subtitle={CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE}
        navHref={CONFIGURATION_REFERENCE_HELP_PATH}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-configuration-reference-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <ConfigurationReferenceHelpClaimDisciplineStrip />

      <section
        aria-labelledby="help-configuration-reference-job-matrix-heading"
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid={CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_TEST_ID}
      >
        <h2
          id="help-configuration-reference-job-matrix-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING}
        </h2>
        <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.map((row) => (
            <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              {row.isCurrent === true ? (
                <span
                  className="shrink-0 font-medium text-al-text-primary"
                  data-testid="help-configuration-reference-job-matrix-current"
                >
                  {row.label}
                </span>
              ) : (
                <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href ?? "#"}>
                  {row.label}
                </Link>
              )}
              <span className="text-al-text-secondary">{row.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[42rem] lg:max-w-none")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-configuration-reference-overview">
          {CONFIGURATION_REFERENCE_HELP_OVERVIEW}
        </p>

        <section
          className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="help-configuration-reference-action-panel"
          aria-labelledby="help-configuration-reference-action-panel-heading"
        >
          <h2
            id="help-configuration-reference-action-panel-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Open configuration surfaces
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.href}>
                {CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.href}>
                {CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.label}
              </Link>
            </Button>
            <Link
              href={CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.label}
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="help-configuration-reference-tasks-heading"
          data-testid="help-configuration-reference-task-sections"
        >
          <h2
            id="help-configuration-reference-tasks-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Common Admin tasks
          </h2>
          <ol className={cn("m-0 mt-3 list-decimal space-y-3 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS.map((section) => (
              <li key={section.title}>
                <span className="font-medium text-al-text-primary">{section.title}</span>
                <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{section.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <HelpLazyDetails
          className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
          data-testid="help-configuration-reference-catalog-appendix"
          summaryClassName={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          summary="Full key catalog (Admin technical appendix)"
          preface={
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Collapsed by default so the first viewport stays a task guide. Expand only when you need a specific key
              name after using the settings CTAs above.
            </p>
          }
          bodyClassName={cn(HELP_PAGE_LAYOUT.contentColumn, "mt-4")}
          bodyTestId="help-configuration-reference-content"
        >
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </HelpLazyDetails>

        <section
          aria-labelledby="help-configuration-reference-related-heading"
          className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          data-testid={CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID}
        >
          <h2
            id="help-configuration-reference-related-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {CONFIGURATION_REFERENCE_HELP_RELATED_HEADING}
          </h2>
          <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {relatedGuides.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className={cn(
                    "underline-offset-2 hover:underline",
                    DESIGN_TOKENS.accent.link,
                    OPERATOR_LINK.inline,
                  )}
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
