import Link from "next/link";

import { HelpApiContractsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpApiContractsHeaderMetadata";
import { HelpApiContractsSourceLinks } from "@/app/(operator)/help/_sections/HelpApiContractsSourceLinks";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  GOVERNANCE_API_CONTRACTS_HELP_ACTION_PANEL_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION,
  GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_OVERVIEW,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/governance-api-contracts-help-guide-content";
import { GOVERNANCE_API_CONTRACTS_HELP_PATH } from "@/lib/governance-api-contracts-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help-page-layout";
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
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-api-contracts-guide"
    >
      <a href="#help-api-contracts-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to API contracts reference
      </a>
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE}
        titleTestId="help-api-contracts-page-title"
        subtitle={GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE}
        navHref={GOVERNANCE_API_CONTRACTS_HELP_PATH}
        headingLevel="h1"
        statusBadge={
          <StatusTag kind="neutral" label="Admin internal" data-testid="help-api-contracts-status-tag" />
        }
        metadata={<HelpApiContractsHeaderMetadata entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-api-contracts-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div
          className={cn(DESIGN_TOKENS.callout.info, "p-3")}
          data-testid="help-api-contracts-action-panel"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {GOVERNANCE_API_CONTRACTS_HELP_ACTION_PANEL_TITLE}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary" data-testid="help-api-contracts-primary-cta">
              <Link href={GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.href}>
                {GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
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
          </div>
        </div>
      </div>

      <div className={contentGridClass}>
        <div className="min-w-0 space-y-6">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-api-contracts-overview">
            {GOVERNANCE_API_CONTRACTS_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="help-api-contracts-orientation-heading"
            className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
            data-testid="help-api-contracts-orientation"
          >
            <h2
              id="help-api-contracts-orientation-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              {GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION_TITLE}
            </h2>
            <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <HelpApiContractsSourceLinks />

          <aside
            className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
            data-testid="help-api-contracts-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE}
            </p>
          </aside>

          <div
            id="help-api-contracts-content"
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-api-contracts-content"
          >
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
