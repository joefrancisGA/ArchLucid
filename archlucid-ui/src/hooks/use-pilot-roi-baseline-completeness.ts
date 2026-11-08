"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiGet } from "@/lib/api/http";
import { AUTH_MODE } from "@/lib/auth-config";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";
import type { components } from "@/lib/api-types.generated";

type TenantBaselineRoiGatePayload = Pick<
  components["schemas"]["TenantBaselineGetResponse"],
  "baselineReviewCycleHours" | "manualPrepHoursPerReview"
>;

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
  // Vitest tears down jsdom before late /v1/tenant/baseline rejections settle — skip setState then.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (isNextPublicDemoMode()) {
      if (mountedRef.current) {
        setComplete(true);
        setLoading(false);
      }

      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      if (mountedRef.current) {
        setComplete(null);
        setLoading(false);
      }

      return;
    }

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      const baselineJson = await apiGet<TenantBaselineRoiGatePayload>("/v1/tenant/baseline");

      if (!mountedRef.current) {
        return;
      }

      setComplete(
        isPilotRoiBaselineComplete({
          baselineReviewCycleHours: baselineJson.baselineReviewCycleHours,
          manualPrepHoursPerReview: baselineJson.manualPrepHoursPerReview,
        }),
      );
    } catch {
      if (mountedRef.current) {
        setComplete(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
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
