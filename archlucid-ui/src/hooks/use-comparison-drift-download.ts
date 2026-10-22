"use client";

import { downloadComparisonDriftReport } from "@/lib/api/comparison-drift-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { comparisonDriftReportBlockedReason } from "@/lib/compare/comparison-drift-blocked-reason";
import { useCallback, useState } from "react";

type UseComparisonDriftDownloadOptions = {
  readonly comparisonRecordId: string;
};

/** Wave-60 suggestion 714: fail-closed comparison drift report download with blocked-reason surfacing. */
export function useComparisonDriftDownload(options: UseComparisonDriftDownloadOptions) {
  const comparisonRecordId = options.comparisonRecordId.trim();
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const blockedReason = comparisonDriftReportBlockedReason(failure);

  const download = useCallback(
    async (format: "markdown" | "html" | "docx" = "markdown") => {
      if (comparisonRecordId.length === 0) {
        return;
      }

      setLoading(true);
      setFailure(null);

      try {
        await downloadComparisonDriftReport({ comparisonRecordId, format });
      } catch (error: unknown) {
        setFailure(toApiLoadFailure(error));
      } finally {
        setLoading(false);
      }
    },
    [comparisonRecordId],
  );

  return {
    download,
    loading,
    failure,
    blockedReason,
  };
}
