import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  DPA_TEMPLATE_HELP_DOWNLOAD_ACTION,
  DPA_TEMPLATE_HELP_FULL_DISCLOSURE_CAVEAT,
  DPA_TEMPLATE_HELP_KEY_TERMS,
  DPA_TEMPLATE_HELP_KEY_TERMS_HEADING,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES_HEADING,
  DPA_TEMPLATE_HELP_ORIENTATION,
  DPA_TEMPLATE_HELP_OVERVIEW,
  DPA_TEMPLATE_HELP_PAGE_SUBTITLE,
  DPA_TEMPLATE_HELP_PAGE_TITLE,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  formatDpaTemplateHelpProvenanceLine,
} from "@/lib/dpa-template-help-guide-content";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
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
  const pdfHref = resolvePublicHelpTopicPdfHref(entry.slug);

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
        headingLevel="h1"
        statusBadge={
          <StatusTag
            kind="draft"
            label="Template — not executed"
            data-testid="help-dpa-template-status-tag"
          />
        }
        metadata={
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
            data-testid="help-dpa-template-provenance"
          >
            {formatDpaTemplateHelpProvenanceLine()}
          </p>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-dpa-template-header-actions">
            <PageContextualHelpButton />
            <Button
              type="button"
              variant="primary"
              size="sm"
              asChild
              data-testid="help-dpa-template-download-pdf"
            >
              <a href={pdfHref} download>
                {DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label}
              </a>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className={DESIGN_TOKENS.surface.card}
          data-testid="help-dpa-template-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Continue procurement diligence
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="outline">
              <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href}>
                {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href}>
                {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.label}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[52rem]")}>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-dpa-template-overview">
          {DPA_TEMPLATE_HELP_OVERVIEW}
        </p>

        <section
          aria-labelledby="help-dpa-template-key-terms-heading"
          className={cn(DESIGN_TOKENS.surface.card, "p-4")}
          data-testid="help-dpa-template-key-terms"
        >
          <h2
            id="help-dpa-template-key-terms-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {DPA_TEMPLATE_HELP_KEY_TERMS_HEADING}
          </h2>
          <dl className={cn("m-0 mt-3 space-y-3", HELP_PAGE_LAYOUT.readingBody)}>
            {DPA_TEMPLATE_HELP_KEY_TERMS.map((term) => (
              <div key={term.label}>
                <dt className="font-medium text-al-text-primary">{term.label}</dt>
                <dd className="m-0 mt-1 text-al-text-secondary">{term.value}</dd>
              </div>
            ))}
          </dl>
          <h3
            className={cn("m-0 mt-4 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
            id="help-dpa-template-open-variables-heading"
          >
            {DPA_TEMPLATE_HELP_OPEN_VARIABLES_HEADING}
          </h3>
          <ul className={cn("m-0 mt-2 list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
            {DPA_TEMPLATE_HELP_OPEN_VARIABLES.map((variable) => (
              <li key={variable}>{variable}</li>
            ))}
          </ul>
        </section>

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
          <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
            {DPA_TEMPLATE_HELP_ORIENTATION.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="help-dpa-template-claim-discipline-heading"
          className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
          data-testid="help-dpa-template-claim-discipline"
        >
          <h2
            id="help-dpa-template-claim-discipline-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Negotiation template only
          </h2>
          <p className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.readingBody)}>{DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE}</p>
        </section>

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
            {DPA_TEMPLATE_HELP_FULL_DISCLOSURE_CAVEAT}
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
