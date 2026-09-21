import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_COMPLETION_CHECK_BACK_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_HELPER,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OPERATION_STATE_ROWS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PAGE_SUBTITLE,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RESUME_PATH_INTRO,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TOPIC_LABEL } from "@/lib/daytime-wait-help-background-wait-evidence-copy";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PRIMARY_CONTENT_ID,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_LINK_LABEL,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_TARGET_ID,
} from "@/lib/daytime-wait-help-background-wait-page-copy";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH } from "@/lib/daytime-wait-help-background-wait-route";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpBackgroundWaitGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: {
  readonly id: string;
  readonly level?: "h2" | "h3";
  readonly children: string;
}): React.ReactElement {
  const level = props.level ?? "h2";
  const className = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    level === "h2" ? OPERATOR_TYPOGRAPHY.sectionTitle : OPERATOR_TYPOGRAPHY.cardTitle,
    "m-0 scroll-mt-24",
  );

  if (level === "h3") {
    return (
      <h3 id={props.id} className={className}>
        {props.children}
      </h3>
    );
  }

  return (
    <h2 id={props.id} className={className}>
      {props.children}
    </h2>
  );
}

/** DW-015 — work continues in the background on Working. */
export function HelpBackgroundWaitGuideView(props: HelpBackgroundWaitGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const cancelClarity = DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-background-wait-guide"
    >
      <a
        href={`#${DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE}
        titleTestId="help-background-wait-page-title"
        subtitle={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PAGE_SUBTITLE}
        navHref={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TOPIC_LABEL} />}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <p className={readingBodyClass} data-testid="help-background-wait-overview">
            {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD}
          </p>

          <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-background-wait-desk-helper">
            {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_HELPER}
          </p>

          <section
            aria-labelledby="working-vs-guided-seats"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="working-vs-guided-seats">Working vs Guided seats</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-seat-working">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING}
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-background-wait-seat-guided">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED}
            </p>
            <p className={readingBodyClass}>
              See{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("career-vs-rehearsal")}>
                Record vs Practice on the Working desk
              </Link>{" "}
              for execute gravity, and{" "}
              <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("proxy-timeout-real-execute")}>
                Proxy timeout vs Real execute
              </Link>{" "}
              for edge timeouts on async Career Real execute (
              <span className="font-medium text-al-text-primary">ADR 0096</span>).
            </p>
          </section>

          <section
            aria-labelledby="shell-in-flight-resume-path"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="shell-in-flight-resume-path">
              Shell in-flight strip (resume path)
            </HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-resume-path">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RESUME_PATH_INTRO}
            </p>
          </section>

          <section
            aria-labelledby="wait-leave-or-stop"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-background-wait-cancel-clarity"
          >
            <HelpSectionHeading id="wait-leave-or-stop">{cancelClarity.heading}</HelpSectionHeading>
            <p className={cn(readingBodyClass, "text-al-text-secondary")}>{cancelClarity.panelHeaderOneLiner}</p>
            <div className={cn("space-y-3", HELP_PAGE_LAYOUT.readingBody)}>
              {cancelClarity.actions.map((action) => (
                <div key={action.id}>
                  <HelpSectionHeading id={action.id} level="h3">
                    {action.label}
                  </HelpSectionHeading>
                  <p className="m-0 mt-1 text-al-text-secondary">{action.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="named-stages-not-percentages"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="named-stages-not-percentages">Named stages, not percentages</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-no-percentage">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY}
            </p>
            <ul
              className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-background-wait-operation-states"
            >
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OPERATION_STATE_ROWS.map((row) => (
                <li key={row.state} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <span className="font-medium text-al-text-primary">{row.state}</span>
                  <span className="text-al-text-secondary"> — {row.meaning}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="when-analysis-finishes"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="when-analysis-finishes">When analysis finishes</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-completion-check-back">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_COMPLETION_CHECK_BACK_BODY}
            </p>
          </section>

          <section
            aria-labelledby="keyboard-shortcuts"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="keyboard-shortcuts">Keyboard shortcuts</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-keyboard-shortcuts">
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_BODY}
            </p>
            <p className={readingBodyClass}>
              <Link
                className={OPERATOR_LINK.inline}
                href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF}
                data-testid="help-background-wait-open-shortcuts-link"
              >
                Open Review shortcuts →
              </Link>
            </p>
          </section>

          <section
            aria-labelledby={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-background-wait-related-topics"
          >
            <HelpSectionHeading id={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID}>
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING}
            </HelpSectionHeading>
            <ul className={cn("m-0 list-none space-y-2 p-0", HELP_PAGE_LAYOUT.readingBody)}>
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS.map((topic) => (
                <li key={topic.href}>
                  <Link className={OPERATOR_LINK.nav} href={topic.href}>
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={readingBodyClass}>
              <Link
                className={OPERATOR_LINK.inline}
                href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN.href}
                data-testid="help-background-wait-return-to-help"
              >
                {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN.label} →
              </Link>
            </p>
          </section>

          <SponsorSendPathHonestyPanel testIdPrefix="help-background-wait" showSsoOptional={false} />
        </div>

        <HelpTopicTableOfContents headings={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
