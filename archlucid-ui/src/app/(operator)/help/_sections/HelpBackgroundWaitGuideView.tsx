"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { HelpBackgroundWaitInFlightStripAction } from "@/app/(operator)/help/_sections/HelpBackgroundWaitInFlightStripAction";
import { HelpBackgroundWaitShortcutKeyChip } from "@/app/(operator)/help/_sections/HelpBackgroundWaitShortcutKeyChip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { StatusTag } from "@/components/ui/status-tag";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_DOC_PATH,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_LABEL,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_COMPLETION_CHECK_BACK_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_IN_FLIGHT_SHORTCUT,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_IN_FLIGHT_SHORTCUT_SCOPE,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OPERATION_STATE_ROWS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PAGE_SUBTITLE,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RESUME_PATH_INTRO,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED_TAG,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TOPIC_LABEL } from "@/lib/daytime-wait-help-background-wait-evidence-copy";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PRIMARY_CONTENT_ID,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_LINK_LABEL,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SKIP_TARGET_ID,
} from "@/lib/daytime-wait-help-background-wait-page-copy";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH } from "@/lib/daytime-wait-help-background-wait-route";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL,
  resolveBackgroundWaitHelpReturnHref,
} from "@/lib/daytime-wait-help-background-wait-return";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveOperationStateStatusPresentation } from "@/lib/operations/operation-state-present";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import {
  DESIGN_TOKENS,
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

function HelpBackgroundWaitProvenanceLine(props: {
  readonly entry: ProductDocumentationEntry;
}): React.ReactElement | null {
  const lastReviewed = props.entry.lastReviewed?.trim() ?? "";

  if (lastReviewed.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-topic-registry-provenance"
    >
      Guide last reviewed {lastReviewed} · Daytime-wait help (DW-015 /{" "}
      <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF}>
        {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_LABEL}
      </Link>
      )
    </p>
  );
}

function HelpTechnicalCode(props: { readonly children: string }): React.ReactElement {
  return (
    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
      {props.children}
    </code>
  );
}

