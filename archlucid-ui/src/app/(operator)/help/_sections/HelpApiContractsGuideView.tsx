import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION,
  GOVERNANCE_API_CONTRACTS_HELP_OVERVIEW,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/governance-api-contracts-help-guide-content";
import { GOVERNANCE_API_CONTRACTS_HELP_PATH } from "@/lib/governance-api-contracts-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpApiContractsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin API contracts technical reference for `/help/governance-api-contracts` (HG / TB-1386). */
export function HelpApiContractsGuideView(props: HelpApiContractsGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-api-contracts-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE}
        titleTestId="help-api-contracts-page-title"
        subtitle={GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE}
        navHref={GOVERNANCE_API_CONTRACTS_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-api-contracts-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-api-contracts-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Integrator and Admin paths
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary" data-testid="help-api-contracts-primary-cta">
              <Link href={GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openCliUsage.href}>
                {GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openCliUsage.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openConfigurationReference.href}>
                {GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openConfigurationReference.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openBuyerGovernanceApproval.href}>
                {GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openBuyerGovernanceApproval.label}
              </Link>
            </Button>
            <Link
              href={GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openEngineeringTroubleshooting.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openEngineeringTroubleshooting.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-api-contracts-overview">
            {GOVERNANCE_API_CONTRACTS_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="help-api-contracts-orientation-heading"
            data-testid="help-api-contracts-orientation"
          >
            <h2
              id="help-api-contracts-orientation-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How to use this reference
            </h2>
            <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <aside
            className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
            data-testid="help-api-contracts-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE}
            </p>
          </aside>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-api-contracts-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={preparedMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
