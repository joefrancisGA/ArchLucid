"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { showError, showSuccess } from "@/lib/toast";

type TenantBaselineGet = {
  manualPrepHoursPerReview: number | null;
  peoplePerReview: number | null;
  capturedUtc: string | null;
  baselineReviewCycleHours: number | null;
  baselineReviewCycleSource: string | null;
  baselineReviewCycleCapturedUtc: string | null;
};

function parseNumberOrNull(raw: string): number | null {
  const t = raw.trim();

  if (t.length === 0) {
    return null;
  }

  const n = Number(t);

  if (!Number.isFinite(n)) {
    return Number.NaN;
  }

  return n;
}

/** Strip persisted operator markers so operators see only human prose (mirrors backend formatters). */

function formatBaselineReviewSourceNoteDisplay(source: string | null | undefined): string | null {
  if (source === null || source === undefined) {
    return null;
  }

  const t = source.trim();

  if (t.length === 0) {
    return null;
  }

  const marker = "baseline_settings";

  if (t.toLowerCase() === marker) {
    return null;
  }

  const prefix = `${marker}:`;

  if (t.toLowerCase().startsWith(prefix)) {
    const tail = t.slice(prefix.length).trim();

    return tail.length === 0 ? null : tail;
  }

  return t;
}

/** Client UI for ROI baseline measurement fields (loads/saves `/v1/tenant/baseline` via proxy). */

