"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  resolveArchitectureIntelligenceBreadcrumbParent,
} from "@/lib/architecture/architecture-intelligence-page-copy";

/** Core review trail for Architecture intelligence (AIN). */
export function ArchitectureIntelligenceBreadcrumb(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const parent = resolveArchitectureIntelligenceBreadcrumbParent(isWorkingMode);

  return (
    <OperatorPageBreadcrumb
      data-testid="architecture-intelligence-breadcrumb"
      items={[
        {
          label: parent.label,
          href: parent.href,
        },
        { label: ARCHITECTURE_INTELLIGENCE_PAGE_TITLE },
      ]}
    />
  );
}
