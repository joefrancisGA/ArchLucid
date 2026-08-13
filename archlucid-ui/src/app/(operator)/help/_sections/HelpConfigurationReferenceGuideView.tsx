import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE,
  CONFIGURATION_REFERENCE_HELP_OVERVIEW,
  CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
  CONFIGURATION_REFERENCE_HELP_PAGE_TITLE,
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
  CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS,
} from "@/lib/configuration-reference-help-guide-content";
import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
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

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-configuration-reference-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Open configuration surfaces
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
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
          </CardContent>
        </Card>
      </div>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[42rem] lg:max-w-none")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-configuration-reference-overview">
          {CONFIGURATION_REFERENCE_HELP_OVERVIEW}
        </p>

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

        <aside
          className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="help-configuration-reference-claim-discipline"
        >
          <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
            {CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE}
          </p>
        </aside>

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
      </div>
    </article>
  );
}
