import Link from "next/link";

import { HelpScopeHeaderActions } from "@/app/(operator)/help/_sections/HelpScopeHeaderActions";
import { HelpScopeSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpScopeSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { ScopeHelpClaimDisciplineStrip } from "@/components/help/ScopeHelpClaimDisciplineStrip";
import { ScopeHelpCurrentScopePanel } from "@/components/help/ScopeHelpCurrentScopePanel";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SCOPE_HELP_CANONICAL_PATH,
  SCOPE_HELP_CLAIM_DISCIPLINE,
  SCOPE_HELP_PAGE_SUBTITLE,
  SCOPE_HELP_PAGE_TITLE,
  SCOPE_HELP_PRIMARY_ACTION,
} from "@/lib/scope-help-evidence-copy";
import {
  SCOPE_HELP_ACTION_PANEL_TITLE,
  SCOPE_HELP_FIRST_VIEWPORT_TEST_ID,
  SCOPE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SCOPE_HELP_PRIMARY_CONTENT_ID,
  SCOPE_HELP_SKIP_LINK_LABEL,
  SCOPE_HELP_SKIP_TARGET_ID,
} from "@/lib/scope-help-page-copy";
import { cn } from "@/lib/utils";

type HelpScopeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function ScopeActionPanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-scope-action-panel"
      aria-labelledby="help-scope-action-panel-heading"
    >
      <h2
        id="help-scope-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SCOPE_HELP_ACTION_PANEL_TITLE}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary" data-testid={SCOPE_HELP_PRIMARY_ACTION.testId}>
          <Link href={SCOPE_HELP_PRIMARY_ACTION.href}>{SCOPE_HELP_PRIMARY_ACTION.label}</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={inAppHelpHref("users-and-roles")}>Users and roles</Link>
        </Button>
      </div>
    </section>
  );
}

/** Workspace and scope orientation for `/help/scope` (HSX). */
export function HelpScopeGuideView(props: HelpScopeGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-scope-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${SCOPE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {SCOPE_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={SCOPE_HELP_PRIMARY_CONTENT_ID}
        data-testid={SCOPE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={SCOPE_HELP_PAGE_TITLE}
            titleTestId="help-scope-page-title"
            subtitle={SCOPE_HELP_PAGE_SUBTITLE}
            navHref={SCOPE_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={SCOPE_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={SCOPE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpScopeHeaderActions entry={entry} />}
          />
        ) : (
          <HelpTopicMarkdownPageHeader
            entry={entry}
            subtitle={SCOPE_HELP_PAGE_SUBTITLE}
            showContextualHelp
            primaryAction={SCOPE_HELP_PRIMARY_ACTION}
          />
        )}

        {!buyerPolishedShell ? <ScopeHelpClaimDisciplineStrip /> : null}

        {buyerPolishedShell ? (
          <div
            id={SCOPE_HELP_SKIP_TARGET_ID}
            data-testid={SCOPE_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <ScopeHelpCurrentScopePanel />
            <ScopeActionPanel />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-topic-content">
            {!buyerPolishedShell ? <ScopeHelpCurrentScopePanel /> : null}

            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>

          <HelpTopicTableOfContents headings={headings} enableScrollSpy />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-scope-orientation-bottom">
            <HelpScopeSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
