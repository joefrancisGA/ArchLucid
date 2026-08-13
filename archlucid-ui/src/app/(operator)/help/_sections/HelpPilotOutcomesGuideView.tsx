import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { PilotOutcomesHelpEvidenceOrientationStrip } from "@/components/help/PilotOutcomesHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PILOT_OUTCOMES_HELP_GUIDE_HEADINGS,
  PILOT_OUTCOMES_HELP_HOW_TO_READ_STEPS,
  PILOT_OUTCOMES_HELP_OVERVIEW,
  PILOT_OUTCOMES_HELP_PAGE_SUBTITLE,
  PILOT_OUTCOMES_HELP_PAGE_TITLE,
  PILOT_OUTCOMES_HELP_PRIMARY_ACTION,
  PILOT_OUTCOMES_HELP_REPORT_ITEMS,
  PILOT_OUTCOMES_HELP_SIBLING_REPORTS,
} from "@/lib/pilot-outcomes-help-guide-content";
import {
  PILOT_OUTCOMES_CANONICAL_PATH,
  PILOT_OUTCOMES_HELP_CANONICAL_PATH,
} from "@/lib/pilot-outcomes-evidence-copy";
import { cn } from "@/lib/utils";

type HelpPilotOutcomesGuideViewProps = {
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

/** Operator pilot outcomes orientation for `/help/pilot-outcomes`. */
export function HelpPilotOutcomesGuideView(props: HelpPilotOutcomesGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(PILOT_OUTCOMES_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-pilot-outcomes-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PILOT_OUTCOMES_HELP_PAGE_TITLE}
        titleTestId="help-pilot-outcomes-page-title"
        subtitle={PILOT_OUTCOMES_HELP_PAGE_SUBTITLE}
        navHref={PILOT_OUTCOMES_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-pilot-outcomes-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: PILOT_OUTCOMES_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-pilot-outcomes-overview">
            {PILOT_OUTCOMES_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-pilot-outcomes-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open pilot outcomes</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={PILOT_OUTCOMES_CANONICAL_PATH}>{PILOT_OUTCOMES_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-the-report-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-the-report-shows">What the report shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-pilot-outcomes-report-items"
            >
              {PILOT_OUTCOMES_HELP_REPORT_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-to-read-pilot-outcomes"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-to-read-pilot-outcomes">How pilot outcomes work</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-pilot-outcomes-how-stepper"
            >
              {PILOT_OUTCOMES_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="where-to-go-next"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="where-to-go-next">Where to go next</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="help-pilot-outcomes-sibling-reports">
              {PILOT_OUTCOMES_HELP_SIBLING_REPORTS.map((report) => (
                <Card key={report.id} className="border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{report.description}</p>
                    <Link className={OPERATOR_LINK.inline} href={report.href}>
                      {report.actionLabel} →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <PilotOutcomesHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={PILOT_OUTCOMES_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
