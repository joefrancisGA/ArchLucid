import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ConnectGcpSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectGcpSecurelyHelpEvidenceOrientationStrip";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  CONNECT_GCP_SECURELY_CONFIGURE_ACTION,
  CONNECT_GCP_SECURELY_CONFIGURE_HREF,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_PAGE_TITLE, CLOUD_CONNECTIONS_HELP_PATH } from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpConnectGcpSecurelyGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe GCP connector setup for `/help/cloud-connections/gcp` (HGC). */
export function HelpConnectGcpSecurelyGuideView(
  props: HelpConnectGcpSecurelyGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "mx-auto w-full max-w-[68rem]")}
      data-testid="help-connect-gcp-securely-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={entry.title}
        titleTestId="help-connect-gcp-securely-page-title"
        subtitle={entry.summary}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-connect-gcp-securely-breadcrumb"
            items={[
              { label: "Help", href: "/help" },
              { label: CLOUD_CONNECTIONS_HELP_PAGE_TITLE, href: CLOUD_CONNECTIONS_HELP_PATH },
              { label: entry.title },
            ]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-connect-gcp-securely-header-actions">
            <PageContextualHelpButton />
            <Button asChild size="sm" variant="primary" data-testid="connect-gcp-configure-action">
              <Link href={CONNECT_GCP_SECURELY_CONFIGURE_HREF}>{CONNECT_GCP_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <ConnectGcpSecurelyHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-connect-gcp-securely-primary">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />

          <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <Button asChild variant="outline" size="sm" data-testid="connect-gcp-configure-action-footer">
              <Link href={CONNECT_GCP_SECURELY_CONFIGURE_HREF}>{CONNECT_GCP_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
          </div>
        </div>
        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
