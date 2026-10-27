"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import { ClarificationAnswerCapturePanel } from "@/components/architecture/ClarificationAnswerCapturePanel";
import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { ArchitectureStructuringFailureNotice } from "@/components/architecture/ArchitectureStructuringFailureNotice";
import { ClarificationGapRow } from "@/components/architecture/ClarificationGapRow";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { clarificationGapImpactCopy } from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import type { ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import { REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import { buildReviewClarificationDeltaPresentation } from "@/lib/architecture/review-clarification-delta-presentation";
import {
  architectureAnsweredBriefDisclosureHrefFromSearch,
  parseArchitectureAnsweredBriefOpenFromSearch,
} from "@/lib/architecture/architecture-answered-brief-disclosure-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import type {
  ReviewClarificationDelta,
  ReviewClarificationQuestion,
} from "@/lib/review-clarification-questions-types";
import { describeClarificationQuestionsLoadState } from "@/lib/reviews/review-clarification-questions-honesty";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedClarificationsPanelProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly dismissedClarificationGapIds: ReadonlySet<string>;
  readonly onDismissClarificationGap: (itemId: string) => void;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  /** When Do this next owns the page primary, keep tab-scoped follow-ons as outline actions. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly clarificationQuestions?: readonly ReviewClarificationQuestion[];
  readonly clarificationRoundAvailable?: boolean;
  readonly clarificationDelta?: ReviewClarificationDelta | null;
  readonly clarificationQuestionsBlockedReason?: string | null;
  readonly priorRunId?: string;
};

const FINDINGS_DERIVED_GAP_SOURCE_LABEL = "From assessment findings";

function partitionClarificationGapsBySource(items: readonly ArchitectureMissingItem[]): {
  readonly fromBrief: readonly ArchitectureMissingItem[];
  readonly fromFindings: readonly ArchitectureMissingItem[];
} {
  const fromBrief: ArchitectureMissingItem[] = [];
  const fromFindings: ArchitectureMissingItem[] = [];

  for (const item of items) {
    if (item.source.label === FINDINGS_DERIVED_GAP_SOURCE_LABEL) {
      fromFindings.push(item);
    } else {
      fromBrief.push(item);
    }
  }

  return { fromBrief, fromFindings };
}

function hasOpenQuestionEntities(
  section: ReturnType<typeof parseArchitectureGeneratedContent>["sections"][number] | undefined,
): boolean {
  if (section === undefined || section.entities == null) {
    return false;
  }

  return section.entities.length > 0;
}

export function presentOpenQuestionEntityCount(
  section: ReturnType<typeof parseArchitectureGeneratedContent>["sections"][number] | undefined,
): string {
  if (section === undefined) {
    return "Open question count was not stored.";
  }

  if (section.entities == null) {
    return "Open question count was not stored.";
  }

  return String(section.entities.length);
}

/** Clarifications tab — unanswered gaps, open questions, and confidence impact. */
export function ArchitectureCreatedClarificationsPanel(
  props: ArchitectureCreatedClarificationsPanelProps,
): React.JSX.Element {
  const [parseAttempt, setParseAttempt] = useState(0);
  const continueClarifyingHref = buildArchitectureCorrectionHref(props.model.runId, props.correctionHref);
  const diagramTabHref = buildReviewWorkspaceTabHref(props.model.runId, "architecture", {
    includeCreateIntent: true,
  });
  const findingsTabHref = buildReviewWorkspaceTabHref(props.model.runId, "findings", {
    includeCreateIntent: true,
  });
  const activityTabHref = buildReviewWorkspaceTabHref(props.model.runId, "activity", {
    includeCreateIntent: true,
  });

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
  const partitionedClarificationGaps = partitionClarificationGapsBySource(visibleClarificationGaps);
  const hasVisibleWorkQueue =
    visibleClarificationGaps.length > 0 ||
    props.model.evidenceGaps.length > 0 ||
    props.model.assessmentItems.length > 0;
  const hasOpenQuestions = hasOpenQuestionEntities(openQuestions);
  const clarificationQuestionsLoadState = describeClarificationQuestionsLoadState(props.clarificationQuestions);
  const preferModelInterviewQuestions =
    props.clarificationQuestions !== undefined && props.clarificationQuestions.length > 0;
  const showIntakeOpenQuestions = hasOpenQuestions && !preferModelInterviewQuestions;
  const clarificationBlockedReason = props.clarificationQuestionsBlockedReason?.trim() ?? "";
  const hasClarificationBlockedReason = clarificationBlockedReason.length > 0;
  const openQuestionsEntitiesOmitted =
    openQuestions !== undefined && openQuestions.entities == null;
  const isZeroGapSuccess =
    props.clarificationQuestions !== undefined
    && !hasClarificationBlockedReason
    && !parseResult.hasPartialParseFailure
    && !hasVisibleWorkQueue
    && !showIntakeOpenQuestions
    && !openQuestionsEntitiesOmitted;
  const reviewDiagramVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";
  const deltaPresentation = buildReviewClarificationDeltaPresentation(props.clarificationDelta);
  const clarificationQuestions = props.clarificationQuestions ?? [];
  const pathname = usePathname() ?? "/";
  const readAnsweredBriefOpenFromUrl = (): boolean =>
    parseArchitectureAnsweredBriefOpenFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("architectureAnsweredBriefOpen"),
    );
  const [answeredBriefOpen, setAnsweredBriefOpenState] = useState(() => readAnsweredBriefOpenFromUrl());
  const answeredBriefOpenRef = useRef(answeredBriefOpen);
  answeredBriefOpenRef.current = answeredBriefOpen;

  const syncAnsweredBriefOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        architectureAnsweredBriefDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setAnsweredBriefOpen = useCallback(
    (open: boolean) => {
      if (answeredBriefOpenRef.current === open) {
        return;
      }

      answeredBriefOpenRef.current = open;
      setAnsweredBriefOpenState(open);
      syncAnsweredBriefOpenToUrl(open);
    },
    [syncAnsweredBriefOpenToUrl],
  );

  useEffect(() => {
    const syncAnsweredBriefOpenFromUrl = (): void => {
      const next = readAnsweredBriefOpenFromUrl();

      if (answeredBriefOpenRef.current === next) {
        return;
      }

      answeredBriefOpenRef.current = next;
      setAnsweredBriefOpenState(next);
    };

    syncAnsweredBriefOpenFromUrl();
    window.addEventListener("popstate", syncAnsweredBriefOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncAnsweredBriefOpenFromUrl);
    };
  }, []);

  return (
    <div className="space-y-5" data-testid="architecture-workspace-clarifications-panel">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Clarifications</h2>

      {clarificationQuestionsLoadState !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-clarifications-questions-load-state"
          role="status"
        >
          {clarificationQuestionsLoadState}
        </p>
      ) : null}

      {props.clarificationQuestionsBlockedReason !== null
      && props.clarificationQuestionsBlockedReason !== undefined
      && props.clarificationQuestionsBlockedReason.trim().length > 0 ? (
        <div data-testid="architecture-clarifications-blocked-reason">
          <OperatorApiProblem
            problem={null}
            fallbackMessage={props.clarificationQuestionsBlockedReason}
            variant="warning"
          />
        </div>
      ) : null}

      {deltaPresentation.summary !== null ? (
        <p
          className={cn("m-0 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
          data-testid="architecture-clarifications-delta-strip"
        >
          {deltaPresentation.summary}
        </p>
      ) : null}

      {props.clarificationRoundAvailable === true ? (
        <ClarificationAnswerCapturePanel
          runId={props.model.runId}
          priorRunId={props.priorRunId ?? props.model.runId}
          questions={clarificationQuestions}
          freeTextIntent={props.sourceText}
        />
      ) : null}

      {!isZeroGapSuccess ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          These clarifications are still open. Answer them or add evidence before sharing with sponsors or creating
          work items.
        </p>
      ) : null}

      {parseResult.hasPartialParseFailure ? (
        <ArchitectureStructuringFailureNotice
          runId={props.model.runId}
          onRetry={() => {
            setParseAttempt((current) => current + 1);
          }}
        />
      ) : null}

      {isZeroGapSuccess ? (
        <div
          className="space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="architecture-clarifications-empty-success"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            No open clarifications
          </h3>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Your brief covers the required context. Review the diagram, run an assessment, or open findings when you are
            ready for the next step.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={reviewDiagramVariant} size="sm" asChild>
              <Link href={diagramTabHref}>Review diagram</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={findingsTabHref}>Review findings</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={activityTabHref}>View assessment progress</Link>
            </Button>
          </div>
        </div>
      ) : hasVisibleWorkQueue ? (
        <div className="space-y-4">
          {partitionedClarificationGaps.fromBrief.length > 0 ? (
            <section className="space-y-2" aria-labelledby="architecture-open-clarifications-brief-heading">
              <h3
                id="architecture-open-clarifications-brief-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Open clarifications from your brief
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {partitionedClarificationGaps.fromBrief.map((item) => (
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

          {partitionedClarificationGaps.fromFindings.length > 0 ? (
            <section className="space-y-2" aria-labelledby="architecture-open-clarifications-findings-heading">
              <h3
                id="architecture-open-clarifications-findings-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Open clarifications from assessment findings
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {partitionedClarificationGaps.fromFindings.map((item) => (
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

      {openQuestions !== undefined && (openQuestions.entities === undefined || openQuestions.entities === null) ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Open question entities were not stored ({presentOpenQuestionEntityCount(openQuestions)}).
        </p>
      ) : null}

      {showIntakeOpenQuestions && openQuestions !== undefined ? (
        <ArchitectureStructuredSectionView
          section={openQuestions}
          defaultOpen
          correctionHref={props.correctionHref}
        />
      ) : null}

      {answeredSections.length > 0 ? (
        <CollapsibleSection
          title={`Answered from your brief (${answeredSections.length})`}
          open={answeredBriefOpen}
          onToggle={setAnsweredBriefOpen}
          sectionTestId="architecture-answered-brief"
        >
          <div className="space-y-3">
            {answeredSections.map((section) => (
              <ArchitectureStructuredSectionView
                key={section.key}
                section={section}
                defaultOpen={false}
                correctionHref={props.correctionHref}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {!isZeroGapSuccess ? (
        <div className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Missing brief or evidence fields
          </h3>
          <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            These rows list brief or evidence fields that were not stored. This panel does not store a confidence score.
            Clarify gaps before running a final assessment or sponsor share.
          </p>
          <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href={continueClarifyingHref} className={OPERATOR_LINK.inline}>
              Continue clarifying · {REVIEWS_NEW_GUIDED_QUESTIONS_LABEL}
            </Link>
          </p>
        </div>
      ) : null}

      <ArchitectureCreatedClarificationsEvidenceOrientationStrip />
    </div>
  );
}
