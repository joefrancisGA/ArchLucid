import Link from "next/link";

import { HelpApiContractsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpApiContractsHeaderMetadata";
import { HelpApiContractsSourceLinks } from "@/app/(operator)/help/_sections/HelpApiContractsSourceLinks";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTechnicalReferenceNavigation } from "@/components/help/HelpTechnicalReferenceNavigation";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  API_CONTRACTS_HELP_ACTION_PANEL_TITLE,
  API_CONTRACTS_HELP_PAGE_SUBTITLE,
  API_CONTRACTS_HELP_PAGE_TITLE,
  API_CONTRACTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/api-contracts-help-guide-content";
import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { API_CONTRACTS_HELP_REFERENCE_LANDING } from "@/lib/api-contracts-help-reference-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpApiContractsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin API contracts technical reference for `/help/api-contracts` (HG). */
export function HelpApiContractsGuideView(props: HelpApiContractsGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headingGroups = groupHelpMarkdownHeadings(headings);
  const majorSections = headings.filter((heading) => heading.level === 2);
  const governanceApprovalHref = inAppHelpHref("governance-approval");

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, HELP_PAGE_LAYOUT.technicalReferenceArticle)}
      data-testid="help-api-contracts-guide"
    >
      <a href="#help-api-contracts-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to API contracts reference
      </a>
      <HelpTopicHashScroll />

      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <OperatorPageHeader
          title={API_CONTRACTS_HELP_PAGE_TITLE}
          titleTestId="help-api-contracts-page-title"
          subtitle={API_CONTRACTS_HELP_PAGE_SUBTITLE}
          navHref={API_CONTRACTS_HELP_PATH}
          headingLevel="h1"
          statusBadge={
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag kind="neutral" label="Admin internal" data-testid="help-api-contracts-status-tag" />
              <StatusTag
                kind="neutral"
                label={API_CONTRACTS_HELP_REFERENCE_LANDING.apiVersion.split(" — ")[0] ?? "v1.0"}
                data-testid="help-api-contracts-version-tag"
              />
            </div>
          }
          metadata={<HelpApiContractsHeaderMetadata entry={entry} />}
          actions={
            <div className="flex flex-wrap items-center gap-2" data-testid="help-api-contracts-header-actions">
              <PageContextualHelpButton />
              <HelpTopicPrintButton entry={entry} />
            </div>
          }
        />
      </header>

      <section
        aria-labelledby="help-api-contracts-action-panel-heading"
        className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
        data-testid="help-api-contracts-action-panel"
      >
        <div className="space-y-1">
          <h2
            id="help-api-contracts-action-panel-heading"
            className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {API_CONTRACTS_HELP_ACTION_PANEL_TITLE}
          </h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Architects looking for approval workflows should open{" "}
            <Link
              href={governanceApprovalHref}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              Governance approval
            </Link>{" "}
            instead of this HTTP contract reference.
          </p>
        </div>
        <div>
          <Button asChild size="sm" variant="primary" data-testid="help-api-contracts-primary-cta">
            <Link href={API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.href}>
              {API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.label}
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="help-api-contracts-reference-landing-heading"
        className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
        data-testid="help-api-contracts-reference-landing"
      >
        <div className="space-y-1">
          <h2
            id="help-api-contracts-reference-landing-heading"
            className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Reference overview
          </h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{API_CONTRACTS_HELP_REFERENCE_LANDING.purpose}</p>
        </div>

        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>API version</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.apiVersion}
            </dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Support status</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.supportStatus}
            </dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Auth scheme</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.authScheme}
            </dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Error format</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.errorFormat}
            </dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Pagination</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.paginationConvention}
            </dd>
          </div>
          <div>
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Deprecation window</dt>
            <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.deprecationWindow}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Authoritative source</dt>
            <dd className={cn("m-0 mt-1 font-mono text-sm", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_REFERENCE_LANDING.authoritativeSource}
            </dd>
          </div>
        </dl>

        <div>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Major reference sections</h3>
          <ul
            className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0"
            data-testid="help-api-contracts-major-sections"
          >
            {majorSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "inline-flex rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm no-underline transition-colors hover:border-teal-600/40 hover:bg-teal-50/40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-teal-600/40 dark:hover:bg-teal-950/20",
                    DESIGN_TOKENS.accent.link,
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HelpApiContractsSourceLinks />

      <div className={HELP_PAGE_LAYOUT.technicalReferenceGrid}>
        <div
          id="help-api-contracts-content"
          className={HELP_PAGE_LAYOUT.technicalReferenceColumn}
          data-testid="help-api-contracts-content"
          tabIndex={-1}
          aria-labelledby="help-api-contracts-reference-body-heading"
        >
          <h2 id="help-api-contracts-reference-body-heading" className="sr-only">
            API contracts reference body
          </h2>
          <MarketingAccessibilityMarkdownFragment
            markdownBody={preparedMarkdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
          />
        </div>
        <HelpTechnicalReferenceNavigation
          groups={headingGroups}
          enableScrollSpy
          navigationTopicLabel="API contracts reference"
        />
      </div>
    </article>
  );
}
