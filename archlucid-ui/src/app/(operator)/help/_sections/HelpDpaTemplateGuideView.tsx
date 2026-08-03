import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  DPA_TEMPLATE_HELP_ORIENTATION,
  DPA_TEMPLATE_HELP_OVERVIEW,
  DPA_TEMPLATE_HELP_PAGE_SUBTITLE,
  DPA_TEMPLATE_HELP_PAGE_TITLE,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_SOURCES,
} from "@/lib/dpa-template-help-guide-content";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpDpaTemplateGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer DPA negotiation template orientation for `/help/dpa-template` (TB-1676 / TB-1678 / TB-1680). */
export function HelpDpaTemplateGuideView(props: HelpDpaTemplateGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-dpa-template-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={DPA_TEMPLATE_HELP_PAGE_TITLE}
        titleTestId="help-dpa-template-page-title"
        subtitle={DPA_TEMPLATE_HELP_PAGE_SUBTITLE}
        navHref={DPA_TEMPLATE_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-dpa-template-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-dpa-template-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Continue procurement diligence
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary" data-testid="help-dpa-template-primary-cta">
              <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href}>
                {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.label}
              </Link>
            </Button>
            <Link
              href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.label}
            </Link>
          </CardContent>
        </Card>

        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="help-dpa-template-sources-heading"
          data-testid="help-dpa-template-sources"
        >
          <h2
            id="help-dpa-template-sources-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Sources for diligence
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Open Trust Center and related contracts before treating this template as executed agreement language.
          </p>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {DPA_TEMPLATE_HELP_SOURCES.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[42rem] lg:max-w-none")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-dpa-template-overview">
          {DPA_TEMPLATE_HELP_OVERVIEW}
        </p>

        <section
          aria-labelledby="help-dpa-template-orientation-heading"
          data-testid="help-dpa-template-orientation"
        >
          <h2
            id="help-dpa-template-orientation-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            How to use this template
          </h2>
          <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {DPA_TEMPLATE_HELP_ORIENTATION.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <aside
          className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
          data-testid="help-dpa-template-claim-discipline"
        >
          <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Negotiation template only
          </h2>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE}</p>
        </aside>

        <details
          className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
          data-testid="help-dpa-template-full-disclosure"
        >
          <summary
            className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Show full DPA template (clauses and placeholders)
          </summary>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Collapsed by default so the first viewport stays orientation and diligence CTAs. Placeholders such as
            controller name and effective date are sample fill-ins for counsel — not your executed parties.
          </p>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "mt-4")} data-testid="help-dpa-template-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </details>
      </div>
    </article>
  );
}
