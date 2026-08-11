import Link from "next/link";

import { HelpEngineeringTroubleshootingHeaderMetadata } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingHeaderMetadata";
import { HelpEngineeringTroubleshootingMarkdownSections } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingMarkdownSections";
import { HelpEngineeringTroubleshootingRunbookOverview } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingRunbookOverview";
import { HelpEngineeringTroubleshootingSourceLinks } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingSourceLinks";
import { HelpEngineeringTroubleshootingSymptomIndex } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingSymptomIndex";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorSeverityCallout } from "@/components/help/OperatorSeverityCallout";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_BODY,
  ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_BODY,
  ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE,
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEngineeringTroubleshootingGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin eng troubleshooting orientation for `/help/engineering-troubleshooting` (HDX). */
export function HelpEngineeringTroubleshootingGuideView(
  props: HelpEngineeringTroubleshootingGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
    preserveMaintenanceMetadata: true,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const majorSections = headings.filter((heading) => heading.level === 2);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-engineering-troubleshooting-guide"
    >
      <a href="#help-engineering-troubleshooting-content" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to engineering runbook
      </a>
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ENGINEERING_TROUBLESHOOTING_HELP_PAGE_TITLE}
        titleTestId="help-engineering-troubleshooting-page-title"
        subtitle={ENGINEERING_TROUBLESHOOTING_HELP_PAGE_SUBTITLE}
        navHref={ENGINEERING_TROUBLESHOOTING_HELP_PATH}
        headingLevel="h1"
        statusBadge={
          <StatusTag
            kind="neutral"
            label="Admin internal"
            data-testid="help-engineering-troubleshooting-status-tag"
          />
        }
        metadata={<HelpEngineeringTroubleshootingHeaderMetadata entry={entry} />}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-engineering-troubleshooting-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <HelpEngineeringTroubleshootingSymptomIndex />

      <OperatorSeverityCallout
        kind="warn"
        data-testid="help-engineering-troubleshooting-audience-strip"
        heading={ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_TITLE}
        headingId="help-engineering-troubleshooting-audience-strip-heading"
        className="p-3"
      >
        <p className="m-0">{ENGINEERING_TROUBLESHOOTING_HELP_AUDIENCE_STRIP_BODY}</p>
      </OperatorSeverityCallout>

      <div
        className={cn(DESIGN_TOKENS.callout.info, "space-y-2 p-3")}
        data-testid="help-engineering-troubleshooting-action-panel"
      >
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {ENGINEERING_TROUBLESHOOTING_HELP_ACTION_PANEL_TITLE}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="primary" data-testid="help-engineering-troubleshooting-primary-cta">
            <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.jumpToSymptomLookup.href}>
              {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.jumpToSymptomLookup.label}
            </Link>
          </Button>
        </div>
        <div
          className="flex flex-wrap gap-x-3 gap-y-1"
          data-testid="help-engineering-troubleshooting-secondary-ctas"
        >
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href}
          >
            {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.label}
          </Link>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openSystemHealth.href}
          >
            {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openSystemHealth.label}
          </Link>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.href}
          >
            {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.label}
          </Link>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.href}
          >
            {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.label}
          </Link>
        </div>
      </div>

      {showSectionNav ? (
        <HelpTopicTableOfContents headings={headings} placement="header-inline" />
      ) : null}

      <div className={contentGridClass}>
        <div className="min-w-0 space-y-6">
          <div
            id="help-engineering-troubleshooting-content"
            className={HELP_PAGE_LAYOUT.contentColumn}
            data-testid="help-engineering-troubleshooting-content"
            tabIndex={-1}
          >
            <HelpEngineeringTroubleshootingMarkdownSections
              markdown={preparedMarkdown}
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              tableCaption={`${entry.title} reference table`}
            />
          </div>

          <HelpEngineeringTroubleshootingRunbookOverview majorSections={majorSections} entry={entry} />

          <HelpEngineeringTroubleshootingSourceLinks />

          <section
            aria-labelledby="help-engineering-troubleshooting-escalation-heading"
            className={cn(DESIGN_TOKENS.callout.info, "space-y-3 p-4")}
            data-testid="help-engineering-troubleshooting-escalation"
          >
            <h2
              id="help-engineering-troubleshooting-escalation-heading"
              className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_TITLE}
            </h2>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {ENGINEERING_TROUBLESHOOTING_HELP_ESCALATION_PANEL_BODY}
            </p>
            <Button asChild size="sm" variant="outline" data-testid="help-engineering-troubleshooting-escalation-cta">
              <Link href={ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.href}>
                {ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openReportAProblem.label}
              </Link>
            </Button>
          </section>
        </div>

        {showSectionNav ? (
          <HelpTopicTableOfContents headings={headings} enableScrollSpy placement="sidebar" />
        ) : null}
      </div>
    </article>
  );
}
