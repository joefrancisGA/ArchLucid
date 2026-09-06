"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import {
  GOVERNANCE_RECURRENCE_SCHEDULES_PATH,
  recurrenceSchedulesHref,
} from "@/lib/governance/recurrence-schedules-route";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { RecurrenceSchedulesPickReviewBeforeSchedulingStrip } from "@/components/governance/RecurrenceSchedulesPickReviewBeforeSchedulingStrip";
import { RecurrenceSchedulesNextReviewFooterClient } from "@/components/governance/RecurrenceSchedulesNextReviewFooterClient";
import { RecurrenceSchedulesWorkflowHelperCard } from "@/components/governance/RecurrenceSchedulesWorkflowHelperCard";
import { Button } from "@/components/ui/button";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE } from "@/lib/recurrence-schedules-evidence-copy";
import {
  RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID,
  RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID,
  RECURRENCE_SCHEDULES_SKIP_LINK_LABEL,
  RECURRENCE_SCHEDULES_SKIP_TARGET_ID,
} from "@/lib/recurrence-schedules-page-copy";
import {
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY,
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
} from "@/lib/recurrence-schedules-copy";
import {
  parseRecurrenceSchedulesHowItWorksOpenFromSearch,
  recurrenceSchedulesHowItWorksDisclosureHrefFromSearch,
} from "@/lib/governance/recurrence-schedules-how-it-works-disclosure-url";

import { RecurrenceSchedulesListSection } from "./RecurrenceSchedulesListSection";
import { RecurrenceSchedulesBuyerChrome } from "./RecurrenceSchedulesBuyerChrome";
import { useRecurrenceSchedulesClient } from "./use-recurrence-schedules-client";

