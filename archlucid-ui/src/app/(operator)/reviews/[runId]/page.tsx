import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEmptyState,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
  coerceRunDetail,
} from "@/lib/operator-response-guards";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance-gate-display";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { canonicalizeDemoRunId, demoRunUrlRequiresCanonicalRedirect } from "@/lib/demo-run-canonical";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { effectiveRunSummaryForPipeline } from "@/lib/run-summary-from-detail";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import { ContextualHelp } from "@/components/ContextualHelp";
import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { RunExplanationSection } from "@/components/RunExplanationSection";
import { RunFindingExplainabilityTable } from "@/components/RunFindingExplainabilityTable";
import { RunProgressTracker } from "@/components/RunProgressTracker";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";
import { RunDetailSectionNav, type RunDetailSection } from "@/components/RunDetailSectionNav";
import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";
import { RunDetailPageHeader } from "@/components/RunDetailPageHeader";
import { RunDetailTechnicalIdentifiersSection } from "@/components/RunDetailTechnicalIdentifiersSection";
import { RunTrustEvidenceCardSection } from "@/components/RunTrustEvidenceCardSection";
import { RunAgentForensicsSection } from "@/components/RunAgentForensicsSection";
import { EmailRunToSponsorBanner } from "@/components/EmailRunToSponsorBanner";
import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { GenerateSponsorValueReportButton } from "@/components/GenerateSponsorValueReportButton";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { SampleReviewPackageSummary } from "@/components/SampleReviewPackageSummary";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { PostCommitAdvancedAnalysisHint } from "@/components/PostCommitAdvancedAnalysisHint";
import { PostCommitRetentionRail } from "@/components/PostCommitRetentionRail";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import { RunTraceViewerLink } from "@/components/RunTraceViewerLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ApiResponseWithTrace,
  getBundleDownloadUrl,
  getManifestSummary,
  getRunDetail,
  getRunExplanationSummary,
  getRunExportDownloadUrl,
  getTraceabilityBundleDownloadUrl,
  getRunPipelineTimeline,
  getRunSummary,
  listArtifacts,
  listRunsByProject,
} from "@/lib/api";
import {
  tryStaticDemoArtifacts,
  tryStaticDemoExplanationSummary,
  tryStaticDemoGoldenManifestJsonForExport,
  tryStaticDemoManifestSummary,
  tryStaticDemoPipelineTimeline,
  tryStaticDemoRunDetail,
} from "@/lib/operator-static-demo";
import { resolveReviewOutcomeCounts } from "@/lib/review-outcome-counts";
import { isUsableGoldenManifestExportJson } from "@/lib/export-markdown";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import type {
  ArtifactDescriptor,
  ManifestSummary,
  PipelineTimelineItem,
  RunDetail,
  RunSummary,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

const sectionHeadingClass =
  "m-0 text-lg font-semibold tracking-tight text-neutral-900 border-b border-neutral-200 pb-2 dark:border-neutral-700 dark:text-neutral-100";

function ManifestSummarySection({
  manifestSummary,
  runExecution,
  buyerPolishedShell,
}: {
  readonly manifestSummary: ManifestSummary;
  readonly runExecution?: OperatorEvidenceLimitsExecutionProps | null;
  readonly buyerPolishedShell: boolean;
}): ReactElement {
  return (
    <section id="manifest-summary" className="scroll-mt-24 space-y-4">
      <Card>
        <CardHeader>
          <h3 className={sectionHeadingClass}>
            {buyerPolishedShell ? (
              <>Review package summary</>
            ) : (
              <>
                Review package summary (<GlossaryTooltip termKey="architecture_manifest">manifest</GlossaryTooltip>)
              </>
            )}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {manifestSummary.operatorSummary ? (
            <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {manifestSummary.operatorSummary}
            </p>
          ) : null}
          <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {manifestStatusForDisplay(manifestSummary.status)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Policy pack</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {policyPackBuyerLabel(manifestSummary.ruleSetId, manifestSummary.ruleSetVersion)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Decisions</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
              {finiteIntegerCountDisplay(manifestSummary.decisionCount)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Warnings</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
              {finiteIntegerCountDisplay(manifestSummary.warningCount)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Unresolved issues</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
              {finiteIntegerCountDisplay(manifestSummary.unresolvedIssueCount)}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <OperatorEvidenceLimitsFooter
        runId={manifestSummary.runId}
        execution={runExecution ?? null}
        showArchitectureReviewSummaryLink
      />
    </section>
  );
}

/** Server-rendered run detail page. Shows run metadata, authority chain, manifest summary, aggregate explanation, artifacts, and downloads. */
export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (demoRunUrlRequiresCanonicalRedirect(runId)) {
    redirect(`/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`);
  }

  let runDetailResponse: ApiResponseWithTrace<RunDetail> | null = null;
  let loadFailure: ApiLoadFailureState | null = null;
  let usedStaticDemoRun = false;

  try {
    runDetailResponse = await getRunDetail(runId);
  } catch (e) {
    const fallback = tryStaticDemoRunDetail(runId);

    if (fallback !== null) {
      runDetailResponse = { data: fallback, traceId: null };
      loadFailure = null;
      usedStaticDemoRun = true;
    } else {
      loadFailure = toApiLoadFailure(e);

      if (isApiNotFoundFailure(loadFailure)) {
        notFound();
      }
    }
  }

  if (loadFailure || !runDetailResponse) {
    const fallback =
      loadFailure?.message ?? "Review not found or could not be loaded.";

    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
          <OperatorApiProblem
            problem={loadFailure?.problem ?? null}
            fallbackMessage={fallback}
            correlationId={loadFailure?.correlationId ?? null}
          />
          <p>
            <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
              ← Back to reviews
            </Link>
          </p>
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  let envelope = coerceRunDetail(runDetailResponse.data);

  if (!envelope.ok) {
    const staticDetail = tryStaticDemoRunDetail(runId);

    if (staticDetail !== null) {
      runDetailResponse = { data: staticDetail, traceId: runDetailResponse.traceId };
      envelope = coerceRunDetail(staticDetail);
      usedStaticDemoRun = true;
    }
  }

  if (!envelope.ok) {
    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
          <OperatorMalformedCallout>
            <strong>Review detail response was not usable.</strong>
            <p className="mt-2">{envelope.message}</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              The review record could not be displayed. Try reloading.
            </p>
          </OperatorMalformedCallout>
          <p>
            <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
              ← Back to reviews
            </Link>
          </p>
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  const resolvedDetail = envelope.value;

  let canShowCompareReviewButton = false;

  try {
    const projectRuns = await listRunsByProject(resolvedDetail.run.projectId, 2);

    canShowCompareReviewButton = projectRuns.length >= 2;
  } catch {
    canShowCompareReviewButton = false;
  }

  const buyerPolishedArtifactTable = isBuyerPolishedOperatorShellEnv();
  const manifestId = resolvedDetail.run.goldenManifestId;
  let goldenManifestJsonForExport: unknown | null = null;

  if (isUsableGoldenManifestExportJson(resolvedDetail.goldenManifest)) {
    goldenManifestJsonForExport = resolvedDetail.goldenManifest;
  } else if (usedStaticDemoRun) {
    goldenManifestJsonForExport = tryStaticDemoGoldenManifestJsonForExport(runId);
  }

  const runDetailTraceId = runDetailResponse.traceId;

  let progressInitialSummary: RunSummary | null = null;

  try {
    progressInitialSummary = await getRunSummary(runId);
  } catch {
    progressInitialSummary = null;
  }

  const pipelineCompleteOnSummary = (s: RunSummary | null): boolean =>
    s !== null &&
    s.hasContextSnapshot === true &&
    s.hasGraphSnapshot === true &&
    s.hasFindingsSnapshot === true &&
    s.hasGoldenManifest === true;

  const progressForPipelineUi = effectiveRunSummaryForPipeline(progressInitialSummary, resolvedDetail);

  const showProgressTracker =
    !manifestId || !pipelineCompleteOnSummary(progressForPipelineUi);

  let manifestSummary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let manifestSummaryFailure: ApiLoadFailureState | null = null;
  let manifestSummaryMalformed: string | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let artifactsMalformed: string | null = null;
  let explanationSummary: RunExplanationSummary | null = null;
  let explanationFailure: ApiLoadFailureState | null = null;
  let pipelineTimeline: PipelineTimelineItem[] | null = null;
  let pipelineTimelineFailure: ApiLoadFailureState | null = null;

  try {
    pipelineTimeline = await getRunPipelineTimeline(runId);
  } catch (e) {
    pipelineTimelineFailure = toApiLoadFailure(e);

    if (usedStaticDemoRun) {
      const staticTimeline = tryStaticDemoPipelineTimeline(runId);

      if (staticTimeline !== null && staticTimeline.length > 0) {
        pipelineTimeline = staticTimeline;
        pipelineTimelineFailure = null;
      }
    }
  }

  if (pipelineTimeline === null || pipelineTimeline.length === 0) {
    const staticTimeline = tryStaticDemoPipelineTimeline(runId);

    if (staticTimeline !== null && staticTimeline.length > 0) {
      pipelineTimeline = staticTimeline;
      pipelineTimelineFailure = null;
    }
  }

  const pipelineTimelineForUi: PipelineTimelineItem[] | null = buyerPolishedArtifactTable
    ? pipelineTimeline?.filter((e) => isTimelineMilestoneEvent(e.eventType)) ?? null
    : pipelineTimeline;

  if (manifestId) {
    try {
      const rawSummary: unknown = await getManifestSummary(manifestId);
      const coercedSummary = coerceManifestSummary(rawSummary);

      if (!coercedSummary.ok) {
        manifestSummaryMalformed = coercedSummary.message;
      } else {
        manifestSummary = coercedSummary.value;
      }
    } catch (e) {
      manifestSummaryFailure = toApiLoadFailure(e);
      const staticSummary = tryStaticDemoManifestSummary(manifestId);

      if (staticSummary !== null) {
        manifestSummary = staticSummary;
        manifestSummaryFailure = null;
      }
    }

    try {
      const rawArtifacts: unknown = await listArtifacts(manifestId);
      const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

      if (!coercedArtifacts.ok) {
        artifacts = [];
        artifactsMalformed = coercedArtifacts.message;
      } else {
        artifacts = coercedArtifacts.items;
      }
    } catch (e) {
      artifactsFailure = toApiLoadFailure(e);
      const staticArtifacts = tryStaticDemoArtifacts(runId, manifestId);

      if (staticArtifacts !== null) {
        artifacts = staticArtifacts;
        artifactsFailure = null;
      }
    }

    try {
      explanationSummary = await getRunExplanationSummary(runId);
    } catch (e) {
      explanationFailure = toApiLoadFailure(e);
      const staticExplanation = tryStaticDemoExplanationSummary(runId);

      if (staticExplanation !== null) {
        explanationSummary = staticExplanation;
        explanationFailure = null;
      }
    }

    if (
      explanationSummary !== null &&
      explanationFailure === null &&
      (explanationSummary.findingCount ?? 0) === 0
    ) {
      const staticExplanation = tryStaticDemoExplanationSummary(runId);

      if (staticExplanation !== null && (staticExplanation.findingCount ?? 0) > 0) {
        explanationSummary = staticExplanation;
      }
    }
  }

  const buyerPolishedSections = buyerPolishedArtifactTable;

  const runDetailNavSections: RunDetailSection[] = buyerPolishedSections
    ? [
        { id: "manifest-summary", label: "Outcome", available: Boolean(manifestSummary) },
        { id: "trust-evidence", label: "Evidence", available: Boolean(resolvedDetail.trustEvidenceCard) },
        { id: "run-explanation", label: "Review narrative", available: Boolean(manifestId) },
        { id: "pipeline-timeline", label: "Activity", available: true },
        { id: "artifacts-exports", label: "Deliverables", available: Boolean(manifestId) },
      ]
    : [
        { id: "manifest-summary", label: "Manifest", available: Boolean(manifestSummary) },
        { id: "trust-evidence", label: "Evidence card", available: Boolean(resolvedDetail.trustEvidenceCard) },
        { id: "run-metadata", label: "Review", available: true },
        { id: "pipeline-timeline", label: "Timeline", available: true },
        { id: "authority-chain", label: "Review trail", available: true },
        { id: "artifacts-exports", label: "Artifacts", available: Boolean(manifestId) },
        { id: "run-explanation", label: "Explanation", available: Boolean(manifestId) },
        { id: "agent-forensics", label: "Diagnostics", available: true },
        { id: "run-actions", label: "Actions", available: true },
      ];

  const runSummaryForBadge = progressForPipelineUi;
  const descriptionTrimmed = resolvedDetail.run.description?.trim() ?? "";

  const { findingCountDisplay, warningCountDisplay } = resolveReviewOutcomeCounts({
    runId: resolvedDetail.run.runId,
    usedStaticDemoRun,
    explanationSummary,
    manifestSummary,
  });

  const manifestSummaryForUi: ManifestSummary | null =
    manifestSummary === null
      ? null
      : {
          ...manifestSummary,
          warningCount:
            typeof warningCountDisplay === "number" && Number.isFinite(warningCountDisplay)
              ? Math.trunc(warningCountDisplay)
              : manifestSummary.warningCount,
        };

  const headline = buyerPolishedArtifactTable
    ? buyerFacingReviewTitleFromSummary(resolvedDetail.run as RunSummary)
    : descriptionTrimmed.length > 0
      ? descriptionTrimmed
      : `Review ${resolvedDetail.run.runId}`;
  const createdLabel = formatInstantForLocale(resolvedDetail.run.createdUtc);

  const showPilotScorecardPackageCta =
    Boolean(manifestId) &&
    manifestSummary !== null &&
    isManifestCommittedForPilotScorecardPackage(manifestSummary);

  const governanceGateLabel =
    manifestSummary !== null ? governanceGateLabelFromManifestStatus(manifestSummary.status) : null;

  const sampleReviewPackageSummaryEl =
    usedStaticDemoRun ? (
      <SampleReviewPackageSummary
        runId={resolvedDetail.run.runId}
        manifestId={manifestId}
        artifactCount={artifacts.length}
        findingCount={findingCountDisplay}
      />
    ) : null;

  const explanationSection =
    manifestId !== null ? (
      <section id="run-explanation" className="scroll-mt-24">
        <CollapsibleSection
          title={buyerPolishedArtifactTable ? "Findings & review narrative" : "Architecture review summary"}
          defaultOpen={buyerPolishedArtifactTable}
        >
          {explanationFailure && (
            <>
              <p className="m-0 mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Aggregate explanation could not be loaded.
              </p>
              <OperatorApiProblem
                problem={explanationFailure.problem}
                fallbackMessage={explanationFailure.message}
                correlationId={explanationFailure.correlationId}
                variant="warning"
              />
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                The review and manifest loaded, but the explanation aggregate request failed (HTTP / transport / 404).
              </p>
              <OperatorSectionRetryButton label="Retry loading explanation" />
            </>
          )}
          {!explanationFailure && (
            <>
              <RunExplanationSection
                summary={explanationSummary}
                loading={false}
                error={null}
                runId={runId}
                displayFindingCount={findingCountDisplay}
              />
              {(() => {
                const traceRows =
                  explanationSummary?.findingTraceConfidences ??
                  explanationSummary?.explanation?.findingTraceConfidences ??
                  [];

                if (traceRows.length === 0) {
                  return null;
                }

                return <RunFindingExplainabilityTable runId={runId} rows={traceRows} />;
              })()}
            </>
          )}
        </CollapsibleSection>
      </section>
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 sm:px-0">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
          Reviews
        </Link>
        {" · "}
        <span className="font-medium text-neutral-800 dark:text-neutral-200" aria-current="page">
          {headline}
        </span>
      </nav>

      {usedStaticDemoRun ? <OperatorDemoStaticBanner /> : null}

      <RunDetailPageHeader
        runSummary={runSummaryForBadge}
        runId={resolvedDetail.run.runId}
        headline={headline}
        hasGoldenManifest={Boolean(manifestId)}
        executionFlavorBuyerSummary={resolvedDetail.executionFlavorBuyerSummary}
      />

      {usedStaticDemoRun && !buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {buyerPolishedArtifactTable && manifestId ? (
        <Card className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Sponsor-ready view
            </CardTitle>
            <CardDescription>
              Concise executive summary and outcomes. Start here for a board-ready view before sharing deliverables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Button type="button" variant="primary" asChild>
              <Link href={`/executive/reviews/${encodeURIComponent(resolvedDetail.run.runId)}`}>
                Open executive view
              </Link>
            </Button>
            <p className="m-0">
              <Link
                href="#manifest-summary"
                className="text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
              >
                or view manifest summary →
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <RunDetailOutcomeCards
        runId={resolvedDetail.run.runId}
        manifestId={manifestId}
        artifactCount={artifacts.length}
        findingCountDisplay={findingCountDisplay}
        warningCountDisplay={warningCountDisplay}
        hasGoldenManifest={Boolean(manifestId)}
        unresolvedIssueCountDisplay={manifestSummary?.unresolvedIssueCount ?? null}
        aggregateRiskPosture={explanationSummary?.riskPosture ?? null}
        governanceGateLabel={governanceGateLabel}
      />

      {usedStaticDemoRun && buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {showProgressTracker ? (
        <RunProgressTracker runId={runId} initialSummary={progressForPipelineUi} />
      ) : null}

      <RunDetailSectionNav sections={runDetailNavSections} />

      {manifestId && resolvedDetail.trustEvidenceCard ? (
        <RunTrustEvidenceCardSection card={resolvedDetail.trustEvidenceCard} />
      ) : null}

      {manifestId && manifestSummaryForUi ? (
        <ManifestSummarySection
          manifestSummary={manifestSummaryForUi}
          buyerPolishedShell={buyerPolishedArtifactTable}
          runExecution={{
            realModeFellBackToSimulator: resolvedDetail.run.realModeFellBackToSimulator,
            pilotAoaiDeploymentSnapshot: resolvedDetail.run.pilotAoaiDeploymentSnapshot ?? null,
          }}
        />
      ) : null}

      {buyerPolishedArtifactTable ? explanationSection : null}

      {buyerPolishedArtifactTable ? null : (
        <section id="run-metadata" className="scroll-mt-24">
          <Card>
            <CardHeader>
              <h3 className={sectionHeadingClass}>Review</h3>
              <CardDescription>
                Manifest summary and artifacts appear below when <GlossaryTooltip termKey="run">this review</GlossaryTooltip>{" "}
                has a <GlossaryTooltip termKey="golden_manifest">reviewed manifest</GlossaryTooltip> (after finalization).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
              <RunTraceViewerLink traceId={runDetailTraceId} />
              {resolvedDetail.run.otelTraceId ? (
                <p className="m-0">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">Creation trace:</span>{" "}
                  <RunTraceViewerLink traceId={resolvedDetail.run.otelTraceId} />
                </p>
              ) : null}
              <p className="m-0">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Description:</span>{" "}
                {resolvedDetail.run.description ?? ""}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      <section id="pipeline-timeline" className="scroll-mt-24" aria-labelledby="pipeline-timeline-title">
        <Card>
          <CardHeader>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 id="pipeline-timeline-title" className={sectionHeadingClass}>
                {buyerPolishedArtifactTable ? "Review activity timeline" : "Pipeline timeline"}
              </h3>
              <ContextualHelp helpKey="run-pipeline-status" placement="right" />
            </div>
            <CardDescription>
              {buyerPolishedArtifactTable ? (
                <>
                  Major milestones only — granular events and timestamps live in the{" "}
                  <Link
                    className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                    href={`/audit?runId=${encodeURIComponent(runId)}`}
                  >
                    {BUYER_SURFACE_VOCABULARY.auditTrail}
                  </Link>
                  .
                </>
              ) : (
                "Audit events for this review, oldest first."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineTimelineFailure ? (
              <>
                <AuthorityPipelineTimeline
                  items={null}
                  loadErrorMessage={pipelineTimelineFailure.message}
                  omitEventTechnicalDetails={buyerPolishedArtifactTable}
                />
                <OperatorSectionRetryButton label="Retry loading timeline" />
              </>
            ) : (
              <AuthorityPipelineTimeline
                items={pipelineTimelineForUi}
                omitEventTechnicalDetails={buyerPolishedArtifactTable}
              />
            )}
            {buyerPolishedArtifactTable &&
            !pipelineTimelineFailure &&
            pipelineTimelineForUi !== null &&
            pipelineTimelineForUi.length > 0 &&
            pipelineTimelineForUi.length < 3 ? (
              <p className="m-0 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                For the full {BUYER_SURFACE_VOCABULARY.auditTrail.toLowerCase()} with every pipeline event, open{" "}
                <Link
                  className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                  href={`/audit?runId=${encodeURIComponent(runId)}`}
                >
                  {BUYER_SURFACE_VOCABULARY.auditTrail}
                </Link>
                .
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {!buyerPolishedArtifactTable ? (
      <section id="authority-chain" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <h3 className={sectionHeadingClass}>Review trail</h3>
            <CardDescription>
              The reviewed manifest anchors the authoritative record. Recent pipeline milestones summarize how snapshots converged toward finalization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                <GlossaryTooltip termKey="golden_manifest">Reviewed manifest</GlossaryTooltip>
              </p>
              <div className="mt-2 min-w-0">
                {manifestId ? (
                  <>
                    <Link
                      className="inline-block text-sm font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                      href={`/manifests/${encodeURIComponent(manifestId)}`}
                    >
                      Finalized Architecture Manifest
                    </Link>
                  </>
                ) : (
                  <span className="font-mono text-xs">—</span>
                )}
              </div>
            </div>

            <CollapsibleSection title="Audit identifiers" defaultOpen={false}>
              <ol className="m-0 list-none space-y-0 divide-y divide-neutral-200 p-0 dark:divide-neutral-800">
                {manifestId ? (
                  <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      Reviewed manifest id
                    </span>
                    <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                      <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {manifestId}
                      </code>
                      <CopyIdButton value={manifestId} aria-label="Copy reviewed manifest ID" />
                    </span>
                  </li>
                ) : null}
                <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    <GlossaryTooltip termKey="context_snapshot">Context snapshot</GlossaryTooltip>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {resolvedDetail.run.contextSnapshotId ?? "—"}
                    </code>
                    {resolvedDetail.run.contextSnapshotId ? (
                      <CopyIdButton value={resolvedDetail.run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                    ) : null}
                  </span>
                </li>
                <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Graph snapshot
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {resolvedDetail.run.graphSnapshotId ?? "—"}
                    </code>
                    {resolvedDetail.run.graphSnapshotId ? (
                      <CopyIdButton value={resolvedDetail.run.graphSnapshotId} aria-label="Copy graph snapshot ID" />
                    ) : null}
                  </span>
                </li>
                <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Findings snapshot
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {resolvedDetail.run.findingsSnapshotId ?? "—"}
                    </code>
                    {resolvedDetail.run.findingsSnapshotId ? (
                      <CopyIdButton value={resolvedDetail.run.findingsSnapshotId} aria-label="Copy findings snapshot ID" />
                    ) : null}
                  </span>
                </li>
                <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    <GlossaryTooltip termKey="decision_trace">Decision trace</GlossaryTooltip>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {resolvedDetail.run.decisionTraceId ?? "—"}
                    </code>
                    {resolvedDetail.run.decisionTraceId ? (
                      <CopyIdButton value={resolvedDetail.run.decisionTraceId} aria-label="Copy decision trace ID" />
                    ) : null}
                  </span>
                </li>
                <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    <GlossaryTooltip termKey="artifact_bundle">Artifact bundle</GlossaryTooltip>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {resolvedDetail.run.artifactBundleId ?? "—"}
                    </code>
                    {resolvedDetail.run.artifactBundleId ? (
                      <CopyIdButton value={resolvedDetail.run.artifactBundleId} aria-label="Copy artifact bundle ID" />
                    ) : null}
                  </span>
                </li>
              </ol>
            </CollapsibleSection>
          </CardContent>
        </Card>
      </section>
      ) : null}

      {!manifestId && (
        <OperatorEmptyState title="Review package not ready yet">
          <p className="m-0">
            This architecture review has not been finalized yet. After the pipeline completes and you finalize, the{" "}
            <GlossaryTooltip termKey="golden_manifest">manifest</GlossaryTooltip>, artifacts, and exports will appear here.
          </p>
        </OperatorEmptyState>
      )}

      {manifestSummaryFailure && (
        <div className="space-y-2">
          <p className="m-0 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Manifest summary could not be loaded.
          </p>
          <OperatorApiProblem
            problem={manifestSummaryFailure.problem}
            fallbackMessage={manifestSummaryFailure.message}
            correlationId={manifestSummaryFailure.correlationId}
            variant="warning"
          />
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            This is a failed request (HTTP / transport / 404), not a malformed JSON body.
          </p>
          <OperatorSectionRetryButton label="Retry loading manifest summary" />
        </div>
      )}

      {manifestSummaryMalformed && (
        <OperatorMalformedCallout>
          <strong>Manifest summary response was not usable.</strong>
          <p className="mt-2">{manifestSummaryMalformed}</p>
        </OperatorMalformedCallout>
      )}

      {manifestId ? (
        <PostCommitRetentionRail
          runId={runId}
          showCompareCta={canShowCompareReviewButton}
          buyerShowcaseQuickLinks={usedStaticDemoRun}
          goldenManifestId={manifestId}
        />
      ) : null}

      {manifestId && (
        <section id="artifacts-exports" className="scroll-mt-24">
          <div className="relative overflow-visible pr-9 sm:pr-10">
            <div className="absolute end-0 top-0 z-10 sm:end-1 sm:top-1">
              <ContextualHelp helpKey="manifest-review" placement="left" />
            </div>
            <CollapsibleSection
              title={buyerPolishedArtifactTable ? "Deliverables by audience" : "Artifacts & exports"}
              defaultOpen
            >
              {buyerPolishedArtifactTable ? (
                <p className="m-0 mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <strong>Sponsor:</strong> executive summary and scorecard exports.{" "}
                  <strong>Architecture review board:</strong> decision package and manifest bundle.{" "}
                  <strong>Audit / compliance:</strong> traceability and review exports via{" "}
                  <strong>More export options</strong>. Optional operator tooling sits in{" "}
                  <strong>Advanced — package technical detail</strong> below.
                </p>
              ) : null}
              {artifactsFailure && (
                <>
                  <p className="m-0 mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {buyerPolishedArtifactTable
                      ? "Deliverables list could not be loaded."
                      : "Artifact list could not be loaded."}
                  </p>
                  <OperatorApiProblem
                    problem={artifactsFailure.problem}
                    fallbackMessage={artifactsFailure.message}
                    correlationId={artifactsFailure.correlationId}
                    variant="warning"
                  />
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {buyerPolishedArtifactTable ? (
                      <>
                        Try reloading, or return to the review. You can still use{" "}
                        <strong>Download review package</strong> when the bundle is available.
                      </>
                    ) : (
                      <>
                        The artifacts request failed (network, 404, or server error)—distinct from an empty list or
                        malformed JSON.
                      </>
                    )}
                  </p>
                  <OperatorSectionRetryButton
                    label={buyerPolishedArtifactTable ? "Retry loading deliverables" : "Retry loading artifacts"}
                  />
                </>
              )}

              {!artifactsFailure && artifactsMalformed && (
                <>
                  <OperatorMalformedCallout>
                    <strong>
                      {buyerPolishedArtifactTable
                        ? "Deliverables response was not usable."
                        : "Artifact list response was not usable."}
                    </strong>
                    <p className="mt-2">{artifactsMalformed}</p>
                  </OperatorMalformedCallout>
                  <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                    {buyerPolishedArtifactTable
                      ? "Try reloading, or return to the review. ZIP download may still work."
                      : "Try reloading, or return to the review detail page. Bundle download may still work."}
                  </p>
                </>
              )}

              {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 && (
                <OperatorEmptyState
                  title={
                    buyerPolishedArtifactTable ? "No deliverables listed yet" : "No artifacts for this manifest"
                  }
                >
                  <p className="m-0">
                    {buyerPolishedArtifactTable ? (
                      <>
                        The review loaded, but no individual files are listed yet. Try the ZIP if your workspace
                        publishes a bundle for this review.
                      </>
                    ) : (
                      <>
                        The manifest exists but the artifact descriptor list is empty (valid empty result).
                        Bundle ZIP may return 404 when there is no bundle; review export may still include other
                        files.
                      </>
                    )}
                  </p>
                </OperatorEmptyState>
              )}

              {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 && (
                <ArtifactListTable
                  manifestId={manifestId}
                  artifacts={artifacts}
                  runId={resolvedDetail.run.runId}
                  sponsorMode={buyerPolishedArtifactTable}
                  audienceSections={buyerPolishedArtifactTable}
                />
              )}

              <div className="mt-4 flex flex-col gap-3">
                {buyerPolishedArtifactTable ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm" asChild>
                      <FunnelTelemetryExportAnchor href={getBundleDownloadUrl(manifestId)}>
                        Download review package
                      </FunnelTelemetryExportAnchor>
                    </Button>
                    <GoldenManifestExportMenu
                      runId={resolvedDetail.run.runId}
                      manifestId={manifestId}
                      goldenManifestJson={goldenManifestJsonForExport}
                      manifestSummary={manifestSummaryForUi ?? manifestSummary}
                      trustEvidenceCard={resolvedDetail.trustEvidenceCard ?? null}
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <GoldenManifestExportMenu
                      runId={resolvedDetail.run.runId}
                      manifestId={manifestId}
                      goldenManifestJson={goldenManifestJsonForExport}
                      manifestSummary={manifestSummaryForUi ?? manifestSummary}
                      trustEvidenceCard={resolvedDetail.trustEvidenceCard ?? null}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <FunnelTelemetryExportAnchor href={getBundleDownloadUrl(manifestId)}>
                        Download bundle (ZIP)
                      </FunnelTelemetryExportAnchor>
                    </Button>
                  </div>
                )}
                {buyerPolishedArtifactTable ? (
                  <details className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
                    <summary className="cursor-pointer select-none text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      More export options
                    </summary>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <FunnelTelemetryExportAnchor href={getRunExportDownloadUrl(resolvedDetail.run.runId)}>
                          Download review export (ZIP)
                        </FunnelTelemetryExportAnchor>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <FunnelTelemetryExportAnchor href={getTraceabilityBundleDownloadUrl(resolvedDetail.run.runId)}>
                          Download audit package (ZIP)
                        </FunnelTelemetryExportAnchor>
                      </Button>
                      {canShowCompareReviewButton ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/compare?leftRunId=${encodeURIComponent(resolvedDetail.run.runId)}`}
                            className="no-underline"
                          >
                            Compare with another review
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" className="text-teal-800 dark:text-teal-300" asChild>
                        <Link href={`/ask?runId=${encodeURIComponent(resolvedDetail.run.runId)}`}>
                          Ask about this review
                        </Link>
                      </Button>
                    </div>
                  </details>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <FunnelTelemetryExportAnchor href={getRunExportDownloadUrl(resolvedDetail.run.runId)}>
                        Download review export (ZIP)
                      </FunnelTelemetryExportAnchor>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/compare?leftRunId=${encodeURIComponent(resolvedDetail.run.runId)}`}
                        className={buyerPolishedArtifactTable ? "no-underline" : undefined}
                      >
                        Compare with another review
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-teal-800 dark:text-teal-300" asChild>
                      <Link href={`/ask?runId=${encodeURIComponent(resolvedDetail.run.runId)}`}>
                        Ask about this review
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        </section>
      )}

      {!buyerPolishedArtifactTable ? explanationSection : null}

      {showPilotScorecardPackageCta && buyerPolishedArtifactTable && manifestId ? (
        <CollapsibleSection title="Sponsor briefing package" defaultOpen={false}>
          <EmailRunToSponsorBanner runId={runId} manifestId={manifestId} curatedSampleRun={usedStaticDemoRun} />
        </CollapsibleSection>
      ) : null}
      {showPilotScorecardPackageCta && !buyerPolishedArtifactTable && manifestId ? (
        <EmailRunToSponsorBanner runId={runId} manifestId={manifestId} curatedSampleRun={usedStaticDemoRun} />
      ) : null}

      {manifestId && <BeforeAfterDeltaPanel variant="inline" runId={runId} />}

      {buyerPolishedArtifactTable && manifestId ? (
        <section id="advanced-analysis" className="scroll-mt-24">
          <CollapsibleSection title="Advanced — package technical detail" defaultOpen={false}>
            <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
          </CollapsibleSection>
        </section>
      ) : null}

      {!buyerPolishedArtifactTable && manifestId ? (
        <section id="advanced-analysis" className="scroll-mt-24">
          <CollapsibleSection title="Deep dive (technical analysis)" defaultOpen={false}>
            <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
          </CollapsibleSection>
        </section>
      ) : null}

      {!buyerPolishedArtifactTable ? <RunAgentForensicsSection runId={runId} /> : null}

      {!buyerPolishedArtifactTable ? (
        <section id="run-actions" className="scroll-mt-24">
          <Card>
            <CardHeader>
              <h3 className={sectionHeadingClass}>Actions</h3>
              <CardDescription>
                <>
                  Exports and sponsor-facing bundles sit in <strong>Deliverables & exports</strong> above. Use this card
                  for scorecard generation, traceability ZIP, and optional compare shortcuts.
                </>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {manifestId ? <GenerateSponsorValueReportButton /> : null}
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" asChild>
                  <FunnelTelemetryExportAnchor href={getTraceabilityBundleDownloadUrl(resolvedDetail.run.runId)}>
                    Download traceability bundle (ZIP)
                  </FunnelTelemetryExportAnchor>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/compare?leftRunId=${encodeURIComponent(resolvedDetail.run.runId)}`}>
                    Compare two reviews (baseline = this review)
                  </Link>
                </Button>
                {manifestId ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/executive/reviews/${encodeURIComponent(resolvedDetail.run.runId)}`}>
                      Open executive view
                    </Link>
                  </Button>
                ) : null}
              </div>
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="#agent-forensics">
                  Pipeline diagnostics
                </Link>
                {" — "}
                optional detail for operators troubleshooting pipeline steps.
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <>
          <div className="flex items-center gap-3 pt-2">
            <hr className="flex-1 border-neutral-200 dark:border-neutral-700" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Technical reference
            </span>
            <hr className="flex-1 border-neutral-200 dark:border-neutral-700" />
          </div>

          <RunDetailTechnicalIdentifiersSection
            runId={resolvedDetail.run.runId}
            projectId={resolvedDetail.run.projectId}
            createdLabel={createdLabel}
            buyerPolishedShell={false}
          />
        </>
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <CollapsibleSection title="Pipeline tools (operator)" defaultOpen={false}>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/replay?runId=${encodeURIComponent(resolvedDetail.run.runId)}`}>Replay this review</Link>
            </Button>
          </div>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
