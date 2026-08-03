import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE,
  CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_HELP_PAGE_TITLE,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
  CLOUD_CONNECTIONS_HELP_SOURCES,
  CLOUD_CONNECTIONS_HELP_SOURCES_INTRO,
} from "@/lib/cloud-connections-help-guide-content";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpCloudConnectionsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe cloud connections orientation for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsGuideView(
  props: HelpCloudConnectionsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-cloud-connections-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CLOUD_CONNECTIONS_HELP_PAGE_TITLE}
        titleTestId="help-cloud-connections-page-title"
        subtitle={CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE}
        navHref={CLOUD_CONNECTIONS_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-cloud-connections-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <Card
        className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
        data-testid="help-cloud-connections-action-panel"
      >
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Continue setup</CardTitle>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
          <Button asChild size="sm" variant="primary">
            <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href}>
              {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.connectAzure.href}>
              {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.connectAzure.label}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="help-cloud-connections-sources-heading"
        data-testid="help-cloud-connections-sources"
      >
        <h2
          id="help-cloud-connections-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_CONNECTIONS_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_CONNECTIONS_HELP_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="help-cloud-connections-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Orientation only</h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-cloud-connections-content">
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