export function BaselineSettingsClient() {
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualPrep, setManualPrep] = useState("");
  const [people, setPeople] = useState("");
  const [reviewHours, setReviewHours] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const demoMode = isNextPublicDemoMode();

  const load = useCallback(async () => {
    if (demoMode) {
      return;
    }

    setLoading(true);
    setLoadFailure(null);

    try {
      const res = await fetch("/api/proxy/v1/tenant/baseline", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const t = await res.text();

        throw { status: res.status, body: t };
      }

      const data = (await res.json()) as TenantBaselineGet;

      setManualPrep(
        data.manualPrepHoursPerReview != null && Number.isFinite(data.manualPrepHoursPerReview)
          ? String(data.manualPrepHoursPerReview)
          : "",
      );
      setPeople(
        data.peoplePerReview != null && Number.isFinite(data.peoplePerReview) ? String(data.peoplePerReview) : "",
      );
      setReviewHours(
        data.baselineReviewCycleHours != null && Number.isFinite(data.baselineReviewCycleHours)
          ? String(data.baselineReviewCycleHours)
          : "",
      );

      const tailNote = formatBaselineReviewSourceNoteDisplay(data.baselineReviewCycleSource);

      setReviewNote(tailNote ?? "");
    } catch (e) {
      setLoadFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      setLoading(false);

      return;
    }

    void load();
  }, [demoMode, load]);

  async function onSave(e: FormEvent): Promise<void> {
    e.preventDefault();

    if (demoMode) {
      return;
    }

    setSaving(true);

    try {
      const prepN = parseNumberOrNull(manualPrep);

      if (Number.isNaN(prepN)) {
        showError("Baseline", "Manual preparation hours must be a number (or leave blank).");

        return;
      }

      if (prepN != null && (prepN <= 0 || prepN > 10_000)) {
        showError("Baseline", "Manual preparation hours must be between 0 and 10,000 (exclusive of zero) when set.");

        return;
      }

      const peopleN = parseNumberOrNull(people);

      if (Number.isNaN(peopleN)) {
        showError("Baseline", "People per review must be a number (or leave blank).");

        return;
      }

      if (peopleN != null && (peopleN <= 0 || peopleN > 10_000)) {
        showError("Baseline", "People per review must be between 1 and 10,000 when set.");

        return;
      }

      const reviewTrim = reviewHours.trim();

      let reviewParsed: number | null = null;

      if (reviewTrim.length > 0) {
        reviewParsed = parseNumberOrNull(reviewTrim);

        if (Number.isNaN(reviewParsed)) {
          showError("Baseline", "Median review-cycle hours must be a number.");

          return;
        }

        if (reviewParsed === null || reviewParsed <= 0 || reviewParsed > 10_000) {
          showError("Baseline", "Median review-cycle hours must be between 0 and 10,000 (exclusive of zero).");

          return;
        }

        if (reviewNote.trim().length > 500) {
          showError("Baseline", "Review-cycle estimate note must be 500 characters or fewer.");

          return;
        }
      }

      const payload: Record<string, unknown> = {
        manualPrepHoursPerReview: manualPrep.trim() === "" ? null : prepN,
        peoplePerReview: people.trim() === "" ? null : peopleN,
      };

      if (reviewTrim.length > 0 && reviewParsed !== null) {
        payload.baselineReviewCycleHours = reviewParsed;
        payload.baselineReviewCycleSourceNote = reviewNote.trim().length === 0 ? null : reviewNote.trim();
      }

      const res = await fetch("/api/proxy/v1/tenant/baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        let detail = t;

        try {
          const p = JSON.parse(t) as { detail?: string };

          if (typeof p.detail === "string") {
            detail = p.detail;
          }
        } catch {
          /* ignore */
        }

        showError("Baseline", detail || `Request failed (${res.status})`);

        return;
      }

      showSuccess("Baseline settings saved.");
      await load();
    } catch (err) {
      showError("Baseline", err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Baseline settings — ROI measurement</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          These fields tighten the &quot;before&quot; anchor for your value reports. If you skip them, we use conservative
          model defaults. You can update them at any time.
        </p>
        {!demoMode ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="baseline-open-guided-wizard"
              onClick={() => {
                window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
              }}
            >
              Open guided baseline wizard
            </Button>
          </div>
        ) : null}
      </div>
      {demoMode ? (
        <DemoUnavailableNotice
          title="Baseline settings"
          description="ROI baseline measurement requires a connected deployment and tenant API access."
        />
      ) : null}
      {!demoMode && loadFailure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={loadFailure.problem}
            fallbackMessage={loadFailure.message}
            correlationId={loadFailure.correlationId}
          />
        </div>
      ) : null}
      {!demoMode && loading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
      ) : !demoMode ? (
        <form onSubmit={onSave} className="space-y-4">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300">
            <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-100">Review-cycle anchor</p>
            <p className="m-0 mt-1 leading-relaxed">
              Median hours from architecture request to a reviewable package — surfaced automatically in sponsor exports when measured deltas exist.
            </p>
          </div>

          <div>
            <Label htmlFor="baseline-review-cycle-hours">Median review-cycle hours (optional)</Label>

            <Input
              id="baseline-review-cycle-hours"
              type="number"
              min={0}
              step="any"
              className="mt-1"
              data-testid="baseline-review-cycle-hours"
              value={reviewHours}
              onChange={(x) => setReviewHours(x.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="baseline-review-cycle-note">How you estimated review-cycle hours (optional)</Label>

            <textarea
              id="baseline-review-cycle-note"
              className="mt-1 min-h-[64px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none ring-teal-500/40 placeholder:text-neutral-400 focus-visible:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
              maxLength={500}
              data-testid="baseline-review-cycle-note"
              value={reviewNote}
              onChange={(x) => setReviewNote(x.target.value)}
              placeholder="Team workshop median, intake telemetry…"
            />
          </div>

          <div>
            <Label htmlFor="baseline-prep">Manual preparation hours per review (optional)</Label>

            <Input
              id="baseline-prep"
              type="number"
              min={0}
              step="any"
              className="mt-1"
              data-testid="baseline-manual-prep"
              value={manualPrep}
              onChange={(x) => setManualPrep(x.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="baseline-people">People involved per review (optional)</Label>

            <Input
              id="baseline-people"
              type="number"
              min={0}
              step="1"
              className="mt-1"
              data-testid="baseline-people"
              value={people}
              onChange={(x) => setPeople(x.target.value)}
            />
          </div>

          <div>
            <Button type="submit" disabled={saving} variant="primary" data-testid="baseline-save">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
