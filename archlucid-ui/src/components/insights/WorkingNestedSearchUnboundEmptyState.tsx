"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildSystemNotJobWorkingNestedSearchUnboundEmpty } from "@/lib/system-not-job-search-bound-to-open-package";

export type WorkingNestedSearchUnboundEmptyStateProps = {
  readonly architectureId: string;
  readonly architectureDisplayName?: string | null;
};

/** Working nested search empty state when no sealed review is bound (SN-026 / ADR 0079). */
export function WorkingNestedSearchUnboundEmptyState(
  props: WorkingNestedSearchUnboundEmptyStateProps,
): React.JSX.Element {
  const preset = buildSystemNotJobWorkingNestedSearchUnboundEmpty({
    architectureId: props.architectureId,
    architectureDisplayName: props.architectureDisplayName,
  });

  return <EnterpriseCompactEmptyState {...preset} />;
}
