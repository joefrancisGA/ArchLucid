import { GOVERNANCE_ADVISORY_SCANS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_RUN_ID_PARAM = "runId";
export const ADVISORY_SCANS_COMPARE_TO_PARAM = "compareTo";
export const ADVISORY_SCANS_SAMPLE_PARAM = "sample";

export function parseAdvisoryScansRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAdvisoryScansCompareToFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAdvisoryScansSamplePreviewFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScansFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly runId?: string;
    readonly compareToRunId?: string;
    readonly showSamplePreview?: boolean;
  },
  pathname: string = GOVERNANCE_ADVISORY_SCANS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.runId !== undefined) {
    const trimmed = patch.runId.trim();

    if (trimmed.length === 0) {
      params.delete(ADVISORY_SCANS_RUN_ID_PARAM);
    } else {
      params.set(ADVISORY_SCANS_RUN_ID_PARAM, trimmed);
    }
  }

  if (patch.compareToRunId !== undefined) {
    const trimmed = patch.compareToRunId.trim();

    if (trimmed.length === 0) {
      params.delete(ADVISORY_SCANS_COMPARE_TO_PARAM);
    } else {
      params.set(ADVISORY_SCANS_COMPARE_TO_PARAM, trimmed);
    }
  }

  if (patch.showSamplePreview !== undefined) {
    if (!patch.showSamplePreview) {
      params.delete(ADVISORY_SCANS_SAMPLE_PARAM);
    } else {
      params.set(ADVISORY_SCANS_SAMPLE_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
