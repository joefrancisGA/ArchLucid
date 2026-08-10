import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_CLAIM_DISCIPLINE,
  AZURE_BOARDS_HELP_PAGE_SUBTITLE,
  AZURE_BOARDS_HELP_PAGE_TITLE,
  AZURE_BOARDS_HELP_PRIMARY_ACTIONS,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_INTRO,
} from "@/lib/azure-boards-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help-topic-applicability-metadata";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAzureBoardsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe Azure Boards orientation for `/help/azure-boards` (HEZ). */
export function HelpAzureBoardsGuideView(props: HelpAzureBoardsGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const applicabilityLabel = formatHelpTopicApplicabilityMetadata(entry);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-azure-boards-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={AZURE_BOARDS_HELP_PAGE_TITLE}
        titleTestId="help-azure-boards-page-title"
        subtitle={AZURE_BOARDS_HELP_PAGE_SUBTITLE}
        navHref={AZURE_BOARDS_HELP_CANONICAL_PATH}
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-azure-boards-breadcrumb"
            items={[
              { label: "Help", href: "/help" },
              { label: AZURE_BOARDS_HELP_PAGE_TITLE },
            ]}
          />
        }
        metadata={
          applicabilityLabel !== null ? (
            <span
              className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-azure-boards-applicability"
            >
              {applicabilityLabel}
            </span>
          ) : null
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-boards-header-actions">
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="help-azure-boards-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Orientation only</h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{AZURE_BOARDS_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <Card
        className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
        data-testid="help-azure-boards-action-panel"
      >
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Continue in product</CardTitle>
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {AZURE_BOARDS_HELP_SOURCES_INTRO}
          </p>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href={AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.href}>
                {AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.label}
              </Link>
            </Button>
          </div>
          <ul className={cn("m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {AZURE_BOARDS_HELP_SOURCES.map((link) => (
              <li key={link.href}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-azure-boards-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </div>
        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
