"use client";

import { useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { downloadValueReportDocx } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { buildAuthMeProxyRequestInit } from "@/lib/current-principal";
import { DEFAULT_DEV_TENANT_ID } from "@/lib/scope-defaults";

const ME_PATH = "/api/proxy/api/auth/me";

async function resolveTenantIdFromMe(): Promise<string | null> {
  const init = await buildAuthMeProxyRequestInit();
  const res = await fetch(ME_PATH, init);

  if (!res.ok) return null;

  const body: unknown = await res.json();

  if (typeof body !== "object" || body === null || !("claims" in body)) return null;

  const claims = (body as { claims?: ReadonlyArray<{ type: string; value: string }> }).claims;
  const row = claims?.find((c) => c.type === "tenant_id");

  return row?.value?.trim() ?? null;
}

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
      const tenantId = (await resolveTenantIdFromMe()) ?? DEFAULT_DEV_TENANT_ID;
      const to = new Date();
      const from = new Date(to);

      from.setUTCDate(from.getUTCDate() - 30);

      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      await downloadValueReportDocx(tenantId, fromIso, toIso);
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
      <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Sponsor collateral</p>
      {roiBaselineLoading ? (
        <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">Checking ROI baseline posture…</p>
      ) : blockRoiExport ? (
        <p className="m-0 text-xs font-medium text-amber-800 dark:text-amber-200">
          Capture tenant ROI baselines (review-cycle hours + manual preparation hours) before generating sponsor DOCX — use Settings → Baseline or the guided ROI baseline wizard on operator home.
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
