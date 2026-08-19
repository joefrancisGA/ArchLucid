"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { usePilotScorecardQuery } from "@/hooks/use-pilot-scorecard-query";
import {
  areArchitectureScorecardAssumptionsComplete,
  architectureScorecardAssumptionFieldErrors,
  buildArchitectureScorecardRoiPreview,
  parseArchitectureScorecardRoiAssumptions,
  type ArchitectureScorecardAssumptionFieldErrors,
  type ArchitectureScorecardRoiPreview,
} from "@/lib/architecture/architecture-scorecard-roi-preview";
import { formatUsd } from "@/lib/roi-assumptions";
import { buildSponsorServerSavingsSummary, resolveRunSavingsUsd } from "@/lib/roi-resolution-priority";
import { showError, showSuccess } from "@/lib/toast";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import type { PilotScorecardPageServerLoad } from "./load-pilot-scorecard-page-data";

export type UsePilotScorecardPageModel = {
  assumptionsComplete: boolean;
  assumptionsDirty: boolean;
  canExecute: boolean;
  canSaveAssumptions: boolean;
  data: PilotScorecardJson | null;
  error: string | null;
  fieldErrors: ArchitectureScorecardAssumptionFieldErrors;
  hours: string;
  livePreview: ArchitectureScorecardRoiPreview | null;
  onSaveBaselines: () => Promise<void>;
  rate: string;
  reviews: string;
  saving: boolean;
  setHours: (next: string) => void;
  setRate: (next: string) => void;
  setReviews: (next: string) => void;
  metricsAsOfUtc: string | null;
  resolvedAnnualSavingsLabel: string | null;
  resolvedQuarterlySavingsLabel: string | null;
  resolvedStatusQuoCostLabel: string | null;
};

function baselineFieldsFromData(data: PilotScorecardJson | null): { hours: string; reviews: string; rate: string } {
  if (data?.baselines === null || data?.baselines === undefined) {
    return { hours: "", reviews: "", rate: "" };
  }

  return {
    hours: data.baselines.baselineHoursPerReview?.toString() ?? "",
    reviews: data.baselines.baselineReviewsPerQuarter?.toString() ?? "",
    rate: data.baselines.baselineArchitectHourlyCost?.toString() ?? "",
  };
}

function fieldsMatchBaselines(
  hours: string,
  reviews: string,
  rate: string,
  data: PilotScorecardJson | null,
): boolean {
  const saved = baselineFieldsFromData(data);

  return hours.trim() === saved.hours.trim() && reviews.trim() === saved.reviews.trim() && rate.trim() === saved.rate.trim();
}

function syncBaselineFieldsFromScorecard(json: PilotScorecardJson): { hours: string; reviews: string; rate: string } {
  if (!json.baselines) {
    return { hours: "", reviews: "", rate: "" };
  }

  return {
    hours: json.baselines.baselineHoursPerReview?.toString() ?? "",
    reviews: json.baselines.baselineReviewsPerQuarter?.toString() ?? "",
    rate: json.baselines.baselineArchitectHourlyCost?.toString() ?? "",
  };
}

