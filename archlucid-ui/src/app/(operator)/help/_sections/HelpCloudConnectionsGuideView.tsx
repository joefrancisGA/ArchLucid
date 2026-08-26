import Link from "next/link";

import { HelpCloudConnectionsClaimDisciplineCallout } from "@/app/(operator)/help/_sections/HelpCloudConnectionsClaimDisciplineCallout";
import { HelpCloudConnectionsFollowUpLinks } from "@/app/(operator)/help/_sections/HelpCloudConnectionsFollowUpLinks";
import { HelpCloudConnectionsHeaderActions } from "@/app/(operator)/help/_sections/HelpCloudConnectionsHeaderActions";
import { HelpCloudConnectionsProviderScopeSection } from "@/app/(operator)/help/_sections/HelpCloudConnectionsProviderScopeSection";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { CloudConnectionsHelpClaimDisciplineStrip } from "@/components/help/CloudConnectionsHelpClaimDisciplineStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_ID,
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO,
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE,
  CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_ID,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PAGE_INTRO,
  CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_HELP_PAGE_TITLE,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_RELATED_TOPICS_HEADING,
} from "@/lib/cloud-connections-help-guide-content";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { extractMarkdownSectionsByAnchor } from "@/lib/help/help-markdown-sections";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

const CLOUD_CONNECTIONS_HELP_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: CLOUD_CONNECTIONS_HELP_ORIENTATION_ID, title: CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE, level: 2 },
  { id: "choose-your-cloud-platform", title: CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE, level: 2 },
  { id: CLOUD_CONNECTIONS_HELP_ACTION_PANEL_ID, title: CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE, level: 2 },
  { id: "related-topics", title: CLOUD_CONNECTIONS_HELP_RELATED_TOPICS_HEADING, level: 2 },
];

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
  // Related topics only — React owns intro/tiers/next-actions (avoids duplicate doc intro).
  const markdownBody = extractMarkdownSectionsByAnchor(markdown, ["related-topics"], false);
  const contentGridClass = resolveHelpPageContentGridClass(CLOUD_CONNECTIONS_HELP_TOC_HEADINGS.length);
  const showSectionNav = CLOUD_CONNECTIONS_HELP_TOC_HEADINGS.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-cloud-connections-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={CLOUD_CONNECTIONS_HELP_PAGE_TITLE}
        titleTestId="help-cloud-connections-page-title"
        subtitle={CLOUD_CONNECTIONS_HELP_PAGE_SUBTITLE}
        navHref={CLOUD_CONNECTIONS_HELP_PATH}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpCloudConnectionsHeaderActions entry={entry} />}
      />

      <CloudConnectionsHelpClaimDisciplineStrip />

      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-cloud-connections-intro"
      >
        {CLOUD_CONNECTIONS_HELP_PAGE_INTRO}
      </p>

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <HelpCloudConnectionsClaimDisciplineCallout />

          <HelpCloudConnectionsProviderScopeSection />

          <section
            id={CLOUD_CONNECTIONS_HELP_ACTION_PANEL_ID}
            className={cn(
              "space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "scroll-mt-24",
            )}
            aria-labelledby="help-cloud-connections-action-panel-heading"
            data-testid="help-cloud-connections-action-panel"
          >
            <h2
              id="help-cloud-connections-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {CLOUD_CONNECTIONS_HELP_ACTION_PANEL_TITLE}
            </h2>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO}
            </p>
            <HelpCloudConnectionsFollowUpLinks />
          </section>

          <div data-testid="help-cloud-connections-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdownBody}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={CLOUD_CONNECTIONS_HELP_TOC_HEADINGS} enableScrollSpy /> : null}
      </div>
    </article>
  );
}
