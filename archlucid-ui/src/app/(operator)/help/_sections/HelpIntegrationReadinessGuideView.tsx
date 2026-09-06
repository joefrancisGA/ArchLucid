"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationReadinessHelpClaimDisciplineStrip } from "@/components/help/IntegrationReadinessHelpClaimDisciplineStrip";
import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  INTEGRATION_READINESS_HELP_CONFIGURE_SECTION_ANCHORS,
  INTEGRATION_READINESS_HELP_DEFERRED_STATUS_LABELS_ANCHOR,
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_SECTION_ANCHORS,
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID,
  INTEGRATION_READINESS_HELP_OVERVIEW,
  INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE,
} from "@/lib/integration-readiness-help-guide-content";
import {
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_RELATED_GUIDES,
  INTEGRATION_READINESS_HELP_RELATED_HEADING,
  INTEGRATION_READINESS_HELP_RELATED_TEST_ID,
} from "@/lib/integration-readiness-help-related-guides";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  extractMarkdownSectionsByAnchor,
} from "@/lib/help/help-markdown-sections";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  helpIntegrationReadinessStatusGlossaryDisclosureHrefFromSearch,
  parseHelpIntegrationReadinessStatusGlossaryOpenFromSearch,
} from "@/lib/help/help-integration-readiness-disclosure-url";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

type HelpIntegrationReadinessGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Operator integration readiness orientation for `/help/integration-readiness`. */
export function HelpIntegrationReadinessGuideView(
  props: HelpIntegrationReadinessGuideViewProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpIntegrationReadinessStatusGlossaryOpenParam = searchParams.get("helpIntegrationReadinessStatusGlossaryOpen");
  const [statusGlossaryOpen, setStatusGlossaryOpenState] = useState(() =>
    parseHelpIntegrationReadinessStatusGlossaryOpenFromSearch(helpIntegrationReadinessStatusGlossaryOpenParam),
  );

  const syncStatusGlossaryOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpIntegrationReadinessStatusGlossaryDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setStatusGlossaryOpen = useCallback(
    (open: boolean) => {
      setStatusGlossaryOpenState(open);
      syncStatusGlossaryOpenToUrl(open);
    },
    [syncStatusGlossaryOpenToUrl],
  );

  useEffect(() => {
    setStatusGlossaryOpenState(
      parseHelpIntegrationReadinessStatusGlossaryOpenFromSearch(helpIntegrationReadinessStatusGlossaryOpenParam),
    );
  }, [helpIntegrationReadinessStatusGlossaryOpenParam]);

  const sourceDocPath = entry.sourcePaths[0] ?? "";

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
      <HelpTopicHashScroll />

      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <HelpTopicTitleRow title={entry.title} titleTestId="help-integration-readiness-page-title" />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{entry.summary}</p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        </div>
      </header>

      <IntegrationReadinessHelpClaimDisciplineStrip />

      <div className="space-y-4" data-testid={INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID}>
        <IntegrationReadinessHelpEvidenceOrientationStrip />

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

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-integration-readiness-overview">
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
        <CollapsibleSection
          title={INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE}
          sectionTestId="help-integration-readiness-status-glossary"
          open={statusGlossaryOpen}
          onToggle={setStatusGlossaryOpen}
        >
          <MarketingAccessibilityMarkdownFragment
            markdownBody={statusGlossaryMarkdown}
            tableCaption={`${entry.title} status labels`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </CollapsibleSection>
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
    </article>
  );
}