/** DW-015 — work continues in the background on Working. */
export function HelpBackgroundWaitGuideView(props: HelpBackgroundWaitGuideViewProps): React.ReactElement {
  const { entry } = props;
  const searchParams = useSearchParams();
  const returnToReviewHref = resolveBackgroundWaitHelpReturnHref(searchParams.get("returnTo") ?? undefined);
  const contentGridClass = resolveHelpPageContentGridClass(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);
  const cancelClarity = DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY;
  const inFlightShortcut = DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_IN_FLIGHT_SHORTCUT;
  const inFlightShortcutKeys =
    inFlightShortcut === null ? null : registryKeyToAriaKeyShortcuts(inFlightShortcut.key);

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

      {returnToReviewHref !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            className={OPERATOR_LINK.inline}
            href={returnToReviewHref}
            data-testid="help-background-wait-return-to-review"
          >
            {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL}
          </Link>
        </p>
      ) : null}

      <HelpTopicGuidePageHeader
        title={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE}
        titleTestId="help-background-wait-page-title"
        subtitle={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PAGE_SUBTITLE}
        navHref={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TOPIC_LABEL} />}
        metadata={<HelpBackgroundWaitProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <p className={readingBodyClass} data-testid="help-background-wait-overview">
            {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD}
          </p>

          <section
            aria-labelledby="working-vs-guided-seats"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="working-vs-guided-seats">Working vs Guided seats</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-background-wait-seat-working">
              Working seats use background wait: the shell in-flight strip (header in-progress control) is the resume path
              across pages. Record execute follows the async operations pattern in{" "}
              <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF}>
                {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_LABEL}
              </Link>{" "}
              — poll <HelpTechnicalCode>GET /v1/operations/&#123;operationId&#125;</HelpTechnicalCode>, not a fictional
              run-progress URL.
            </p>
            <div className="flex flex-wrap items-center gap-2" data-testid="help-background-wait-seat-guided">
              <StatusTag
                kind="neutral"
                label={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED_TAG}
                data-testid="help-background-wait-seat-guided-tag"
              />
              <p className={cn(readingBodyClass, "m-0 text-al-text-secondary")}>
                {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED}
              </p>
            </div>
            <p className={readingBodyClass}>
              See{" "}
              <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS[0].href}>
                Record vs Practice on the Working desk
              </Link>{" "}
              for execute gravity, and{" "}
              <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF}>
                Proxy timeout vs Real execute
              </Link>{" "}
              for edge timeouts on async {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_LABEL} (
              <Link className={OPERATOR_LINK.inline} href={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF}>
                {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_LABEL}
              </Link>
              ).
            </p>
            <p className={cn(readingBodyClass, "text-al-text-secondary")} data-testid="help-background-wait-adr-doc-path">
              Technical reference: <HelpTechnicalCode>{DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_DOC_PATH}</HelpTechnicalCode>
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
            {inFlightShortcut !== null && inFlightShortcutKeys !== null ? (
              <p className={readingBodyClass} data-testid="help-background-wait-resume-shortcut-chip">
                <HelpBackgroundWaitShortcutKeyChip
                  shortcut={inFlightShortcutKeys}
                  label={inFlightShortcut.label}
                  scope={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_IN_FLIGHT_SHORTCUT_SCOPE}
                />
              </p>
            ) : null}
            <HelpBackgroundWaitInFlightStripAction ariaKeyShortcuts={inFlightShortcut?.key} />
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
                  <HelpSectionHeading id={`background-wait-${action.id}`} level="h3">
                    {action.label}
                  </HelpSectionHeading>
                  <p className="m-0 mt-1 text-al-text-secondary">{action.helpExplanation}</p>
                  {action.id === "stop" ? (
                    <p
                      className={cn(
                        "m-0 mt-2 border-l-4 border-l-amber-600 px-3 py-2 text-al-text-secondary dark:border-l-amber-500",
                        DESIGN_TOKENS.callout.warn,
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                      data-testid="help-background-wait-stop-safety"
                    >
                      {cancelClarity.stopSafetyDetail}
                    </p>
                  ) : null}
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
              Working UI shows named lifecycle stages and elapsed time only — not an authoritative{" "}
              <HelpTechnicalCode>percentComplete</HelpTechnicalCode> bar.{" "}
              <HelpTechnicalCode>/v1/runs/&#123;runId&#125;/progress</HelpTechnicalCode> does not exist; progress truth
              is the operations API and shell strip rows.
            </p>
            <dl
              className={cn("m-0 grid gap-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-background-wait-operation-states"
            >
              {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OPERATION_STATE_ROWS.map((row) => {
                const presentation = resolveOperationStateStatusPresentation(row.state);

                return (
                  <div
                    key={row.state}
                    className="grid gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800 sm:grid-cols-[minmax(0,10rem)_minmax(0,8rem)_1fr] sm:items-center"
                  >
                    <dt className="m-0 font-medium text-al-text-primary">
                      <HelpTechnicalCode>{row.state}</HelpTechnicalCode>
                    </dt>
                    <dd className="m-0">
                      <StatusTag kind={presentation.kind} label={presentation.label} />
                    </dd>
                    <dd className="m-0 text-al-text-secondary">{row.meaning}</dd>
                  </div>
                );
              })}
            </dl>
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
            {inFlightShortcut !== null && inFlightShortcutKeys !== null ? (
              <p
                className={readingBodyClass}
                data-testid="help-background-wait-keyboard-shortcut-chip"
                aria-keyshortcuts={inFlightShortcut.key}
              >
                <HelpBackgroundWaitShortcutKeyChip
                  shortcut={inFlightShortcutKeys}
                  label={inFlightShortcut.label}
                  scope={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_IN_FLIGHT_SHORTCUT_SCOPE}
                />
              </p>
            ) : null}
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
        </div>

        <HelpTopicTableOfContents headings={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
