"use client";

import { useEffect, useRef, useState } from "react";

import { createAndDownloadComparisonPdf } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { comparisonDocxMutationBlockedReason } from "@/lib/compare/comparison-docx-mutation-blocked-reason";
import { comparisonReplayMutationBlockedReason } from "@/lib/compare/comparison-replay-mutation-blocked-reason";
import { downloadArchitecturePackageDocx } from "@/lib/api/downloads-blob-trigger-architecture-package-docx";
import { buildCompareVerdictSummary } from "@/lib/build-compare-verdict-summary";
import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import {
  buildCompareNewFindingTrustLaneRows,
} from "@/lib/review-quality/compare-quality-delta";
import { useCompareGovernanceDiff } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff";
import { useCompareFindingCorrelation } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFindingCorrelation";
import { useCompareSemanticSupportBandDelta } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareSemanticSupportBandDelta";
import { useCompareRoiHeadlineDelta } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareRoiHeadlineDelta";
import { useCompareGateOutcomeDelta } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGateOutcomeDelta";
import { buildComparePackAssignmentDeltaView } from "@/lib/review-quality/compare-pack-assignment-delta";
import { buildCompareExecutionModeDeltaView } from "@/lib/review-quality/compare-execution-mode-delta";
import { useComparisonSearchQuery } from "@/hooks/use-comparison-search-query";
import { useComparisonDriftDownload } from "@/hooks/use-comparison-drift-download";
import type { CompareResultsPanelProps } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel";
import { COMPARE_LIVE_REGION_STALE_INPUTS_ANNOUNCEMENT } from "@/lib/architecture/compare-live-region-stale-inputs-copy";

