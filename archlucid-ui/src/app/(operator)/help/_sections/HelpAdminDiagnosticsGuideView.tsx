import Link from "next/link";

import { HelpAdminDiagnosticsHeaderActions } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsHeaderActions";
import { HelpAdminDiagnosticsSignalTable } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSignalTable";
import { HelpAdminDiagnosticsSourceLinks } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSourceLinks";
import { HelpAdminDiagnosticsSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSourcesOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION,
  splitAdminDiagnosticsHelpMarkdown,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import {
  ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE_BUYER,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID,
  ADMIN_DIAGNOSTICS_HELP_SKIP_LINK_LABEL,
  ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
} from "@/lib/admin-diagnostics-help-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAdminDiagnosticsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function adminDiagnosticsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE_BUYER : ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE;
}

function AdminDiagnosticsStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-admin-diagnostics-action-panel"
      aria-labelledby="help-admin-diagnostics-action-panel-heading"
    >
      <h2
        id="help-admin-diagnostics-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary" data-testid={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.testId}>
          <Link href={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href}>{ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label}</Link>
        </Button>
        {ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.adminOnly === true ? (
          <StatusTag kind="neutral" label="Admin" data-testid="help-admin-diagnostics-primary-admin-tag" />
        ) : null}
      </div>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-admin-diagnostics-start-here-helper"
      >
        {ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

/** Platform health orientation for `/help/admin-diagnostics` (HAE). */
export function HelpAdminDiagnosticsGuideView(
  props: HelpAdminDiagnosticsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const { procedureMarkdown } = splitAdminDiagnosticsHelpMarkdown(preparedMarkdown);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? headings.length : 0);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-admin-diagnostics-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {ADMIN_DIAGNOSTICS_HELP_SKIP_LINK_LABEL}
        </a>
      ) : (
        <a href="#help-admin-diagnostics-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          Skip to diagnostics guidance
        </a>
      )}
      <HelpTopicHashScroll />

      <div
        id={buyerPolishedShell ? ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24 space-y-6", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE}
          titleTestId="help-admin-diagnostics-page-title"
          subtitle={
            buyerPolishedShell ? (
              adminDiagnosticsHelpPageSubtitle(true)
            ) : (
              <>
                <p className="m-0">{adminDiagnosticsHelpPageSubtitle(false)}</p>
                <p
                  className="m-0 mt-2 text-al-text-secondary"
                  data-testid="help-admin-diagnostics-page-scope"
                >
                  {ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE}
                </p>
              </>
            )
          }
          subtitleClassName="max-w-3xl"
          navHref={ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={buyerPolishedShell ? ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={
            buyerPolishedShell ? ADMIN_DIAGNOSTICS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
          }
          actions={<HelpAdminDiagnosticsHeaderActions entry={entry} />}
        />

        {!buyerPolishedShell ? (
          <aside
            className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
            data-testid="help-admin-diagnostics-page-orientation"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE}
            </h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION}</p>
          </aside>
        ) : null}

        {!buyerPolishedShell ? (
          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-admin-diagnostics-action-panel"
          >
            <HelpAdminDiagnosticsSourceLinks />
          </section>
        ) : null}

        {buyerPolishedShell ? (
          <div
            id={ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID}
            data-testid={ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <AdminDiagnosticsStartHerePanel />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
            <div
              id={!buyerPolishedShell ? "help-admin-diagnostics-content" : undefined}
              className={HELP_PAGE_LAYOUT.contentColumn}
              data-testid="help-admin-diagnostics-content"
            >
              {!buyerPolishedShell ? (
                <MarketingAccessibilityMarkdownFragment
                  markdownBody={procedureMarkdown}
                  tableCaption={`${entry.title} reference table`}
                  presentation="help"
                  sourceDocPath={sourceDocPath}
                  helpTopicSlug={entry.slug}
                />
              ) : null}

              <HelpAdminDiagnosticsSignalTable />
            </div>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-admin-diagnostics-orientation-bottom">
            <HelpAdminDiagnosticsSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
