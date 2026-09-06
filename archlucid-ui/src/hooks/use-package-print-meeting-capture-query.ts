"use client";

import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resolvePackagePrintTransparencyTrail } from "@/lib/reviews/resolve-package-print-transparency-trail";
import {
  resolveReviewMeetingCaptureEntries,
  type ReviewMeetingCaptureEntry,
} from "@/lib/reviews/review-meeting-capture-export";

type UsePackagePrintMeetingCaptureQueryOptions = {
  readonly enabled?: boolean;
};

export type PackagePrintMeetingCaptureResult = {
  readonly entries: readonly ReviewMeetingCaptureEntry[];
};

/** Loads presenter room Q&A for the package print meeting-capture section (PC-09 optional). */
export function usePackagePrintMeetingCaptureQuery(
  runId: string,
  options?: UsePackagePrintMeetingCaptureQueryOptions,
) {
  const trimmed = runId.trim();

  return createOperatorQueryHook({
    queryKey: [...operatorQueryKeys.runSummary(trimmed), "package-print-meeting-capture"],
    queryFn: async (): Promise<PackagePrintMeetingCaptureResult> => {
      const response = await fetchRunDetailCriticalPageBundle(trimmed);
      const trail = await resolvePackagePrintTransparencyTrail(response.data);

      return {
        entries: resolveReviewMeetingCaptureEntries(trail),
      };
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
