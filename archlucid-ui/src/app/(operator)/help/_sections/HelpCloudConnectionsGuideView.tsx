import Link from "next/link";

import { HelpCloudConnectionsClaimDisciplineCallout } from "@/app/(operator)/help/_sections/HelpCloudConnectionsClaimDisciplineCallout";
import { HelpCloudConnectionsFollowUpLinks } from "@/app/(operator)/help/_sections/HelpCloudConnectionsFollowUpLinks";
import { HelpCloudConnectionsHeaderActions } from "@/app/(operator)/help/_sections/HelpCloudConnectionsHeaderActions";
import { HelpCloudConnectionsProviderScopeSection } from "@/app/(operator)/help/_sections/HelpCloudConnectionsProviderScopeSection";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO,
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE,
  CLOUD_CONNECTIONS_HELP_PAGE_INTRO,
  CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_HELP_PAGE_TITLE,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { extractMarkdownSectionsByAnchor } from "@/lib/help-markdown-sections";
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
  // Registry PDF load keeps choose-your-cloud-platform; in-app React owns that section.
  const markdownBody = extractMarkdownSectionsByAnchor(markdown, ["related-topics"], true);
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdownBody, sourceDocPath, {
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
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-cloud-connections-breadcrumb"
            items={[
              { label: "Help", href: "/help" },
              { label: CLOUD_CONNECTIONS_HELP_PAGE_TITLE },
            ]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpCloudConnectionsHeaderActions entry={entry} />}
      />

      <HelpCloudConnectionsClaimDisciplineCallout />

      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-cloud-connections-intro"
      >
        {CLOUD_CONNECTIONS_HELP_PAGE_INTRO}
      </p>

      <HelpCloudConnectionsProviderScopeSection />

      <Card
        className={DESIGN_TOKENS.surface.card}
        data-testid="help-cloud-connections-action-panel"
      >
        <CardHeader className={OPERATOR_CARD.header}>
          <h2 className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE}
          </h2>
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO}
          </p>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href}>
                {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label}
              </Link>
            </Button>
          </div>
          <HelpCloudConnectionsFollowUpLinks />
        </CardContent>
      </Card>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")} data-testid="help-cloud-connections-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdownBody}
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
