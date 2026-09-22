"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildSystemNotJobWorkingAskPickArchitectureEmpty } from "@/lib/system-not-job-ask-bound-to-open-package";

/** Working peer Ask empty state when no architecture desk is open (SN-024 / ADR 0079). */
export function WorkingAskPickArchitectureEmptyState(): React.JSX.Element {
  const preset = buildSystemNotJobWorkingAskPickArchitectureEmpty();

  return <EnterpriseCompactEmptyState {...preset} />;
}