/** TB-222 — governance workspace for architecture review recurrence schedules. */
export default function RecurrenceSchedulesClient() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_RECURRENCE_SCHEDULES_PATH;
  const searchParams = useSearchParams();
  const recurrenceSchedulesHowItWorksOpenParam = searchParams.get("recurrenceSchedulesHowItWorksOpen");
  const [howItWorksOpen, setHowItWorksOpenState] = useState(() =>
    parseRecurrenceSchedulesHowItWorksOpenFromSearch(recurrenceSchedulesHowItWorksOpenParam),
  );
  const {
    scopedRunId,
    scopedRunFilterActive,
    canMutate,
    schedules,
    loadError,
    retryingLoad,
    busyId,
    showCreatePanel,
    createSeed,
    createSourceRunId,
    editingId,
    editorState,
    pendingDisable,
    isEmpty,
    recurrenceWorkflowSteps,
    recurrenceWorkflowEmphasizedStepId,
    continueLastSchedule,
    mutationDisabledReason,
    mutationDisabledHintId,
    onPickReviewForScheduling,
    openCreateFromExample,
    openCreateFromWorkspaceActive,
    closeCreatePanel,
    retryLoad,
    reload,
    rememberSchedule,
    openSchedule,
    beginEdit,
    cancelEdit,
    toggleEnabled,
    executeToggleEnabled,
    saveEdit,
    setPendingDisable,
    setShowCreatePanel,
    setCreateSeed,
    setEditorState,
    displayTimeZoneId,
  } = useRecurrenceSchedulesClient();

  const syncHowItWorksOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(recurrenceSchedulesHowItWorksDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setHowItWorksOpen = useCallback(
    (open: boolean) => {
      setHowItWorksOpenState(open);
      syncHowItWorksOpenToUrl(open);
    },
    [syncHowItWorksOpenToUrl],
  );

  useEffect(() => {
    setHowItWorksOpenState(parseRecurrenceSchedulesHowItWorksOpenFromSearch(recurrenceSchedulesHowItWorksOpenParam));
  }, [recurrenceSchedulesHowItWorksOpenParam]);

  const populatedSecondaryActions = [
    { label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF },
    { label: "View pending approvals", href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF },
    { label: "Open risk register", href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF },
  ] as const;

  // Empty first viewport keeps one optional secondary link (TB-1133); populated keeps the full set.
  const secondaryActions = isEmpty
    ? ([{ label: "View architecture reviews", href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF }] as const)
    : populatedSecondaryActions;

  // Open-only + hide while panel is open so Create never toggles away in-progress fields (TB-1131).
  const createScheduleButton =
    showCreatePanel || !scopedRunFilterActive
      ? null
      : (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="recurrence-schedules-create-action"
        disabled={!canMutate}
        aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
        onClick={() => {
          setCreateSeed(null);
          setShowCreatePanel(true);
        }}
      >
        Create recurrence schedule
      </Button>
      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId="recurrence-schedules-mutate-disabled-hint"
      />
    </div>
  );

  return (
    <OperatorPageContainer
      variant="dashboard"
      className="space-y-4"
      data-testid="recurrence-schedules-page"
      data-empty-composition={isEmpty ? "true" : "false"}
    >
      <a
        href={`#${RECURRENCE_SCHEDULES_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {RECURRENCE_SCHEDULES_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={GOVERNANCE_RECURRENCE_SCHEDULES_PATH}
        title="Recurrence schedules"
        subtitle={RECURRENCE_SCHEDULES_PAGE_SUBTITLE}
        claimDiscipline={RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE}
        claimDisciplineTestId="recurrence-schedules-claim-discipline"
        actions={isEmpty ? null : <div className="flex flex-wrap items-center gap-2">{createScheduleButton}</div>}
      />

      <div
        id={RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID}
        data-testid={RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-4")}
      >
        <div
          id={RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID}
          data-testid={RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID}
          className="space-y-4"
        >
          {loadError ? (
            <OperatorSectionLoadFailure
              message={loadError}
              retrying={retryingLoad}
              testId="recurrence-schedules-load-failure"
              onRetry={() => void retryLoad()}
            />
          ) : null}

          {!scopedRunFilterActive ? (
            <RecurrenceSchedulesPickReviewBeforeSchedulingStrip
              selectedReviewId=""
              onSelectReview={onPickReviewForScheduling}
            />
          ) : (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="recurrence-schedules-run-scope-banner"
            >
              {"Scheduling recurrences for review "}
              <span className="font-mono text-al-text-primary">{scopedRunId}</span>
              {" · "}
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={recurrenceSchedulesHref()}>
                Clear review scope
              </Link>
              {" · "}
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
              >
                Open review
              </Link>
            </p>
          )}

          <RecurrenceSchedulesListSection
            scopedRunFilterActive={scopedRunFilterActive}
            isEmpty={isEmpty}
            showCreatePanel={showCreatePanel}
            createSeed={createSeed}
            createSourceRunId={createSourceRunId}
            recurrenceWorkflowSteps={recurrenceWorkflowSteps}
            recurrenceWorkflowEmphasizedStepId={recurrenceWorkflowEmphasizedStepId}
            canMutate={canMutate}
            closeCreatePanel={closeCreatePanel}
            reload={reload}
            openCreateFromWorkspaceActive={openCreateFromWorkspaceActive}
            openCreateFromExample={openCreateFromExample}
            continueLastSchedule={continueLastSchedule}
            openSchedule={openSchedule}
            schedules={schedules}
            displayTimeZoneId={displayTimeZoneId}
            editingId={editingId}
            editorState={editorState}
            busyId={busyId}
            mutationDisabledReason={mutationDisabledReason}
            mutationDisabledHintId={mutationDisabledHintId}
            rememberSchedule={rememberSchedule}
            toggleEnabled={toggleEnabled}
            beginEdit={beginEdit}
            cancelEdit={cancelEdit}
            setEditorState={setEditorState}
            saveEdit={saveEdit}
            createScheduleButton={createScheduleButton}
          />
        </div>

        <CollapsibleSection
          title={RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE}
          sectionTestId="recurrence-schedules-how-it-works"
          open={howItWorksOpen}
          onToggle={setHowItWorksOpen}
        >
          <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY}
          </p>
        </CollapsibleSection>

        {isEmpty ? null : <RecurrenceSchedulesWorkflowHelperCard />}

        <nav
          aria-label="Related governance links"
          className="flex flex-wrap gap-x-4 gap-y-1"
          data-testid="recurrence-schedules-secondary-links"
        >
          {secondaryActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {action.label}
            </Link>
          ))}
        </nav>

        <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />
        <AdvisoryRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />

        <RecurrenceSchedulesBuyerChrome />
      </div>

      <ConfirmationDialog
        open={pendingDisable !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDisable(null);
          }
        }}
        title="Disable recurrence schedule?"
        description={
          pendingDisable !== null
            ? `Disable “${pendingDisable.name}”? ArchLucid will stop creating scheduled architecture reviews from this schedule until you enable it again.`
            : "ArchLucid will stop creating scheduled architecture reviews from this schedule until you enable it again."
        }
        confirmLabel="Disable schedule"
        variant="destructive"
        busy={pendingDisable !== null && busyId === pendingDisable.scheduleId}
        onConfirm={() => {
          if (pendingDisable === null) {
            return;
          }

          rememberSchedule(pendingDisable.scheduleId);
          void executeToggleEnabled(pendingDisable, false)
            .then(() => {
              setPendingDisable(null);
            })
            .catch(() => {
              // Load error already surfaced.
            });
        }}
      />

      {scopedRunFilterActive ? <RecurrenceSchedulesNextReviewFooterClient runId={scopedRunId} /> : null}
    </OperatorPageContainer>
  );
}
