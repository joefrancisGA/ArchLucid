import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAdminDiagnosticsHeaderActions } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsHeaderActions";
import { HelpAdminDiagnosticsSignalTable } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSignalTable";
import { HelpAdminDiagnosticsSourceLinks } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSourceLinks";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ADMIN_DIAGNOSTICS_HELP_ACTION_PANEL_TITLE,
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS,
  ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO,
  splitAdminDiagnosticsHelpMarkdown,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAdminDiagnosticsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin diagnostics orientation for `/help/admin-diagnostics` (HAE). */
export function HelpAdminDiagnosticsGuideView(
  props: HelpAdminDiagnosticsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const { procedureMarkdown, relatedMarkdown } = splitAdminDiagnosticsHelpMarkdown(preparedMarkdown);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-admin-diagnostics-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE}
        titleTestId="help-admin-diagnostics-page-title"
        subtitle={ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE}
        navHref={ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpAdminDiagnosticsHeaderActions entry={entry} />}
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
          data-testid="help-admin-diagnostics-action-panel"
          aria-labelledby="help-admin-diagnostics-action-panel-heading"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <h2
              id="help-admin-diagnostics-action-panel-heading"
              className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {ADMIN_DIAGNOSTICS_HELP_ACTION_PANEL_TITLE}
            </h2>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO}
            </p>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary" data-testid="help-admin-diagnostics-primary-cta">
                <Link href={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openSystemHealth.href}>
                  {ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openSystemHealth.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openWorkspaceOverview.href}>
                  {ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openWorkspaceOverview.label}
                </Link>
              </Button>
            </div>
            <HelpAdminDiagnosticsSourceLinks />
          </CardContent>
        </Card>
      </div>

      <div className={contentGridClass}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-admin-diagnostics-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={procedureMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />

            <HelpAdminDiagnosticsSignalTable />

            <aside
              className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-admin-diagnostics-page-orientation"
            >
              <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                {ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE}
              </h2>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION}</p>
            </aside>

            {relatedMarkdown.length > 0 ? (
              <MarketingAccessibilityMarkdownFragment
                markdownBody={relatedMarkdown}
                tableCaption={`${entry.title} related topics`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
              />
            ) : null}
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
