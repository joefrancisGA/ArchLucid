"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
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

type BaselineFields = { hours: string; reviews: string; rate: string };

function baselineFieldsFromData(data: PilotScorecardJson | null): BaselineFields {
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
  saved: BaselineFields,
): boolean {
  return hours.trim() === saved.hours.trim() && reviews.trim() === saved.reviews.trim() && rate.trim() === saved.rate.trim();
}

export function usePilotScorecardPage(loaded: PilotScorecardPageServerLoad): UsePilotScorecardPageModel {
  const canExecute = useOperateCapability();
  const { tenantId, workspaceId, projectId } = useOperatorScopeQueryKey();
  const scope = `${tenantId}:${workspaceId}:${projectId}`;
  const scorecardQuery = usePilotScorecardQuery({
    initialData: loaded.data,
    throwOnError: true,
  });

  const [draft, setDraft] = useState<{ scope: string; fields: Partial<BaselineFields> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const data = scorecardQuery.data ?? null;
  const saved = baselineFieldsFromData(data);
  const edited = draft?.scope === scope ? draft.fields : undefined;
  const hours = edited?.hours ?? saved.hours;
  const reviews = edited?.reviews ?? saved.reviews;
  const rate = edited?.rate ?? saved.rate;

  function editBaseline(field: keyof BaselineFields, value: string): void {
    setDraft((current) => ({
      scope,
      fields: { ...(current?.scope === scope ? current.fields : undefined), [field]: value },
    }));
  }

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
  const assumptionsDirty = !fieldsMatchBaselines(hours, reviews, rate, saved);
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
        baselineReviewsPerQuarter: reviews.trim() === "" ? null : Number(reviews),
        baselineArchitectHourlyCost: rate.trim() === "" ? null : Number(rate),
      };
      const res = await fetch(
        "/api/proxy/v1/pilots/scorecard/baselines",
        mergeRegistrationScopeForProxy({
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          method: "PUT",
        }),
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const refreshed = await scorecardQuery.refetch();

      if (refreshed.isSuccess) {
        setDraft((current) => current === draft ? null : current);
      }

      showSuccess("ROI assumptions saved.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setSaveError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }, [canSaveAssumptions, draft, hours, rate, reviews, scorecardQuery]);

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
    setHours: (value) => editBaseline("hours", value),
    setRate: (value) => editBaseline("rate", value),
    setReviews: (value) => editBaseline("reviews", value),
  };
}