export function useCompareResultsPanel(props: CompareResultsPanelProps) {
  const {
    showStaleInputsWarning,
    lastComparedPair,
    leftPickedSummary,
    rightPickedSummary,
    loading,
    leftTrim,
    rightTrim,
    aiLoading,
    golden,
    comparisonNarrative,
    buyerPolished = false,
  } = props;

  const summarizeCue = buyerPolished ? "Summarize for leadership" : "Summarize for sponsor";
  const resultsRegionRef = useRef<HTMLElement>(null);
  const lastAnnouncedPairRef = useRef<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfExportBlockedReason, setPdfExportBlockedReason] = useState<string | null>(null);
  const [docxDownloading, setDocxDownloading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [docxExportBlockedReason, setDocxExportBlockedReason] = useState<string | null>(null);

  const comparisonSearchQuery = useComparisonSearchQuery({
    query: {
      leftRunId: leftTrim,
      rightRunId: rightTrim,
      comparisonType: "end-to-end",
    },
    enabled: leftTrim.length > 0 && rightTrim.length > 0,
  });

  const comparisonRecordId = comparisonSearchQuery.data?.records?.[0]?.comparisonRecordId ?? "";
  const comparisonDriftDownload = useComparisonDriftDownload({ comparisonRecordId });
  const comparisonSearchBlockedReason = comparisonSearchQuery.blockedReason;
  const comparisonDriftBlockedReason = comparisonDriftDownload.blockedReason;

  const handleDownloadPdf = async () => {
    if (!lastComparedPair) return;
    setPdfDownloading(true);
    setPdfError(null);
    setPdfExportBlockedReason(null);
    try {
      await createAndDownloadComparisonPdf(lastComparedPair.left, lastComparedPair.right);
    } catch (e: unknown) {
      const failure = toApiLoadFailure(e);
      const blocked = comparisonReplayMutationBlockedReason(failure);
      setPdfExportBlockedReason(blocked);
      setPdfError(blocked ?? failure.message);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (golden === null) return;
    setDocxDownloading(true);
    setDocxError(null);
    setDocxExportBlockedReason(null);
    try {
      await downloadArchitecturePackageDocx(golden.baseRunId, golden.targetRunId, {
        includeComparisonExplanation: true,
      });
    } catch (e: unknown) {
      const failure = toApiLoadFailure(e);
      const blocked = comparisonDocxMutationBlockedReason(failure);
      setDocxExportBlockedReason(blocked);
      setDocxError(blocked ?? failure.message);
    } finally {
      setDocxDownloading(false);
    }
  };

  const showDocxDownload = golden !== null;

  const citeBaselineRunId = lastComparedPair?.left ?? leftTrim;
  const citeUpdatedRunId = lastComparedPair?.right ?? rightTrim;
  const showPairCiteStrip =
    props.hasResultsToNavigate && citeBaselineRunId.trim().length > 0 && citeUpdatedRunId.trim().length > 0;
  const executionModeHonesty = resolveCompareExecutionModeHonesty(leftPickedSummary, rightPickedSummary);
  const showExecutionModeHonesty =
    !showStaleInputsWarning &&
    props.hasResultsToNavigate &&
    citeBaselineRunId.trim().length > 0 &&
    citeUpdatedRunId.trim().length > 0 &&
    (leftPickedSummary !== null || rightPickedSummary !== null);

  const governanceDiffState = useCompareGovernanceDiff(
    golden !== null ? golden.baseRunId : null,
    golden !== null ? golden.targetRunId : null,
  );
  const findingCorrelationState = useCompareFindingCorrelation(
    golden !== null ? golden.baseRunId : null,
    golden !== null ? golden.targetRunId : null,
  );
  const semanticSupportBandDeltaState = useCompareSemanticSupportBandDelta({
    baselineRunId: golden?.baseRunId ?? null,
    targetRunId: golden?.targetRunId ?? null,
    baselineSummary: leftPickedSummary,
    targetSummary: rightPickedSummary,
  });
  const roiHeadlineDeltaState = useCompareRoiHeadlineDelta({
    baselineRunId: golden?.baseRunId ?? null,
    targetRunId: golden?.targetRunId ?? null,
  });
  const gateOutcomeDeltaState = useCompareGateOutcomeDelta({
    baselineRunId: golden?.baseRunId ?? null,
    targetRunId: golden?.targetRunId ?? null,
  });
  const packAssignmentDeltaView = buildComparePackAssignmentDeltaView(governanceDiffState.view);
  const trustExecutionModeHonesty = showStaleInputsWarning ? null : executionModeHonesty;
  const executionModeDeltaView = buildCompareExecutionModeDeltaView(trustExecutionModeHonesty);
  const newFindingTrustLanes =
    golden !== null ? buildCompareNewFindingTrustLaneRows(findingCorrelationState.lifecycleRecords) : [];
  const usesCurrentEffectiveOnly = governanceDiffState.view?.usesCurrentEffectiveOnly === true;
  const hasAiNarrative = comparisonNarrative !== null || props.aiExplanation !== null;
  const showLoadedComparisonChrome = golden !== null;
  const showTrustBanner = showLoadedComparisonChrome;
  const showVerdictSummary = showLoadedComparisonChrome;
  const verdictSummary = golden !== null ? buildCompareVerdictSummary(golden) : null;

  useEffect(() => {
    if (showStaleInputsWarning) {
      setLiveAnnouncement(COMPARE_LIVE_REGION_STALE_INPUTS_ANNOUNCEMENT);
      return;
    }
  }, [showStaleInputsWarning]);

  useEffect(() => {
    if (loading || verdictSummary === null || lastComparedPair === null) {
      return;
    }

    const pairKey = `${lastComparedPair.left}::${lastComparedPair.right}`;

    if (lastAnnouncedPairRef.current === pairKey) {
      return;
    }

    lastAnnouncedPairRef.current = pairKey;
    setLiveAnnouncement(`Comparison loaded. ${verdictSummary.totalChanges} total changes.`);

    window.requestAnimationFrame(() => {
      resultsRegionRef.current?.focus();
    });
  }, [loading, verdictSummary, lastComparedPair]);

  return {
    ...props,
    summarizeCue,
    resultsRegionRef,
    liveAnnouncement,
    pdfDownloading,
    pdfError,
    pdfExportBlockedReason,
    docxDownloading,
    docxError,
    docxExportBlockedReason,
    handleDownloadPdf,
    handleDownloadDocx,
    showDocxDownload,
    citeBaselineRunId,
    citeUpdatedRunId,
    showPairCiteStrip,
    showExecutionModeHonesty,
    governanceDiffState,
    findingCorrelationState,
    semanticSupportBandDeltaState,
    roiHeadlineDeltaState,
    gateOutcomeDeltaState,
    packAssignmentDeltaView,
    executionModeDeltaView,
    newFindingTrustLanes,
    usesCurrentEffectiveOnly,
    hasAiNarrative,
    showLoadedComparisonChrome,
    trustExecutionModeHonesty,
    showTrustBanner,
    showVerdictSummary,
    verdictSummary,
    comparisonSearchBlockedReason,
    comparisonDriftBlockedReason,
    comparisonDriftDownload,
  };
}

export type CompareResultsPanelViewModel = ReturnType<typeof useCompareResultsPanel>;