export function usePilotScorecardPage(loaded: PilotScorecardPageServerLoad): UsePilotScorecardPageModel {
  const canExecute = useOperateCapability();
  const initialFields = baselineFieldsFromData(loaded.data);
  const scorecardQuery = usePilotScorecardQuery({
    initialData: loaded.data,
    throwOnError: true,
  });

  const [hours, setHours] = useState(initialFields.hours);
  const [reviews, setReviews] = useState(initialFields.reviews);
  const [rate, setRate] = useState(initialFields.rate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const data = scorecardQuery.data ?? null;
  const metricsAsOfUtc =
    scorecardQuery.dataUpdatedAt > 0 ? new Date(scorecardQuery.dataUpdatedAt).toISOString() : null;

  const queryError =
    scorecardQuery.isError
      ? scorecardQuery.error instanceof Error
        ? scorecardQuery.error.message
        : "Failed to load scorecard."
      : null;

  const error = saveError ?? queryError ?? loaded.error;

  useEffect(() => {
    if (scorecardQuery.data === undefined || data === null) {
      return;
    }

    const synced = syncBaselineFieldsFromScorecard(data);
    setHours(synced.hours);
    setReviews(synced.reviews);
    setRate(synced.rate);
  }, [scorecardQuery.dataUpdatedAt, data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash;

    if (hash !== "#roi-assumptions" && hash !== "#roi-baselines") {
      return;
    }

    const scrollToAssumptions = (): void => {
      document.getElementById("roi-assumptions")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = window.requestAnimationFrame(scrollToAssumptions);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [data]);

  const assumptionsComplete = areArchitectureScorecardAssumptionsComplete(hours, reviews, rate);
  const assumptionsDirty = !fieldsMatchBaselines(hours, reviews, rate, data);
  const fieldErrors = architectureScorecardAssumptionFieldErrors(hours, reviews, rate);
  const canSaveAssumptions = canExecute && assumptionsComplete && assumptionsDirty && !saving;

  const livePreview = useMemo(() => {
    const assumptions = parseArchitectureScorecardRoiAssumptions(hours, reviews, rate);

    if (assumptions === null) {
      return null;
    }

    return buildArchitectureScorecardRoiPreview(assumptions);
  }, [hours, rate, reviews]);

  const onSaveBaselines = useCallback(async () => {
    if (!canSaveAssumptions) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const body = {
        baselineHoursPerReview: hours.trim() === "" ? null : Number(hours),
        baselineReviewsPerQuarter: reviews.trim() === "" ? null : Number.parseInt(reviews, 10),
        baselineArchitectHourlyCost: rate.trim() === "" ? null : Number(rate),
      };
      const res = await fetch("/api/proxy/v1/pilots/scorecard/baselines", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        method: "PUT",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await scorecardQuery.refetch();
      showSuccess("ROI assumptions saved.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setSaveError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }, [canSaveAssumptions, hours, rate, reviews, scorecardQuery]);

  const resolvedQuarterlySavingsLabel = useMemo(() => {
    if (data?.roiEstimate === null || data?.roiEstimate === undefined) {
      return null;
    }

    const annual = data.roiEstimate.annualReviewSavingsFromReviewTimeLeverUsd;

    if (typeof annual !== "number" || !Number.isFinite(annual)) {
      return null;
    }

    return formatUsd(annual / 4);
  }, [data?.roiEstimate]);

  const resolvedAnnualSavingsLabel = useMemo(() => {
    if (data?.roiEstimate === null || data?.roiEstimate === undefined) {
      return null;
    }

    const resolved = resolveRunSavingsUsd({
      serverSummary: buildSponsorServerSavingsSummary(
        data.roiEstimate.annualReviewSavingsFromReviewTimeLeverUsd,
        `Model: ${data.roiEstimate.modelReference}`,
      ),
    });

    if (resolved === null) {
      return null;
    }

    return formatUsd(resolved.annualizedUsd);
  }, [data?.roiEstimate]);

  const resolvedStatusQuoCostLabel = useMemo(() => {
    if (data?.roiEstimate === null || data?.roiEstimate === undefined) {
      return null;
    }

    return formatUsd(data.roiEstimate.annualReviewCostStatusQuoUsd);
  }, [data?.roiEstimate]);

  return {
    assumptionsComplete,
    assumptionsDirty,
    canExecute,
    canSaveAssumptions,
    data,
    error,
    fieldErrors,
    hours,
    livePreview,
    onSaveBaselines,
    rate,
    reviews,
    metricsAsOfUtc,
    resolvedAnnualSavingsLabel,
    resolvedQuarterlySavingsLabel,
    resolvedStatusQuoCostLabel,
    saving,
    setHours,
    setRate,
    setReviews,
  };
}
