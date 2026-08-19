import Link from "next/link";

import { Suspense } from "react";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAzureBoardsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzureBoardsConnectionContext";
import { HelpAzureBoardsSetupStepCtAs } from "@/app/(operator)/help/_sections/HelpAzureBoardsSetupStepCtAs";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AZURE_BOARDS_HELP_AUTHORITY_NOTE,
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_CLAIM_DISCIPLINE,
  AZURE_BOARDS_HELP_CONTINUE_HEADING,
  AZURE_BOARDS_HELP_PAGE_SUBTITLE,
  AZURE_BOARDS_HELP_PAGE_TITLE,
  AZURE_BOARDS_HELP_PAT_NON_RECOVERABLE_WARNING,
  AZURE_BOARDS_HELP_PAT_SCOPE_WARNING,
  AZURE_BOARDS_HELP_PRIMARY_ACTIONS,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_HEADING,
  AZURE_BOARDS_HELP_SOURCES_INTRO,
} from "@/lib/azure-boards-help-evidence-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
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
        headingLevel="h1"
        metadata={
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            data-testid="help-azure-boards-header-metadata"
          >
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-boards-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <Card data-testid="help-azure-boards-action-panel">
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {AZURE_BOARDS_HELP_CONTINUE_HEADING}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
          <aside
            className={cn(DESIGN_TOKENS.callout.warn, "space-y-2 p-3")}
            data-testid="help-azure-boards-pat-warnings"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_BOARDS_HELP_PAT_SCOPE_WARNING}</p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_BOARDS_HELP_PAT_NON_RECOVERABLE_WARNING}</p>
          </aside>

          <div className="space-y-2">
            <Button asChild size="sm" variant="primary" data-testid="help-azure-boards-primary-cta">
              <Link href={AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.href}>
                {AZURE_BOARDS_HELP_PRIMARY_ACTIONS.openSettings.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-azure-boards-authority-note"
            >
              {AZURE_BOARDS_HELP_AUTHORITY_NOTE}
            </p>
          </div>

          <HelpAzureBoardsSetupStepCtAs />

          <Suspense
            fallback={
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Loading connection status…
              </p>
            }
          >
            <HelpAzureBoardsConnectionContext />
          </Suspense>

          <div className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <h3
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid="help-azure-boards-sources-heading"
            >
              {AZURE_BOARDS_HELP_SOURCES_HEADING}
            </h3>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {AZURE_BOARDS_HELP_SOURCES_INTRO}
            </p>
            <ul className={cn("m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {AZURE_BOARDS_HELP_SOURCES.map((link) => (
                <li key={link.href}>
                  <Link
                    className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="help-azure-boards-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_BOARDS_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

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
