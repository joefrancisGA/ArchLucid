"use client";

import { useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  buildSystemNotJobWorkingGraphPickArchitectureEmpty,
  shouldShowSystemNotJobWorkingGraphPortfolioBindEmpty,
} from "@/lib/system-not-job-graph-bound-to-open-package";

/** Portfolio honesty strip after unscoped Working Evidence graph redirect (SN-025 / SY-41). */
export function ArchitecturesHubWorkingGraphBindEmptyStrip(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();

  if (!workspaceMounted || !isWorkingMode) {
    return null;
  }

  const search = searchParams.toString();

  if (!shouldShowSystemNotJobWorkingGraphPortfolioBindEmpty(search.length > 0 ? `?${search}` : "")) {
    return null;
  }

  const preset = buildSystemNotJobWorkingGraphPickArchitectureEmpty();

  return <EnterpriseCompactEmptyState {...preset} />;
}
