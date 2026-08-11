import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpDataHandlingTenantIsolationClaimDiscipline } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationClaimDiscipline";
import { HelpDataHandlingTenantIsolationHeaderActions } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationHeaderActions";
import { HelpDataHandlingTenantIsolationLeavesStaysChrome } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationLeavesStaysChrome";
import { HelpDataHandlingTenantIsolationOverview } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationOverview";
import { HelpDataHandlingTenantIsolationRelatedTopics } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationRelatedTopics";
import { HelpDataHandlingTenantIsolationSourceLinks } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationSourceLinks";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL,
  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { omitMarkdownSectionsByAnchor } from "@/lib/help-markdown-sections";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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
  const markdownBody = omitMarkdownSectionsByAnchor(preparedMarkdown, [
    DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
  ]);
  const markdownHeadings = extractHelpMarkdownHeadings(markdownBody);
  const hasReactRelatedHeading = markdownHeadings.some(
    (heading) => heading.id === DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
  );
  const headings = hasReactRelatedHeading
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
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-data-handling-tenant-isolation-breadcrumb"
            items={[
              { label: DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL, href: "/help" },
              {
                label: DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL,
                href: inAppHelpHref("security-trust"),
              },
              { label: DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE },
            ]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <HelpDataHandlingTenantIsolationHeaderActions entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <HelpDataHandlingTenantIsolationOverview />
        <HelpDataHandlingTenantIsolationClaimDiscipline />
        <div className="space-y-4" data-testid="help-data-handling-tenant-isolation-first-viewport">
          <HelpDataHandlingTenantIsolationLeavesStaysChrome />
          <HelpDataHandlingTenantIsolationRelatedTopics />
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

          <CollapsibleSection
            title={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE}
            summaryLine={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO}
            sectionTestId="help-data-handling-tenant-isolation-source-disclosure"
          >
            <HelpDataHandlingTenantIsolationSourceLinks />
          </CollapsibleSection>
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
