"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildSystemNotJobWorkingGraphPickArchitectureEmpty } from "@/lib/system-not-job-graph-bound-to-open-package";

/** Working peer Evidence graph empty state when no architecture desk is open (SN-025 / ADR 0079). */
export function WorkingGraphPickArchitectureEmptyState(): React.JSX.Element {
  const preset = buildSystemNotJobWorkingGraphPickArchitectureEmpty();

  return <EnterpriseCompactEmptyState {...preset} />;
}
