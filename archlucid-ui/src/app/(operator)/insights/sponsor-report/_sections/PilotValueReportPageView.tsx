"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import {
  parseValueReportHowItWorksOpenFromSearch,
  valueReportHowItWorksDisclosureHrefFromSearch,
} from "@/lib/insights/value-report-how-it-works-disclosure-url";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS,
  BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE,
  BUYER_VALUE_REPORT_OUTCOME_LEAD,
  BUYER_VALUE_REPORT_PAGE_SUBTITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { SponsorReportBreadcrumb } from "@/components/insights/SponsorReportBreadcrumb";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  PILOT_OUTCOMES_PRIMARY_CONTENT_ID,
  PILOT_OUTCOMES_SKIP_LINK_LABEL,
} from "@/lib/pilot-outcomes-page-copy";
import { PILOT_OUTCOMES_CLAIM_DISCIPLINE } from "@/lib/pilot-outcomes-evidence-copy";
import { buildPilotOutcomesSponsorNarrative } from "@/lib/pilot-outcomes-sponsor-report";
import {
  buildPilotOutcomesEmptyDiagnostics,
  pilotOutcomesReportHasFinalizedReviews,
} from "@/lib/pilot-outcomes-report-diagnostics";
import {
  SPONSOR_REPORT_PAGE_TITLE,
} from "@/lib/sponsor-report-navigation";
import {
  writeSponsorReportPickedReviewId,
} from "@/lib/sponsor-report/sponsor-report-picked-review-storage";
import {
  resolveValueReportReportingEmphasizedStepId,
  resolveValueReportReportingSteps,
} from "@/lib/value-report-reporting-checklist";

import { PilotOutcomesEmailConfirmDialog } from "./PilotOutcomesEmailConfirmDialog";
import { PilotOutcomesEmptyState } from "./PilotOutcomesEmptyState";
import { PilotOutcomesLoadFailure } from "./PilotOutcomesLoadFailure";
import { PilotOutcomesLoadingSkeleton } from "./PilotOutcomesLoadingSkeleton";
import { PilotValueReportBuyerChrome } from "./PilotValueReportBuyerChrome";
import { PilotValueReportExportControls } from "./PilotValueReportExportControls";
import { PilotValueReportFindingsSection } from "./PilotValueReportFindingsSection";
import { PilotValueReportMetricsSection } from "./PilotValueReportMetricsSection";
import { SponsorReportFinalizedReviewPickerStrip } from "./SponsorReportFinalizedReviewPickerStrip";
import { ValueReportIncludesSection } from "./ValueReportIncludesSection";
import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

type Props = {
  readonly model: PilotValueReportPilotPageViewModel;
};

