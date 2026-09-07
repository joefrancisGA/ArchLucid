"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";

import { comparePickerFootnote } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { useCompareFinalizedRunAvailability } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { resolveArchitectureCompareSiblingDefaults } from "@/lib/architecture/resolve-architecture-compare-defaults";
import {
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export function useCompareFormRunSelection(options: {
  readonly syncSelectionToUrlRef: RefObject<(priorRunId: string, laterRunId: string) => void>;
}) {
  const { syncSelectionToUrlRef } = options;
  const searchParams = useSearchParams();
  const initialUrlPair = readCompareRunIdsFromSearchParams(searchParams);
  const [leftRunId, setLeftRunId] = useState(initialUrlPair.prior);
  const [rightRunId, setRightRunId] = useState(initialUrlPair.later);
  const [leftPickedSummary, setLeftPickedSummary] = useState<RunSummary | null>(null);
  const [rightPickedSummary, setRightPickedSummary] = useState<RunSummary | null>(null);

  const handleLeftRunIdChange = useCallback(
    (runId: string) => {
      setLeftRunId(runId);
      syncSelectionToUrlRef.current(runId, rightRunId);
    },
    [rightRunId, syncSelectionToUrlRef],
  );

  const handleRightRunIdChange = useCallback(
    (runId: string) => {
      setRightRunId(runId);
      syncSelectionToUrlRef.current(leftRunId, runId);
    },
    [leftRunId, syncSelectionToUrlRef],
  );

  useEffect(() => {
    setLeftPickedSummary((prev) => {
      if (prev === null) {
        return null;
      }

      if (canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(leftRunId.trim()).toLowerCase()) {
        return null;
      }

      return prev;
    });
  }, [leftRunId]);

  useEffect(() => {
    setRightPickedSummary((prev) => {
      if (prev === null) {
        return null;
      }

      if (canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(rightRunId.trim()).toLowerCase()) {
        return null;
      }

      return prev;
    });
  }, [rightRunId]);

  const evalChrome = useProductionEvalChrome();
  const leftTrim = leftRunId.trim();
  const rightTrim = rightRunId.trim();
  const sameCanonicalRunIdsBlocked = compareRunIdsAreSameAfterDemoCanonicalization(leftTrim, rightTrim);
  const leftFootnote = comparePickerFootnote(leftTrim, leftPickedSummary);
  const rightFootnote = comparePickerFootnote(rightTrim, rightPickedSummary);
  const isDemoClaimsIntakeComparePair =
    evalChrome &&
    isStaticDemoPayloadFallbackEnabled() &&
    leftTrim === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID &&
    rightTrim === SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID;
  const architectureId = searchParams?.get("architectureId")?.trim() ?? "";
  const architectureQuery = useArchitectureIdentityQuery(architectureId, architectureId.length > 0);
  const { finalizedCount, insufficientForCompare } = useCompareFinalizedRunAvailability({
    architectureId: architectureId.length > 0 ? architectureId : undefined,
  });
  const buyerPolished = evalChrome;

  useEffect(() => {
    if (architectureId.length === 0 || architectureQuery.data === undefined) {
      return;
    }

    const siblingDefaults = resolveArchitectureCompareSiblingDefaults({
      architectureId,
      reviews: architectureQuery.data.reviews,
      baseRunId: leftRunId.length > 0 ? leftRunId : rightRunId,
    });

    if (siblingDefaults === null) {
      return;
    }

    if (leftRunId.trim().length === 0 && rightRunId.trim().length === 0) {
      setLeftRunId(siblingDefaults.priorRunId);
      setRightRunId(siblingDefaults.laterRunId);
      syncSelectionToUrlRef.current(siblingDefaults.priorRunId, siblingDefaults.laterRunId);

      return;
    }

    if (leftRunId.trim().length > 0 && rightRunId.trim().length === 0) {
      setRightRunId(siblingDefaults.laterRunId);
      syncSelectionToUrlRef.current(leftRunId, siblingDefaults.laterRunId);
    }
  }, [
    architectureId,
    architectureQuery.data,
    leftRunId,
    rightRunId,
    syncSelectionToUrlRef,
  ]);

  const leftPickerLabel = isDemoClaimsIntakeComparePair ? "Baseline Claims Intake Review" : "Baseline review";
  const rightPickerLabel = isDemoClaimsIntakeComparePair ? "Updated Claims Intake Review" : "Updated review";

  const pickClaimsIntakePair = () => {
    setLeftRunId(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID);
    setRightRunId(SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
  };

  const urlComparePair = readCompareRunIdsFromSearchParams(searchParams);
  const urlPairComplete =
    urlComparePair.prior.trim().length > 0 && urlComparePair.later.trim().length > 0;
  const buyerCompareHasUrlPair = urlPairComplete;
  const hasPrefilledSelection = leftTrim.length > 0 || rightTrim.length > 0;

  const showRelatedReviewLinks =
    leftTrim.length > 0 || rightTrim.length > 0 || (evalChrome && isStaticDemoPayloadFallbackEnabled());

  return {
    leftRunId,
    rightRunId,
    setLeftRunId,
    setRightRunId,
    leftPickedSummary,
    rightPickedSummary,
    setLeftPickedSummary,
    setRightPickedSummary,
    handleLeftRunIdChange,
    handleRightRunIdChange,
    leftTrim,
    rightTrim,
    sameCanonicalRunIdsBlocked,
    leftFootnote,
    rightFootnote,
    isDemoClaimsIntakeComparePair,
    buyerPolished,
    finalizedCount,
    insufficientForCompare,
    leftPickerLabel,
    rightPickerLabel,
    pickClaimsIntakePair,
    urlPairComplete,
    buyerCompareHasUrlPair,
    hasPrefilledSelection,
    showRelatedReviewLinks,
  };
}
