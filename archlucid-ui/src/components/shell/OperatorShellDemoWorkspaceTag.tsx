"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { useIsSampleWorkspaceSession } from "@/hooks/use-effective-operator-scope";
import { isSecureNowDemoChromeExcluded } from "@/lib/product-line/securenow-cloud-platform-policy";

/** Neutral demo posture tag beside the workspace switcher on sample-workspace sessions (ArchLucid evaluation shell only). */
export function OperatorShellDemoWorkspaceTag(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const isSampleWorkspace = useIsSampleWorkspaceSession();

  if (isSecureNowDemoChromeExcluded(productLine)) {
    return null;
  }

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
