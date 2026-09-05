"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { isEffectiveDevDefaultScope } from "@/lib/scope-switcher-display";

/** Neutral demo posture tag beside the workspace switcher on sample-workspace sessions. */
export function OperatorShellDemoWorkspaceTag(): React.JSX.Element | null {
  const scope = useOperatorScopeRecord();

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
