import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE,
  FIRST_VALUE_20_HELP_JOB_MATRIX,
  FIRST_VALUE_20_HELP_ORIENTATION,
  FIRST_VALUE_20_HELP_OVERVIEW,
  FIRST_VALUE_20_HELP_PAGE_SUBTITLE,
  FIRST_VALUE_20_HELP_PAGE_TITLE,
  FIRST_VALUE_20_HELP_PRIMARY_ACTIONS,
  FIRST_VALUE_20_HELP_RELATED_PAGES_TITLE,
  FIRST_VALUE_20_HELP_SOURCES,
  FIRST_VALUE_20_HELP_SOURCES_INTRO,
} from "@/lib/first-value-20-help-guide-content";
import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_LINK,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpFirstValue20GuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin/SE time-boxed first-value orientation for `/help/first-value-20-minutes` (HEF / TB-1691–TB-1695). */
export function HelpFirstValue20GuideView(props: HelpFirstValue20GuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-first-value-20-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={FIRST_VALUE_20_HELP_PAGE_TITLE}
        titleTestId="help-first-value-20-page-title"
        subtitle={FIRST_VALUE_20_HELP_PAGE_SUBTITLE}
        navHref={FIRST_VALUE_20_HELP_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-first-value-20-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: FIRST_VALUE_20_HELP_PAGE_TITLE }]}
          />
        }
        statusBadge={
          <StatusTag kind="neutral" label="Admin only" data-testid="help-first-value-20-admin-tag" />
        }
        metadata={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="help-first-value-20-header-metadata">
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-first-value-20-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div
          className={cn(DESIGN_TOKENS.callout.info, "p-3")}
          data-testid="help-first-value-20-action-panel"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Prefer customer paths first
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary" data-testid="help-first-value-20-primary-cta">
              <Link href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.href}>
                {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openCustomerFirstReviewGuide.href}>
                {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openCustomerFirstReviewGuide.label}
              </Link>
            </Button>
            <Link
              href={FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openTroubleshooting.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openTroubleshooting.label}
            </Link>
          </div>
        </div>
      </div>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[42rem] lg:max-w-none")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-first-value-20-overview">
          {FIRST_VALUE_20_HELP_OVERVIEW}
        </p>

        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="help-first-value-20-sources-heading"
          data-testid="help-first-value-20-sources"
        >
          <h2
            id="help-first-value-20-sources-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {FIRST_VALUE_20_HELP_RELATED_PAGES_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {FIRST_VALUE_20_HELP_SOURCES_INTRO}
          </p>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_VALUE_20_HELP_SOURCES.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="help-first-value-20-orientation-heading"
          data-testid="help-first-value-20-orientation"
        >
          <h2
            id="help-first-value-20-orientation-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            20-minute orientation
          </h2>
          <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_VALUE_20_HELP_ORIENTATION.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="help-first-value-20-job-matrix-heading"
          data-testid="help-first-value-20-job-matrix"
        >
          <h2
            id="help-first-value-20-job-matrix-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Which first-value guide?
          </h2>
          <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {FIRST_VALUE_20_HELP_JOB_MATRIX.map((row) => (
              <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                {row.isCurrent === true ? (
                  <span
                    className="font-medium shrink-0 text-al-text-primary"
                    aria-current="page"
                    data-testid="help-first-value-20-job-matrix-current"
                  >
                    {row.label}
                  </span>
                ) : (
                  <Link className={cn(OPERATOR_LINK.inline, "font-medium shrink-0")} href={row.href}>
                    {row.label}
                  </Link>
                )}
                <span className="text-al-text-secondary">{row.when}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside
          className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
          data-testid="help-first-value-20-claim-discipline"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h3>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE}</p>
        </aside>

        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-first-value-20-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={preparedMarkdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </div>
      </div>
    </article>
  );
}
