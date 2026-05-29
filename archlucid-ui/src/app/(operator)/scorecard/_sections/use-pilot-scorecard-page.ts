"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { getPilotScorecard } from "@/lib/api";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

import type { PilotScorecardPageServerLoad } from "./load-pilot-scorecard-page-data";

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

export function usePilotScorecardPage(loaded: PilotScorecardPageServerLoad): UsePilotScorecardPageModel {
  const canExecute = useOperateCapability();
  const initialFields = baselineFieldsFromData(loaded.data);

  const [data, setData] = useState<PilotScorecardJson | null>(loaded.data);
  const [error, setError] = useState<string | null>(loaded.error);
  const [hours, setHours] = useState(initialFields.hours);
  const [reviews, setReviews] = useState(initialFields.reviews);
  const [rate, setRate] = useState(initialFields.rate);
  const [saving, setSaving] = useState(false);

  const skipMountRefetchRef = useRef(true);

  const load = useCallback(async () => {
    setError(null);

    try {
      const json = await getPilotScorecard();
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
    if (skipMountRefetchRef.current) {
      skipMountRefetchRef.current = false;

      return;
    }

    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#roi-baselines") {
      return;
    }

    const scrollToBaselines = (): void => {
      document.getElementById("roi-baselines")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = window.requestAnimationFrame(scrollToBaselines);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [data]);

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
