"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpSponsorDashboardWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpSponsorDashboardWorkspaceReadinessStrip";
import { SponsorDashboardHelpClaimDisciplineStrip } from "@/components/help/SponsorDashboardHelpClaimDisciplineStrip";
import { SponsorDashboardHelpEvidenceOrientationStrip } from "@/components/help/SponsorDashboardHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY,
  SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE,
  SPONSOR_DASHBOARD_HELP_FEATURE_ITEMS,
  SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS,
  SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS,
  SPONSOR_DASHBOARD_HELP_OVERVIEW,
  SPONSOR_DASHBOARD_HELP_PAGE_TITLE,
  SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION,
  SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID,
  SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION,
  SPONSOR_DASHBOARD_HELP_SKIP_LINK_LABEL,
  sponsorDashboardHelpPageSubtitle,
} from "@/lib/sponsor-dashboard-help-guide-content";
import { SPONSOR_DASHBOARD_HELP_CANONICAL_PATH } from "@/lib/sponsor-dashboard-help-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpSponsorDashboardGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

/** Operator sponsor dashboard orientation for `/help/sponsor-dashboard`. */
export function HelpSponsorDashboardGuideView(props: HelpSponsorDashboardGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-sponsor-dashboard-guide"
    >
      <a
        href={`#${SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SPONSOR_DASHBOARD_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SPONSOR_DASHBOARD_HELP_PAGE_TITLE}
        titleTestId="help-sponsor-dashboard-page-title"
        subtitle={sponsorDashboardHelpPageSubtitle(buyerPolishedShell)}
        navHref={SPONSOR_DASHBOARD_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-col items-start gap-2" data-testid="help-sponsor-dashboard-header-actions">
            <Button asChild size="sm" variant="primary">
              <Link href={SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.href}>
                {SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-sponsor-dashboard-scope-precondition"
            >
              {SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION}
            </p>
          </div>
        }
      />

      <SponsorDashboardHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div
          id={SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          {buyerPolishedShell ? (
            <div data-testid="help-sponsor-dashboard-orientation-top">
              <SponsorDashboardHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}

          <p className={readingBodyClass} data-testid="help-sponsor-dashboard-overview">
            {SPONSOR_DASHBOARD_HELP_OVERVIEW}
          </p>

          <HelpSponsorDashboardWorkspaceReadinessStrip />

          <section
            aria-labelledby="before-you-start"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="before-you-start">Before you start</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-sponsor-dashboard-before-you-start">
              {SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY}
            </p>
          </section>

          <section
            aria-labelledby="what-sponsor-dashboard-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-sponsor-dashboard-shows">What the sponsor dashboard shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-sponsor-dashboard-feature-items"
            >
              {SPONSOR_DASHBOARD_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">
                    {item.href === undefined ? (
                      item.label
                    ) : (
                      <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-sponsor-dashboard-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-sponsor-dashboard-works">{SPONSOR_DASHBOARD_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-sponsor-dashboard-how-stepper"
            >
              {SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          {!buyerPolishedShell ? (
            <SponsorDashboardHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
