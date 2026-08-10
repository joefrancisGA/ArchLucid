import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING_ID,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const DATA_RESIDENCY_TOC_HEADING: HelpMarkdownHeading = {
  level: 3,
  id: DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING_ID,
  title: DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING,
};

type HelpDataHandlingTenantIsolationGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe data handling + tenant isolation orientation for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationGuideView(
  props: HelpDataHandlingTenantIsolationGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings: HelpMarkdownHeading[] = [DATA_RESIDENCY_TOC_HEADING, ...markdownHeadings];

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-data-handling-tenant-isolation-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE}
        titleTestId="help-data-handling-tenant-isolation-page-title"
        subtitle={DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE}
        navHref={DATA_HANDLING_TENANT_ISOLATION_HELP_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-data-handling-tenant-isolation-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className={cn(DESIGN_TOKENS.surface.card, "w-fit max-w-full")}
          data-testid="help-data-handling-tenant-isolation-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <h2 className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE}
            </h2>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                {DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href}>
                {DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.label}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-data-handling-tenant-isolation-claim-discipline"
        >
          {DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE}
        </p>

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            href={DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            data-testid="help-data-handling-tenant-isolation-audit-trail-link"
          >
            {DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
          </Link>
          {" "}
          in your tenant governance workspace.
        </p>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn)}>
          <p
            className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}
            data-testid="help-data-handling-tenant-isolation-overview"
          >
            {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW}
          </p>

          <aside
            id={DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING_ID}
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-data-handling-tenant-isolation-residency"
          >
            <h3
              className={cn(
                "m-0 text-al-text-primary",
                OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING}
            </h3>
            <p className={cn("m-0 mt-2", HELP_PAGE_LAYOUT.readingBody)}>
              {DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY}
            </p>
          </aside>

          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-data-handling-tenant-isolation-content"
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

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
