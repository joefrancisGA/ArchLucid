"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { getPilotScorecard } from "@/lib/api";
import {
  areArchitectureScorecardAssumptionsComplete,
  architectureScorecardAssumptionFieldErrors,
  buildArchitectureScorecardRoiPreview,
  parseArchitectureScorecardRoiAssumptions,
  type ArchitectureScorecardAssumptionFieldErrors,
  type ArchitectureScorecardRoiPreview,
} from "@/lib/architecture/architecture-scorecard-roi-preview";
import { formatUsd } from "@/lib/roi-assumptions";
import { buildExecutiveServerSavingsSummary, resolveRunSavingsUsd } from "@/lib/roi-resolution-priority";
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

export function usePilotScorecardPage(loaded: PilotScorecardPageServerLoad): UsePilotScorecardPageModel {
  const canExecute = useOperateCapability();
  const initialFields = baselineFieldsFromData(loaded.data);

  const [data, setData] = useState<PilotScorecardJson | null>(loaded.data);
  // Stamp only after a successful client refresh so a failed load cannot imply SSR data is current.
  const [metricsAsOfUtc, setMetricsAsOfUtc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(loaded.error);
  const [hours, setHours] = useState(initialFields.hours);
  const [reviews, setReviews] = useState(initialFields.reviews);
  const [rate, setRate] = useState(initialFields.rate);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);

    try {
      // Browser proxy scope (localStorage/cookie mirror) — must refresh on mount so SSR
      // empty payloads do not stick when the operator's active workspace has finalized reviews.
      const json = await getPilotScorecard();
      setData(json);
      setMetricsAsOfUtc(new Date().toISOString());

      if (json.baselines) {
        setHours(json.baselines.baselineHoursPerReview?.toString() ?? "");
        setReviews(json.baselines.baselineReviewsPerQuarter?.toString() ?? "");
        setRate(json.baselines.baselineArchitectHourlyCost?.toString() ?? "");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load scorecard.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    setError(null);

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

      await load();
      showSuccess("ROI assumptions saved.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }, [canSaveAssumptions, hours, load, rate, reviews]);

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
      serverSummary: buildExecutiveServerSavingsSummary(
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
