import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorDashboardHelpEvidenceOrientationStrip } from "@/components/help/SponsorDashboardHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SPONSOR_DASHBOARD_HELP_BREADCRUMB_TOPIC_TITLE,
  SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY,
  SPONSOR_DASHBOARD_HELP_FEATURE_ITEMS,
  SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS,
  SPONSOR_DASHBOARD_HELP_HOW_TO_READ_STEPS,
  SPONSOR_DASHBOARD_HELP_OVERVIEW,
  SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE,
  SPONSOR_DASHBOARD_HELP_PAGE_TITLE,
  SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION,
  SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION,
  SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION_TAG,
  SPONSOR_DASHBOARD_HELP_START_HERE_CARD_TITLE,
} from "@/lib/sponsor-dashboard-help-guide-content";
import { SPONSOR_DASHBOARD_HELP_CANONICAL_PATH } from "@/lib/sponsor-dashboard-help-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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
  const contentGridClass = resolveHelpPageContentGridClass(SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-sponsor-dashboard-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SPONSOR_DASHBOARD_HELP_PAGE_TITLE}
        titleTestId="help-sponsor-dashboard-page-title"
        subtitle={SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE}
        navHref={SPONSOR_DASHBOARD_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-sponsor-dashboard-overview">
            {SPONSOR_DASHBOARD_HELP_OVERVIEW}
          </p>

          <Card
            className="border-neutral-200 dark:border-neutral-800"
            data-testid="help-sponsor-dashboard-action-panel"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {SPONSOR_DASHBOARD_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.href}>
                    {SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION_TAG}
                  data-testid="help-sponsor-dashboard-scope-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-sponsor-dashboard-scope-precondition"
              >
                {SPONSOR_DASHBOARD_HELP_SCOPE_PRECONDITION}
              </p>
            </CardContent>
          </Card>

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
                      <Link className={OPERATOR_LINK.nav} href={item.href}>
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
            aria-labelledby="before-you-start"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="before-you-start">Before you start</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-sponsor-dashboard-before-you-start">
              {SPONSOR_DASHBOARD_HELP_BEFORE_YOU_START_BODY}
            </p>
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

          <SponsorDashboardHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
