import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RecurrenceSchedulesHelpEvidenceOrientationStrip } from "@/components/help/RecurrenceSchedulesHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS,
  RECURRENCE_SCHEDULES_HELP_AUTOMATION_SECTION_TITLE,
  RECURRENCE_SCHEDULES_HELP_BREADCRUMB_TOPIC_TITLE,
  RECURRENCE_SCHEDULES_HELP_EXAMPLES_SECTION_TITLE,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG,
  RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS,
  RECURRENCE_SCHEDULES_HELP_HOW_IT_WORKS_STEPS,
  RECURRENCE_SCHEDULES_HELP_OVERVIEW,
  RECURRENCE_SCHEDULES_HELP_PAGE_EYEBROW,
  RECURRENCE_SCHEDULES_HELP_PAGE_TITLE,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID,
  RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_BODY,
  RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_SECTION_TITLE,
  RECURRENCE_SCHEDULES_HELP_SKIP_LINK_LABEL,
  recurrenceSchedulesHelpPageSubtitle,
} from "@/lib/recurrence-schedules-help-guide-content";
import {
  RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH,
  RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK,
  RECURRENCE_SCHEDULES_HELP_HEALTH_AUDIT_TRAIL_NOTE,
  RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS,
  RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS_TITLE,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpRecurrenceSchedulesGuideViewProps = {
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

function HowRecurrenceSchedulesWorkSteps(): React.ReactElement {
  return (
    <ol
      className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="help-recurrence-schedules-how-stepper"
    >
      {RECURRENCE_SCHEDULES_HELP_HOW_IT_WORKS_STEPS.map((step, index) => (
        <li key={step} className="flex min-w-0 gap-3">
          <span className="sr-only">{`Step ${index + 1}`}</span>
          <span
            aria-hidden
            className={HELP_PAGE_LAYOUT.workflowStepNumber}
          >
            {index + 1}
          </span>
          <p className={cn("m-0 min-w-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

function RecurrenceSchedulesHelpAutomationSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="what-a-schedule-automates"
      className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
    >
      <HelpSectionHeading id="what-a-schedule-automates">
        {RECURRENCE_SCHEDULES_HELP_AUTOMATION_SECTION_TITLE}
      </HelpSectionHeading>
      <ul
        className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid="help-recurrence-schedules-automation-items"
      >
        {RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS.map((item) => (
          <li key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-medium text-al-text-primary">{item.label}</span>
            <span className="text-al-text-secondary">
              {"from "}
              <Link className={OPERATOR_LINK.inline} href={item.href}>
                {item.sourceSurface}
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecurrenceSchedulesHelpExamplesSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="common-schedule-examples"
      className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
    >
      <HelpSectionHeading id="common-schedule-examples">
        {RECURRENCE_SCHEDULES_HELP_EXAMPLES_SECTION_TITLE}
      </HelpSectionHeading>
      <RecurrenceScheduleExamplesSection suppressHeading variant="compact" />
    </section>
  );
}

function RecurrenceSchedulesHelpHealthConstraintsBlock(): React.ReactElement {
  return (
    <div
      className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
      data-testid="help-recurrence-schedules-health-constraints"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-recurrence-schedules-health-audit-trail-note">
        {RECURRENCE_SCHEDULES_HELP_HEALTH_AUDIT_TRAIL_NOTE}
      </p>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS.map((constraint) => (
          <div key={constraint.label}>
            <dt className="font-medium text-al-text-primary">{constraint.label}</dt>
            <dd className="m-0 mt-1 text-al-text-secondary">{constraint.detail}</dd>
          </div>
        ))}
      </dl>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Sponsor digest email uses a separate surface.{" "}
        <Link className={OPERATOR_LINK.inline} href={RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK.href}>
          {RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK.label}
        </Link>
        .
      </p>
    </div>
  );
}

/** Operator recurrence schedules orientation for `/help/recurrence-schedules`. */
export function HelpRecurrenceSchedulesGuideView(
  props: HelpRecurrenceSchedulesGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-recurrence-schedules-guide"
    >
      <a
        href={`#${RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {RECURRENCE_SCHEDULES_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : RECURRENCE_SCHEDULES_HELP_PAGE_EYEBROW}
        title={RECURRENCE_SCHEDULES_HELP_PAGE_TITLE}
        titleTestId="help-recurrence-schedules-page-title"
        subtitle={recurrenceSchedulesHelpPageSubtitle(buyerPolishedShell)}
        navHref={RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={RECURRENCE_SCHEDULES_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <div className="flex flex-col items-start gap-2" data-testid="help-recurrence-schedules-header-actions">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.href}>
                  {RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <StatusTag
                kind="neutral"
                label={RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG}
                data-testid="help-recurrence-schedules-finalized-review-precondition-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-recurrence-schedules-finalized-review-precondition"
            >
              {RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION}
            </p>
          </div>
        }
      />

      <div className={contentGridClass}>
        <div
          id={RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          {buyerPolishedShell ? (
            <div data-testid="help-recurrence-schedules-orientation-top">
              <RecurrenceSchedulesHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}

          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-recurrence-schedules-overview"
          >
            {RECURRENCE_SCHEDULES_HELP_OVERVIEW}
          </p>

          <RecurrenceSchedulesHelpAutomationSection />

          <section
            aria-labelledby="how-recurrence-schedules-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-recurrence-schedules-work">How recurrence schedules work</HelpSectionHeading>
            <HowRecurrenceSchedulesWorkSteps />
          </section>

          <RecurrenceSchedulesHelpExamplesSection />

          <section
            aria-labelledby="two-different-kinds-of-schedule"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="two-different-kinds-of-schedule">
              {RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_SECTION_TITLE}
            </HelpSectionHeading>
            {buyerPolishedShell ? (
              <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-recurrence-schedules-schedule-kind-body">
                {RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_BODY}
              </p>
            ) : (
              <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" variant="compact" />
            )}
          </section>

          <section
            aria-labelledby="schedule-health-and-trust"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="schedule-health-and-trust">
              {RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS_TITLE}
            </HelpSectionHeading>
            <RecurrenceSchedulesHelpHealthConstraintsBlock />
          </section>

          {!buyerPolishedShell ? (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <RecurrenceSchedulesHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}
        </div>

        <HelpTopicTableOfContents headings={RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
