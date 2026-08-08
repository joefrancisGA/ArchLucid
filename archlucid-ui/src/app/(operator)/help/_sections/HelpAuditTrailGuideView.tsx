"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { HelpAuditTrailPageHeader } from "@/app/(operator)/help/_sections/HelpAuditTrailPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AUDIT_TRAIL_HELP_OVERVIEW,
  AUDIT_TRAIL_HELP_PRIMARY_ACTIONS,
  auditTrailHelpPageSubtitle,
} from "@/lib/audit-trail-help-guide-content";
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
type HelpAuditTrailGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe audit trail orientation for `/help/audit-trail`. */
export function HelpAuditTrailGuideView(props: HelpAuditTrailGuideViewProps): React.JSX.Element {
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
      data-testid="help-audit-trail-guide"
    >
      <HelpTopicHashScroll />

      <HelpAuditTrailPageHeader
        entry={entry}
        subtitle={auditTrailHelpPageSubtitle(buyerPolishedShell)}
        refreshing={refreshing}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={() => {
          void onRefresh();
        }}
      />
<div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-audit-trail-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Review audit activity</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.href}>
                {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.governanceApproval.href}>
                {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.governanceApproval.label}
              </Link>
            </Button>
            <Link
              href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.securityTrust.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.securityTrust.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-audit-trail-overview">
            {AUDIT_TRAIL_HELP_OVERVIEW}
          </p>

          <div
            key={contentKey}
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-audit-trail-content"
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
