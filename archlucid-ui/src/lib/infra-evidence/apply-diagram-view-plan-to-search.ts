import {
  INFRA_DIAGRAMS_MODE_OPTIONS,
  infraDiagramsFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";
import type {
  ApplyDiagramViewPlanResult,
  DiagramViewPlan,
} from "@/lib/infra-evidence/diagram-view-plan-types";

const ALLOWED_MODES = new Set(INFRA_DIAGRAMS_MODE_OPTIONS.map((option) => option.value));

export function isDiagramViewPlanValid(plan: DiagramViewPlan | null | undefined): boolean {
  if (plan == null) {
    return false;
  }

  if (!ALLOWED_MODES.has(plan.mermaidMode)) {
    return false;
  }

  if (plan.mermaidMode === "resourceGroup" && (plan.resourceGroupName?.trim().length ?? 0) === 0) {
    return false;
  }

  if (plan.mermaidMode === "dependencyNeighborhood") {
    const hasSeed = (plan.seedNodeId?.trim().length ?? 0) > 0;
    const hasCloudResource = (plan.cloudResourceId?.trim().length ?? 0) > 0;

    if (!hasSeed && !hasCloudResource) {
      return false;
    }
  }

  return (plan.honestyLabel?.trim().length ?? 0) > 0;
}

export function applyDiagramViewPlanToSearch(
  currentSearch: string,
  plan: DiagramViewPlan,
): ApplyDiagramViewPlanResult {
  if (!isDiagramViewPlanValid(plan)) {
    return {
      href: infraDiagramsFilterHrefFromSearch(currentSearch, {}),
      error: "This view plan is not valid for the diagrams workbench.",
    };
  }

  const patch: {
    readonly mermaidMode?: string;
    readonly mermaidView?: string;
    readonly seedNodeId?: string;
    readonly snapshotId?: string;
    readonly cloudResourceId?: string;
  } = {
    mermaidMode: plan.mermaidMode,
    mermaidView: "",
    seedNodeId: "",
  };

  if ((plan.snapshotId?.trim().length ?? 0) > 0) {
    patch.snapshotId = plan.snapshotId!.trim();
  }

  if ((plan.cloudResourceId?.trim().length ?? 0) > 0) {
    patch.cloudResourceId = plan.cloudResourceId!.trim();
  }

  if (plan.mermaidMode === "resourceGroup" && plan.resourceGroupName != null) {
    patch.mermaidView = plan.resourceGroupName.trim();
  }

  if (plan.mermaidMode === "dependencyNeighborhood" && (plan.seedNodeId?.trim().length ?? 0) > 0) {
    patch.seedNodeId = plan.seedNodeId!.trim();
  }

  return {
    href: infraDiagramsFilterHrefFromSearch(currentSearch, patch),
    error: null,
  };
}
