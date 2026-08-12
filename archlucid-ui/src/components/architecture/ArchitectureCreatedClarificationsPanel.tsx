"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { ArchitectureStructuringFailureNotice } from "@/components/architecture/ArchitectureStructuringFailureNotice";
import { ClarificationGapRow } from "@/components/architecture/ClarificationGapRow";
import { clarificationGapImpactCopy } from "@/lib/architecture/architecture-clarification-gap-present";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF, REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedClarificationsPanelProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly dismissedClarificationGapIds: ReadonlySet<string>;
  readonly onDismissClarificationGap: (itemId: string) => void;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
};

/** Clarifications tab — unanswered gaps, open questions, and confidence impact. */
export function ArchitectureCreatedClarificationsPanel(
  props: ArchitectureCreatedClarificationsPanelProps,
): React.JSX.Element {
  const [parseAttempt, setParseAttempt] = useState(0);
  const continueClarifyingHref = props.correctionHref ?? REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;

  const parseResult = useMemo(
    () => {
      void parseAttempt;
      return parseArchitectureGeneratedContent(props.sourceText, props.userAssertions);
    },
    [props.sourceText, props.userAssertions, parseAttempt],
  );
  const openQuestions = parseResult.sections.find((section) => section.key === "open-questions");
  const answeredSections = parseResult.sections.filter(
    (section) => section.provenance === "asserted" && section.key !== "open-questions",
  );
  const visibleClarificationGaps = props.model.clarificationGaps.filter(
    (item) => !props.dismissedClarificationGapIds.has(item.id),
  );
  const hasVisibleWorkQueue =
    visibleClarificationGaps.length > 0 ||
    props.model.evidenceGaps.length > 0 ||
    props.model.assessmentItems.length > 0;

  return (
    <div className="space-y-5" data-testid="architecture-workspace-clarifications-panel">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Clarifications</h2>

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Unresolved clarifications reduce assessment confidence. Answer open questions or add evidence before sharing
        with sponsors or creating work items.
      </p>

      {parseResult.hasPartialParseFailure ? (
        <ArchitectureStructuringFailureNotice
          runId={props.model.runId}
          onRetry={() => {
            setParseAttempt((current) => current + 1);
          }}
        />
      ) : null}

      {hasVisibleWorkQueue ? (
        <div className="space-y-4">
          {visibleClarificationGaps.length > 0 ? (
            <section className="space-y-2" aria-labelledby="architecture-open-clarifications-heading">
              <h3
                id="architecture-open-clarifications-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Open clarifications
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {visibleClarificationGaps.map((item) => (
                  <li key={item.id}>
                    <ClarificationGapRow
                      item={item}
                      impact={clarificationGapImpactCopy(item)}
                      answerHref={continueClarifyingHref}
                      onNavigateTab={props.onNavigateTab}
                      onDismiss={props.onDismissClarificationGap}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {props.model.evidenceGaps.length > 0 ? (
            <section className="space-y-2" aria-labelledby="architecture-evidence-gaps-heading">
              <h3
                id="architecture-evidence-gaps-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Evidence still needed
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {props.model.evidenceGaps.map((item) => (
                  <li key={item.id}>
                    <ClarificationGapRow
                      item={item}
                      impact={clarificationGapImpactCopy(item)}
                      answerHref={continueClarifyingHref}
                      onNavigateTab={props.onNavigateTab}
                      onDismiss={props.onDismissClarificationGap}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {props.model.assessmentItems.length > 0 ? (
            <section className="space-y-2" aria-labelledby="architecture-assessment-status-heading">
              <h3
                id="architecture-assessment-status-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Assessment status
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {props.model.assessmentItems.map((item) => (
                  <li key={item.id}>
                    <ClarificationGapRow
                      item={item}
                      impact={clarificationGapImpactCopy(item)}
                      answerHref={continueClarifyingHref}
                      onNavigateTab={props.onNavigateTab}
                      onDismiss={props.onDismissClarificationGap}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : parseResult.hasPartialParseFailure ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Clarification gaps could not be determined while structuring is incomplete.
        </p>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No critical clarification gaps detected from your brief.
        </p>
      )}

      {openQuestions !== undefined ? (
        <ArchitectureStructuredSectionView
          section={openQuestions}
          defaultOpen
          correctionHref={props.correctionHref}
        />
      ) : null}

      {answeredSections.length > 0 ? (
        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
          <summary className="cursor-pointer font-semibold">
            Answered from your brief ({answeredSections.length})
          </summary>
          <div className="mt-3 space-y-3">
            {answeredSections.map((section) => (
              <ArchitectureStructuredSectionView
                key={section.key}
                section={section}
                defaultOpen={false}
                correctionHref={props.correctionHref}
              />
            ))}
          </div>
        </details>
      ) : null}

      <div className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Confidence impact
        </h3>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Each missing business outcome, system boundary, or evidence artifact lowers how confidently ArchLucid can
          assess risks and recommend remediation. Clarify gaps before running a final assessment or sponsor share.
        </p>
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={continueClarifyingHref} className="font-medium text-teal-800 dark:text-teal-300">
            Continue clarifying · {REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}
          </Link>
        </p>
      </div>

      <ArchitectureCreatedClarificationsEvidenceOrientationStrip />
    </div>
  );
}
