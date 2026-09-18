"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { isSecureNowDemoChromeExcluded } from "@/lib/product-line/securenow-cloud-platform-policy";
import { isEffectiveDevDefaultScope } from "@/lib/scope-switcher-display";

/** Neutral demo posture tag beside the workspace switcher on sample-workspace sessions (ArchLucid evaluation shell only). */
export function OperatorShellDemoWorkspaceTag(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const scope = useOperatorScopeRecord();

  if (isSecureNowDemoChromeExcluded(productLine)) {
    return null;
  }

  if (scope === null) {
    return null;
  }

  const isSampleWorkspace = isEffectiveDevDefaultScope(scope.workspaceId, scope.projectId);

  if (!isSampleWorkspace) {
    return null;
  }

  return (
    <StatusTag
      kind="neutral"
      label="Demo workspace"
      className="shrink-0"
      data-testid="operator-shell-demo-workspace-tag"
    />
  );
}
