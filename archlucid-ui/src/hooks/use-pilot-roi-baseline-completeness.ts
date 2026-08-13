"use client";

import { useCallback, useEffect, useState } from "react";

import { AUTH_MODE } from "@/lib/auth-config";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type TenantBaselineRoiGatePayload = {
  baselineReviewCycleHours?: unknown;
  manualPrepHoursPerReview?: unknown;
};

export type UsePilotRoiBaselineCompletenessOptions = {
  /**
   * When false, skip the mount fetch until `reload()` runs (wizard launcher host only needs on-demand refresh).
   * @default true
   */
  readonly enabled?: boolean;
};

/** Loads `/v1/tenant/baseline` for sponsor ROI readiness gates (review-cycle + manual prep anchors). */
export function usePilotRoiBaselineCompleteness(
  options: UsePilotRoiBaselineCompletenessOptions = {},
): {
  loading: boolean;
  complete: boolean | null;
  reload: () => void;
} {
  const enabled = options.enabled !== false;
  const [loading, setLoading] = useState(enabled);
  const [complete, setComplete] = useState<boolean | null>(null);

  const reload = useCallback(async () => {
    if (isNextPublicDemoMode()) {
      setComplete(true);
      setLoading(false);

      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setComplete(null);
      setLoading(false);

      return;
    }

    setLoading(true);

    try {
      const headers = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const baselineRes = await fetch("/api/proxy/v1/tenant/baseline", headers);

      if (!baselineRes.ok) {
        setComplete(null);

        return;
      }

      const baselineJson = (await baselineRes.json()) as TenantBaselineRoiGatePayload;

      setComplete(
        isPilotRoiBaselineComplete({
          baselineReviewCycleHours: baselineJson.baselineReviewCycleHours,
          manualPrepHoursPerReview: baselineJson.manualPrepHoursPerReview,
        }),
      );
    } catch {
      setComplete(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void reload();
  }, [enabled, reload]);

  return { loading, complete, reload };
}
