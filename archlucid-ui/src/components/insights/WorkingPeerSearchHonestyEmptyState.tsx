"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { buildSystemNotJobWorkingPeerSearchHonestyEmpty } from "@/lib/system-not-job-search-bound-to-open-package";

/** Working peer search honesty — workspace console, not desk verb (SN-026 / ADR 0079). */
export function WorkingPeerSearchHonestyEmptyState(): React.JSX.Element {
  const preset = buildSystemNotJobWorkingPeerSearchHonestyEmpty();

  return <EnterpriseCompactEmptyState {...preset} />;
}
