import Link from "next/link";

import { HelpCliUsageClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpCliUsageClaimOrientationStrip";
import { HelpCliUsageHeaderActions } from "@/app/(operator)/help/_sections/HelpCliUsageHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTechnicalReferenceNavigation } from "@/components/help/HelpTechnicalReferenceNavigation";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  CLI_USAGE_HELP_ACTION_PANEL_TITLE,
  CLI_USAGE_HELP_PAGE_SUBTITLE,
  CLI_USAGE_HELP_PAGE_TITLE,
  CLI_USAGE_HELP_PRIMARY_ACTIONS,
} from "@/lib/cli-usage-help-guide-content";
import { CLI_USAGE_HELP_CLAIM_DISCIPLINE } from "@/lib/cli-usage-help-evidence-copy";
import {
  CLI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID,
  CLI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CLI_USAGE_HELP_PRIMARY_CONTENT_ID,
  CLI_USAGE_HELP_SKIP_LINK_LABEL,
  CLI_USAGE_HELP_SKIP_TARGET_ID,
} from "@/lib/cli-usage-help-page-copy";
import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { CLI_USAGE_HELP_REFERENCE_LANDING } from "@/lib/help/help-cli-usage-reference-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { groupHelpMarkdownHeadings } from "@/lib/help/help-markdown-heading-groups";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpCliUsageTechnicalReferenceViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Navigable technical reference for `/help/cli-usage` (HCX). */
export function HelpCliUsageTechnicalReferenceView(
  props: HelpCliUsageTechnicalReferenceViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preserveMaintenanceMetadata = entry.audience === "developer";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    preserveMaintenanceMetadata,
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headingGroups = groupHelpMarkdownHeadings(headings);
  const majorSections = headings.filter((heading) => heading.level === 2);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-cli-usage-guide"
    >
      <a href={`#${CLI_USAGE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {CLI_USAGE_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={CLI_USAGE_HELP_PRIMARY_CONTENT_ID}
        data-testid={CLI_USAGE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={CLI_USAGE_HELP_PAGE_TITLE}
          titleTestId="help-cli-usage-page-title"
          subtitle={CLI_USAGE_HELP_PAGE_SUBTITLE}
          navHref={CLI_USAGE_HELP_PATH}
          headingLevel="h1"
          claimDiscipline={CLI_USAGE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CLI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          statusBadge={
            <StatusTag kind="neutral" label="Engineering runbook" data-testid="help-cli-usage-status-tag" />
          }
          actions={<HelpCliUsageHeaderActions entry={entry} />}
        />

        <div
          id={CLI_USAGE_HELP_SKIP_TARGET_ID}
          data-testid={CLI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            aria-labelledby="help-cli-usage-action-panel-heading"
            className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            data-testid="help-cli-usage-action-panel"
          >
            <div className="space-y-1">
              <h2
                id="help-cli-usage-action-panel-heading"
                className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {CLI_USAGE_HELP_ACTION_PANEL_TITLE}
              </h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Operators triaging symptoms should start with customer Troubleshooting before diving into CLI
                commands and environment variables on this page.
              </p>
            </div>
            <div>
              <Button asChild size="sm" variant="primary" data-testid="help-cli-usage-primary-cta">
                <Link href={CLI_USAGE_HELP_PRIMARY_ACTIONS.openTroubleshooting.href}>
                  {CLI_USAGE_HELP_PRIMARY_ACTIONS.openTroubleshooting.label}
                </Link>
              </Button>
            </div>
          </section>

          <section
            aria-labelledby="cli-usage-reference-landing-heading"
            className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
            data-testid="help-cli-usage-reference-landing"
          >
            <div className="space-y-1">
              <h2 id="cli-usage-reference-landing-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                Reference overview
              </h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.purpose}</p>
            </div>

            <dl className="m-0 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Audience</dt>
                <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.audience}</dd>
              </div>
              <div>
                <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Support status</dt>
                <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{CLI_USAGE_HELP_REFERENCE_LANDING.stability}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Authoritative source</dt>
                <dd className={cn("m-0 mt-1 font-mono text-sm", OPERATOR_TYPOGRAPHY.body)}>
                  {CLI_USAGE_HELP_REFERENCE_LANDING.documentSource}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Major reference groups</h3>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0" data-testid="help-cli-usage-major-groups">
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

        <div className={HELP_PAGE_LAYOUT.technicalReferenceGrid}>
          <div
            id="cli-usage-reference-content"
            className={HELP_PAGE_LAYOUT.technicalReferenceColumn}
            data-testid="help-cli-usage-reference-content"
            tabIndex={-1}
            aria-labelledby="help-cli-usage-reference-body-heading"
          >
            <h2 id="help-cli-usage-reference-body-heading" className="sr-only">
              CLI usage reference body
            </h2>
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preserveMaintenanceMetadata={preserveMaintenanceMetadata}
            />
          </div>
          <HelpTechnicalReferenceNavigation groups={headingGroups} enableScrollSpy />
        </div>

        <div data-testid="help-cli-usage-orientation-bottom">
          <HelpCliUsageClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
