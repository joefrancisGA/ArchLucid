import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpDataHandlingTenantIsolationClaimDiscipline } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationClaimDiscipline";
import { HelpDataHandlingTenantIsolationHeaderActions } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationHeaderActions";
import { HelpDataHandlingTenantIsolationJobMatrix } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationJobMatrix";
import { HelpDataHandlingTenantIsolationLeavesStaysChrome } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationLeavesStaysChrome";
import { HelpDataHandlingTenantIsolationOverview } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationOverview";
import { HelpDataHandlingTenantIsolationRelatedTopics } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationRelatedTopics";
import { HelpDataHandlingTenantIsolationSourceLinks } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationSourceLinks";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DataHandlingTenantIsolationHelpEvidenceOrientationStrip } from "@/components/help/DataHandlingTenantIsolationHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_TOPIC_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_EYEBROW,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SKIP_LINK_LABEL,
  dataHandlingTenantIsolationHelpPageSubtitle,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { omitMarkdownSectionsByAnchor } from "@/lib/help/help-markdown-sections";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpDataHandlingTenantIsolationGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe data handling + tenant isolation orientation for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationGuideView(
  props: HelpDataHandlingTenantIsolationGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownBody = omitMarkdownSectionsByAnchor(preparedMarkdown, [
    DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
  ]);
  const markdownHeadings = extractHelpMarkdownHeadings(markdownBody);
  const hasReactRelatedHeading = markdownHeadings.some(
    (heading) => heading.id === DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
  );
  const headings = hasReactRelatedHeading
    ? markdownHeadings
    : buyerPolishedShell
      ? markdownHeadings
      : [
          ...markdownHeadings,
          {
            id: DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
            title: DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING,
            level: 2 as const,
          },
        ];

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-data-handling-tenant-isolation-guide"
    >
      <a
        href={`#${DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {DATA_HANDLING_TENANT_ISOLATION_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_EYEBROW}
        title={DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE}
        titleTestId="help-data-handling-tenant-isolation-page-title"
        subtitle={dataHandlingTenantIsolationHelpPageSubtitle(buyerPolishedShell)}
        navHref={DATA_HANDLING_TENANT_ISOLATION_HELP_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-data-handling-tenant-isolation-header-actions">
            {buyerPolishedShell ? null : <PageContextualHelpButton />}
            <HelpDataHandlingTenantIsolationHeaderActions entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div
          id={DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-4")}
        >
          {buyerPolishedShell ? (
            <div data-testid="help-data-handling-tenant-isolation-orientation-top">
              <DataHandlingTenantIsolationHelpEvidenceOrientationStrip
                readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
              />
            </div>
          ) : null}

          <HelpDataHandlingTenantIsolationOverview />
          <HelpDataHandlingTenantIsolationJobMatrix />

          {!buyerPolishedShell ? <HelpDataHandlingTenantIsolationClaimDiscipline /> : null}

          <div className="space-y-4" data-testid="help-data-handling-tenant-isolation-first-viewport">
            <HelpDataHandlingTenantIsolationLeavesStaysChrome />
            {buyerPolishedShell ? null : <HelpDataHandlingTenantIsolationRelatedTopics />}
          </div>
        </div>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-4", HELP_PAGE_LAYOUT.contentColumn)}>
          <div
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-data-handling-tenant-isolation-content"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdownBody}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          {!buyerPolishedShell ? (
            <CollapsibleSection
              title={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE}
              summaryLine={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO}
              sectionTestId="help-data-handling-tenant-isolation-source-disclosure"
            >
              <HelpDataHandlingTenantIsolationSourceLinks />
            </CollapsibleSection>
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
