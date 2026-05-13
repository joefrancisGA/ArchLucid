"use client";

import { useCallback, useEffect, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";

import type { PilotScorecardJson } from "./pilot-scorecard-json";

export type UsePilotScorecardPageModel = {
  canExecute: boolean;
  data: PilotScorecardJson | null;
  error: string | null;
  hours: string;
  onSaveBaselines: () => Promise<void>;
  rate: string;
  reviews: string;
  saving: boolean;
  setHours: (next: string) => void;
  setRate: (next: string) => void;
  setReviews: (next: string) => void;
};

export function usePilotScorecardPage(): UsePilotScorecardPageModel {
  const canExecute = useOperateCapability();
  const [data, setData] = useState<PilotScorecardJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [reviews, setReviews] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);

    try {
      const res = await fetch("/api/proxy/v1/pilots/scorecard", { headers: { Accept: "application/json" } });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = (await res.json()) as PilotScorecardJson;
      setData(json);

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

  const onSaveBaselines = useCallback(async () => {
    if (!canExecute) {
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [canExecute, hours, load, rate, reviews]);

  return {
    canExecute,
    data,
    error,
    hours,
    onSaveBaselines,
    rate,
    reviews,
    saving,
    setHours,
    setRate,
    setReviews,
  };
}
