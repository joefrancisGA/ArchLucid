"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { downloadValueReportDocx } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
/** One-click sponsor DOCX for the current scope (last 30 days UTC). */
export function GenerateSponsorValueReportButton() {
  const canMutate = useOperateCapability();
  const { loading: roiBaselineLoading, complete: roiBaselineComplete } = usePilotRoiBaselineCompleteness();
  const blockRoiExport = roiBaselineComplete === false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  async function onClick(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const to = new Date();
      const from = new Date(to);

      from.setUTCDate(from.getUTCDate() - 30);

      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      await downloadValueReportDocx(fromIso, toIso);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not generate value report.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!canMutate) {
    return null;
  }

  return (
    <div className="max-w-xl space-y-2">
      <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>Sponsor collateral</p>
      {roiBaselineLoading ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Checking ROI baseline posture…</p>
      ) : blockRoiExport ? (
        <p className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
          Capture tenant ROI baselines (review-cycle hours + manual preparation hours) before generating sponsor DOCX — use Settings → Baseline or the guided ROI baseline wizard on operator home.
        </p>
      ) : null}
      {!blockRoiExport && !roiBaselineLoading ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          DOCX includes ROI narrative claim gate (PASS/WARN/HOLD), estimate basis, and execution-mode caveats per tenant
          scope — hours and dollars are estimates, not savings guarantees.
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={busy || blockRoiExport}
        title={
          blockRoiExport
            ? "Tenant ROI baselines must be captured before generating sponsor-ready DOCX exports."
            : "Generate a sponsor-ready DOCX for the current scope."
        }
        onClick={() => void onClick()}
      >
        {busy ? "Generating…" : "Generate sponsor report"}
      </Button>
      <LongOperationWaitNotice
        active={busy}
        operationLabel="Generating sponsor report"
        stageLabel="Building DOCX export"
        testId="sponsor-report-long-wait"
      />
      {error ? (
        <OperatorApiProblem
          problem={error.problem}
          fallbackMessage={error.message}
          correlationId={error.correlationId}
          variant="warning"
        />
      ) : null}
    </div>
  );
}