export function PilotValueReportPageView(props: Props) {
  const m = props.model;
  const router = useRouter();
  const pathname = usePathname() ?? SPONSOR_REPORT_PATH;
  const searchParams = useSearchParams();
  const valueReportHowItWorksOpenParam = searchParams.get("valueReportHowItWorksOpen");
  const [howItWorksOpen, setHowItWorksOpenState] = useState(() =>
    parseValueReportHowItWorksOpenFromSearch(valueReportHowItWorksOpenParam),
  );

  const syncHowItWorksOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(valueReportHowItWorksDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setHowItWorksOpenState(parseValueReportHowItWorksOpenFromSearch(valueReportHowItWorksOpenParam));
  }, [valueReportHowItWorksOpenParam]);

  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const periodControlsRef = useRef<HTMLDivElement>(null);

  const onPickReviewForReporting = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      writeSponsorReportPickedReviewId(trimmed);

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${SPONSOR_REPORT_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const hasFinalizedReviews = pilotOutcomesReportHasFinalizedReviews(m.data);
  const emptyDiagnostics = useMemo(
    () => buildPilotOutcomesEmptyDiagnostics(m.data, m.fromUtc, m.toUtc, m.includesSampleData),
    [m.data, m.fromUtc, m.includesSampleData, m.toUtc],
  );
  const executiveNarrative = m.data !== null && hasFinalizedReviews ? buildPilotOutcomesSponsorNarrative(m.data) : null;
  const criticalFindings = m.data?.findingsBySeverity.critical ?? 0;
  const highFindings = m.data?.findingsBySeverity.high ?? 0;
  const materialFindings = criticalFindings + highFindings;

  const scrollToPeriodControls = () => {
    periodControlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const valueReportReportingChecklistSteps = resolveValueReportReportingSteps({
    reviewPicked: scopedRunFilterActive,
    reportReviewed: hasFinalizedReviews && m.data !== null,
    exportReady: m.canMutate && hasFinalizedReviews && !m.busy,
  });
  const valueReportReportingChecklistEmphasizedStepId = resolveValueReportReportingEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    reportReviewed: hasFinalizedReviews && m.data !== null,
    exportReady: m.canMutate && hasFinalizedReviews && !m.busy,
  });

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4 print:w-full" data-testid="pilot-outcomes-page">
      <a
        href={`#${PILOT_OUTCOMES_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {PILOT_OUTCOMES_SKIP_LINK_LABEL}
      </a>

      {buyerPolishedShell ? null : <LayerHeader pageKey="value-report-pilot" />}
      {buyerPolishedShell ? null : <ValueReportOutcomesNav />}
      <DocumentLayout>
        <div id={PILOT_OUTCOMES_PRIMARY_CONTENT_ID} className="scroll-mt-24 space-y-4">
          <OperatorPageHeader
            navHref={SPONSOR_REPORT_PATH}
            title={SPONSOR_REPORT_PAGE_TITLE}
            breadcrumb={buyerPolishedShell ? <SponsorReportBreadcrumb /> : undefined}
            subtitle={
              buyerPolishedShell ? (
                <>
                  <p className="m-0">{BUYER_VALUE_REPORT_PAGE_SUBTITLE}</p>
                  <p className="m-0 mt-2">{BUYER_VALUE_REPORT_OUTCOME_LEAD}</p>
                </>
              ) : null
            }
            claimDiscipline={PILOT_OUTCOMES_CLAIM_DISCIPLINE}
            claimDisciplineTestId="pilot-outcomes-claim-discipline"
            actions={buyerPolishedShell ? undefined : <PageContextualHelpButton />}
          />

          <PilotValueReportBuyerChrome />

        {hasFinalizedReviews && !scopedRunFilterActive ? (
          <SponsorReportFinalizedReviewPickerStrip
            hasFinalizedReviews={hasFinalizedReviews}
            selectedReviewId=""
            onSelectedReviewIdChange={onPickReviewForReporting}
          />
        ) : null}

        {scopedRunFilterActive && hasFinalizedReviews ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="pilot-value-report-run-scope-banner"
          >
            {"Sponsor report scoped to review "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={SPONSOR_REPORT_PATH}>
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
      ) : null}

        {scopedRunFilterActive ? (
          <IntegrationConnectChecklist
            title="Reporting checklist"
            steps={valueReportReportingChecklistSteps}
            emphasizedStepId={valueReportReportingChecklistEmphasizedStepId}
            testIdPrefix="value-report-reporting"
          />
        ) : null}

        <CollapsibleSection
          title={BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE}
          open={howItWorksOpen}
          onToggle={setHowItWorksOpen}
          sectionTestId="value-report-how-it-works"
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS}
          </p>
        </CollapsibleSection>

        {m.includesSampleData ? (
          <div
            role="status"
            className={cn(
              "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="pilot-outcomes-sample-banner"
          >
            Sample sponsor report — figures come from the demonstration workspace, not production pilot performance.
          </div>
        ) : null}

        <PilotValueReportExportControls
          model={m}
          hasFinalizedReviews={hasFinalizedReviews}
          periodControlsRef={periodControlsRef}
        />

        <ValueReportIncludesSection />

        {m.error && m.data === null && !m.busy ? (
          buyerPolishedShell ? (
            <PilotOutcomesLoadFailure
              message={m.error.message}
              correlationId={m.error.correlationId}
              onRetry={() => void m.load()}
            />
          ) : (
            <OperatorApiProblem
              fallbackMessage={m.error.message}
              problem={m.error.problem}
              correlationId={m.error.correlationId}
            />
          )
        ) : null}

        {m.error && m.data !== null ? (
          <OperatorApiProblem
            fallbackMessage={m.error.message}
            problem={m.error.problem}
            correlationId={m.error.correlationId}
          />
        ) : null}

        {m.busy && m.data === null ? (
          buyerPolishedShell ? (
            <PilotOutcomesLoadingSkeleton />
          ) : (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} role="status" aria-live="polite">
              Generating sponsor report…
            </p>
          )
        ) : null}

        {!m.busy && m.data !== null && !hasFinalizedReviews ? (
          <PilotOutcomesEmptyState
            diagnostics={emptyDiagnostics}
            onApplyPeriod={scrollToPeriodControls}
            periodBusy={m.busy}
          />
        ) : null}

        {m.data !== null && hasFinalizedReviews && scopedRunFilterActive ? (
          <div className={OPERATOR_LAYOUT.sectionStack}>
            <PilotValueReportMetricsSection
              data={m.data}
              executiveNarrative={executiveNarrative}
              scopedRunId={scopedRunId}
              criticalFindings={criticalFindings}
              highFindings={highFindings}
              materialFindings={materialFindings}
            />
            <PilotValueReportFindingsSection
              data={m.data}
              scopedRunFilterActive={scopedRunFilterActive}
              scopedRunId={scopedRunId}
            />
          </div>
        ) : null}
        </div>
      </DocumentLayout>

      <PilotOutcomesEmailConfirmDialog
        open={m.emailPreviewOpen}
        preview={m.emailPreview}
        busy={m.emailBusy}
        onClose={m.closeEmailPreview}
        onConfirm={m.confirmSendEmail}
      />
    </OperatorPageContainer>
  );
}
