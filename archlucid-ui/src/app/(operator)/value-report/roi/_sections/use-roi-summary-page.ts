"use client";

import { useCallback, useEffect, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { isApiRequestError } from "@/lib/api-request-error";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";

import { rollingBoundsForRoiSummary } from "./roi-summary-page-helpers";
import type { RoiSummaryPageState } from "./roi-summary-page-types";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

export function useRoiSummaryPage(): RoiSummaryPageViewModel {
  const rank = useNavCallerAuthorityRank();
  const isAdmin = rank >= AUTHORITY_RANK.AdminAuthority;
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [state, setState] = useState<RoiSummaryPageState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const b30 = rollingBoundsForRoiSummary(30);

    try {
      const pilotReport = await fetchPilotValueReportJson(null, b30.toUtc);

      const [rollingReport, rollingBlocks, pilotBlocks] = await Promise.all([
        fetchPilotValueReportJson(b30.fromUtc, b30.toUtc),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: b30.fromUtc,
          toUtcIso: b30.toUtc,
        }),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: pilotReport.fromUtc,
          toUtcIso: pilotReport.toUtc,
        }),
      ]);

      setState({
        status: "ready",
        rolling30: { report: rollingReport, blocks: rollingBlocks },
        pilotToDate: { report: pilotReport, blocks: pilotBlocks },
      });
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setState({
          status: "error",
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load ROI summary.",
          problem: null,
          correlationId: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (demo) {
      return;
    }

    void load();
  }, [demo, load]);

  return {
    demo,
    isAdmin,
    state,
    load,
  };
}
