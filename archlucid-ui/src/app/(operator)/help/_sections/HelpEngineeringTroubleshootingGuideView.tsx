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
import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
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

type HelpEngineeringTroubleshootingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin eng troubleshooting orientation for `/help/developer-troubleshooting` (HDX). */
export function HelpEngineeringTroubleshootingGuideView(
  props: HelpEngineeringTroubleshootingGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
    preserveMaintenanceMetadata: true,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-engineering-troubleshooting-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE}
        titleTestId="help-engineering-troubleshooting-page-title"
        subtitle={ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE}
        navHref={DEVELOPER_TROUBLESHOOTING_HELP_PATH}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-engineering-troubleshooting-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-engineering-troubleshooting-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Prefer customer paths first
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href}>
                {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openSystemHealth.href}>
                {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openSystemHealth.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.href}>
                {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.label}
              </Link>
            </Button>
            <Link
              href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-engineering-troubleshooting-overview"
          >
            {ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW}
          </p>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-engineering-troubleshooting-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              {ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}
            </p>
          </aside>

          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-engineering-troubleshooting-content"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preserveMaintenanceMetadata
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
