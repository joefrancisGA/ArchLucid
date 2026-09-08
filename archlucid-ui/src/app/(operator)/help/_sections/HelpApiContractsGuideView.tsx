import Link from "next/link";

import { HelpApiContractsClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpApiContractsClaimOrientationStrip";
import { HelpApiContractsHeaderActions } from "@/app/(operator)/help/_sections/HelpApiContractsHeaderActions";
import { HelpApiContractsHeaderMetadata } from "@/app/(operator)/help/_sections/HelpApiContractsHeaderMetadata";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { HelpTechnicalReferenceNavigation } from "@/components/help/HelpTechnicalReferenceNavigation";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  API_CONTRACTS_HELP_ACTION_PANEL_TITLE,
  API_CONTRACTS_HELP_PAGE_SUBTITLE,
  API_CONTRACTS_HELP_PAGE_TITLE,
  API_CONTRACTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/api-contracts-help-guide-content";
import { API_CONTRACTS_HELP_CLAIM_DISCIPLINE } from "@/lib/api-contracts-help-evidence-copy";
import {
  API_CONTRACTS_HELP_FIRST_VIEWPORT_TEST_ID,
  API_CONTRACTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  API_CONTRACTS_HELP_PRIMARY_CONTENT_ID,
  API_CONTRACTS_HELP_SKIP_LINK_LABEL,
  API_CONTRACTS_HELP_SKIP_TARGET_ID,
} from "@/lib/api-contracts-help-page-copy";
import {
  API_CONTRACTS_HELP_JOB_MATRIX,
  API_CONTRACTS_HELP_JOB_MATRIX_HEADING,
  API_CONTRACTS_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/api-contracts-help-ia-dual";
import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { API_CONTRACTS_HELP_REFERENCE_LANDING } from "@/lib/api-contracts-help-reference-content";
import {
  API_CONTRACTS_HELP_RELATED_HEADING,
  API_CONTRACTS_HELP_RELATED_TEST_ID,
  apiContractsHelpRelatedGuides,
} from "@/lib/api-contracts-help-related-guides";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpApiContractsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin API contracts technical reference for `/help/api-contracts` (HG). */
export function HelpApiContractsGuideView(props: HelpApiContractsGuideViewProps): React.ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headingGroups = groupHelpMarkdownHeadings(headings);
  const majorSections = headings.filter((heading) => heading.level === 2);
  const governanceApprovalHref = inAppHelpHref("governance-approval");
  const relatedGuides = apiContractsHelpRelatedGuides();

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-api-contracts-guide"
    >
      <a href={`#${API_CONTRACTS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {API_CONTRACTS_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={API_CONTRACTS_HELP_PRIMARY_CONTENT_ID}
        data-testid={API_CONTRACTS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={API_CONTRACTS_HELP_PAGE_TITLE}
          titleTestId="help-api-contracts-page-title"
          subtitle={API_CONTRACTS_HELP_PAGE_SUBTITLE}
          navHref={API_CONTRACTS_HELP_PATH}
          headingLevel="h1"
          claimDiscipline={API_CONTRACTS_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={API_CONTRACTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
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
          actions={<HelpApiContractsHeaderActions entry={entry} />}
        />

        <div
          id={API_CONTRACTS_HELP_SKIP_TARGET_ID}
          data-testid={API_CONTRACTS_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            aria-labelledby="help-api-contracts-job-matrix-heading"
            className="space-y-4"
            data-testid={API_CONTRACTS_HELP_JOB_MATRIX_TEST_ID}
          >
            <h2
              id="help-api-contracts-job-matrix-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {API_CONTRACTS_HELP_JOB_MATRIX_HEADING}
            </h2>
            <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {API_CONTRACTS_HELP_JOB_MATRIX.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  {row.isCurrent === true ? (
                    <span
                      className="shrink-0 font-medium text-al-text-primary"
                      data-testid="help-api-contracts-job-matrix-current"
                    >
                      {row.label}
                    </span>
                  ) : (
                    <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href ?? "#"}>
                      {row.label}
                    </Link>
                  )}
                  <span className="text-al-text-secondary">{row.when}</span>
                </li>
              ))}
            </ul>
          </section>

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
                  Approval
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
                      className={cn(HELP_PAGE_LAYOUT.referenceTagPill, DESIGN_TOKENS.accent.link)}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {buyerPolishedShell ? null : (
          <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="api-contracts" />
        )}

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

        <section
          aria-labelledby="help-api-contracts-related-heading"
          className="space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          data-testid={API_CONTRACTS_HELP_RELATED_TEST_ID}
        >
          <h2
            id="help-api-contracts-related-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {API_CONTRACTS_HELP_RELATED_HEADING}
          </h2>
          <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {relatedGuides.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className={cn(
                    "underline-offset-2 hover:underline",
                    DESIGN_TOKENS.accent.link,
                    OPERATOR_LINK.inline,
                  )}
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div data-testid="help-api-contracts-orientation-bottom">
          <HelpApiContractsClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
