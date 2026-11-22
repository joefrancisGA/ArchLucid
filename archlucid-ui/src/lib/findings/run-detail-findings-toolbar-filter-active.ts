import type { RunDetailFindingsFilterKind } from "@/components/findings/run-detail-findings-toolbar-presentation";
import { DEFAULT_FINDING_JOB_VIEW, type FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";

export function runDetailFindingsToolbarFilterActive(input: {
  readonly filter: RunDetailFindingsFilterKind;
  readonly jobView: FindingJobView;
  readonly searchQuery: string;
  readonly ownerFilter: string;
  readonly domainFilter: string;
  readonly originFilter: FindingOriginFilter;
  readonly groundingFilter: FindingGroundingFilter;
}): boolean {
  if (input.filter !== "all") {
    return true;
  }
  if (input.jobView !== DEFAULT_FINDING_JOB_VIEW) {
    return true;
  }
  if (input.searchQuery.trim().length > 0) {
    return true;
  }
  if (input.ownerFilter.trim().length > 0) {
    return true;
  }
  if (input.domainFilter.trim().length > 0) {
    return true;
  }
  if (input.originFilter !== "all") {
    return true;
  }
  if (input.groundingFilter !== "all") {
    return true;
  }
  return false;
}
