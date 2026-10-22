"use client";

import { useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  buildSystemNotJobWorkingAskPickArchitectureEmpty,
  shouldShowSystemNotJobWorkingAskPortfolioBindEmpty,
} from "@/lib/system-not-job-ask-bound-to-open-package";

/** Portfolio honesty strip after unscoped Working Ask redirect (SN-024 / SY-37). */
export function ArchitecturesHubWorkingAskBindEmptyStrip(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();

  if (!workspaceMounted || !isWorkingMode) {
    return null;
  }

  const search = searchParams.toString();

  if (!shouldShowSystemNotJobWorkingAskPortfolioBindEmpty(search.length > 0 ? `?${search}` : "")) {
    return null;
  }

  const preset = buildSystemNotJobWorkingAskPickArchitectureEmpty();

  return <EnterpriseCompactEmptyState {...preset} />;
}
