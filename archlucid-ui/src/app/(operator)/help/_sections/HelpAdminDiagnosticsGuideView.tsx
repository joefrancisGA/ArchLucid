import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAdminDiagnosticsHeaderActions } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsHeaderActions";
import { HelpAdminDiagnosticsSignalTable } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSignalTable";
import { HelpAdminDiagnosticsSourceLinks } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsSourceLinks";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE,
  ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
  splitAdminDiagnosticsHelpMarkdown,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAdminDiagnosticsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Platform health orientation for `/help/admin-diagnostics` (HAE). */
export function HelpAdminDiagnosticsGuideView(
  props: HelpAdminDiagnosticsGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const { procedureMarkdown } = splitAdminDiagnosticsHelpMarkdown(preparedMarkdown);
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-admin-diagnostics-guide"
    >
      <a href="#help-admin-diagnostics-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to diagnostics guidance
      </a>
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE}
        titleTestId="help-admin-diagnostics-page-title"
        subtitle={
          <>
            <p className="m-0">{ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE}</p>
            <p
              className="m-0 mt-2 text-al-text-secondary"
              data-testid="help-admin-diagnostics-page-scope"
            >
              {ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE}
            </p>
          </>
        }
        subtitleClassName="max-w-3xl"
        navHref={ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpAdminDiagnosticsHeaderActions entry={entry} />}
      />

      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="help-admin-diagnostics-page-orientation"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION_TITLE}
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION}</p>
      </aside>

      <Card
        className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
        data-testid="help-admin-diagnostics-action-panel"
      >
        <CardContent className={cn(OPERATOR_CARD.content, "pt-6")}>
          <HelpAdminDiagnosticsSourceLinks />
        </CardContent>
      </Card>

      <div className={contentGridClass}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <div
            id="help-admin-diagnostics-content"
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-admin-diagnostics-content"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={procedureMarkdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />

            <HelpAdminDiagnosticsSignalTable />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
