"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ExecutiveSummaryHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ExecutiveSummaryHelpEvidenceOrientationStrip";
import { HelpExecutiveSummaryPageHeader } from "@/app/(operator)/help/_sections/HelpExecutiveSummaryPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EXECUTIVE_SUMMARY_HELP_OVERVIEW,
  EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS,
  EXECUTIVE_SUMMARY_HELP_SCOPE_DETAILS_TRIGGER,
  executiveSummaryHelpPageSubtitle,
} from "@/lib/executive-summary-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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

type HelpExecutiveSummaryGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe executive summary orientation for `/help/executive-summary`. */
export function HelpExecutiveSummaryGuideView(
  props: HelpExecutiveSummaryGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      setContentKey((previous) => previous + 1);
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-executive-summary-guide"
    >
      <HelpTopicHashScroll />

      <HelpExecutiveSummaryPageHeader
        entry={entry}
        subtitle={executiveSummaryHelpPageSubtitle(buyerPolishedShell)}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={() => {
          void onRefresh();
        }}
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-executive-summary-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Open sponsor outputs
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveValueReport.href}>
                {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveValueReport.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveDashboard.href}>
                {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.openExecutiveDashboard.label}
              </Link>
            </Button>
            <Link
              href={EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {EXECUTIVE_SUMMARY_HELP_PRIMARY_ACTIONS.pilotRoiModel.label}
            </Link>
          </CardContent>
        </Card>

        <ExecutiveSummaryHelpEvidenceOrientationStrip />
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          {buyerPolishedShell ? (
            <CollapsibleSection
              title={EXECUTIVE_SUMMARY_HELP_SCOPE_DETAILS_TRIGGER}
              defaultOpen={false}
              sectionTestId="help-executive-summary-scope-details"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-executive-summary-overview">
                {EXECUTIVE_SUMMARY_HELP_OVERVIEW}
              </p>
            </CollapsibleSection>
          ) : (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-executive-summary-overview">
              {EXECUTIVE_SUMMARY_HELP_OVERVIEW}
            </p>
          )}

          <div
            key={contentKey}
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-executive-summary-content"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
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
