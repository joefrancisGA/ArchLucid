import Link from "next/link";

import { HelpIntegrationReadinessClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpIntegrationReadinessClaimOrientationStrip";
import { HelpIntegrationReadinessHeaderActions } from "@/app/(operator)/help/_sections/HelpIntegrationReadinessHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpStaticSection } from "@/components/help/HelpStaticSection";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  INTEGRATION_READINESS_HELP_CANONICAL_PATH,
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_CONFIGURE_SECTION_ANCHORS,
  INTEGRATION_READINESS_HELP_DEFERRED_STATUS_LABELS_ANCHOR,
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_SECTION_ANCHORS,
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID,
  INTEGRATION_READINESS_HELP_OVERVIEW,
  INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE,
} from "@/lib/integration-readiness-help-guide-content";
import {
  INTEGRATION_READINESS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  INTEGRATION_READINESS_HELP_PRIMARY_CONTENT_ID,
  INTEGRATION_READINESS_HELP_SKIP_LINK_LABEL,
  INTEGRATION_READINESS_HELP_SKIP_TARGET_ID,
} from "@/lib/integration-readiness-help-page-copy";
import {
  INTEGRATION_READINESS_HELP_RELATED_GUIDES,
  INTEGRATION_READINESS_HELP_RELATED_HEADING,
  INTEGRATION_READINESS_HELP_RELATED_TEST_ID,
} from "@/lib/integration-readiness-help-related-guides";
import {
  extractMarkdownSectionsByAnchor,
} from "@/lib/help/help-markdown-sections";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpIntegrationReadinessGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Operator integration readiness orientation for `/help/integration-readiness`. */
export function HelpIntegrationReadinessGuideView(
  props: HelpIntegrationReadinessGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const firstViewportMarkdown = extractMarkdownSectionsByAnchor(
    markdown,
    [...INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_SECTION_ANCHORS],
    false,
  );
  const statusGlossaryMarkdown = extractMarkdownSectionsByAnchor(
    markdown,
    [INTEGRATION_READINESS_HELP_DEFERRED_STATUS_LABELS_ANCHOR],
    false,
  );
  const configureMarkdown = extractMarkdownSectionsByAnchor(
    markdown,
    [...INTEGRATION_READINESS_HELP_CONFIGURE_SECTION_ANCHORS],
    false,
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-integration-readiness-guide"
    >
      <a href={`#${INTEGRATION_READINESS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {INTEGRATION_READINESS_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={INTEGRATION_READINESS_HELP_PRIMARY_CONTENT_ID}
        data-testid={INTEGRATION_READINESS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={entry.title}
          titleTestId="help-integration-readiness-page-title"
          subtitle={entry.summary}
          navHref={INTEGRATION_READINESS_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={INTEGRATION_READINESS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpIntegrationReadinessHeaderActions entry={entry} />}
        />

        <div
          id={INTEGRATION_READINESS_HELP_SKIP_TARGET_ID}
          data-testid={INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-integration-readiness-action-panel"
            aria-labelledby="help-integration-readiness-action-panel-heading"
          >
            <h2
              id="help-integration-readiness-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Open live readiness
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link
                href={INTEGRATION_READINESS_HELP_PRIMARY_ACTION.href}
                data-testid={INTEGRATION_READINESS_HELP_PRIMARY_ACTION.testId}
              >
                {INTEGRATION_READINESS_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
          </section>

          <p className={readingBodyClass} data-testid="help-integration-readiness-overview">
            {INTEGRATION_READINESS_HELP_OVERVIEW}
          </p>

          {firstViewportMarkdown.trim().length > 0 ? (
            <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-integration-readiness-primary-body">
              <MarketingAccessibilityMarkdownFragment
                markdownBody={firstViewportMarkdown}
                tableCaption={`${entry.title} orientation`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
              />
            </div>
          ) : null}
        </div>

        <section
          className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid={INTEGRATION_READINESS_HELP_RELATED_TEST_ID}
          aria-labelledby="help-integration-readiness-related-heading"
        >
          <h2
            id="help-integration-readiness-related-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {INTEGRATION_READINESS_HELP_RELATED_HEADING}
          </h2>
          <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            {INTEGRATION_READINESS_HELP_RELATED_GUIDES.map((guide) => (
              <li key={guide.href}>
                <Link className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)} href={guide.href}>
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {statusGlossaryMarkdown.trim().length > 0 ? (
          <HelpStaticSection
            title={INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE}
            testId="help-integration-readiness-status-glossary"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={statusGlossaryMarkdown}
              tableCaption={`${entry.title} status labels`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </HelpStaticSection>
        ) : null}

        {configureMarkdown.trim().length > 0 ? (
          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-integration-readiness-configure-body">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={configureMarkdown}
              tableCaption={`${entry.title} configure table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        ) : null}

        <div data-testid="help-integration-readiness-orientation-bottom">
          <HelpIntegrationReadinessClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
