"use client";

import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, readBuyerCtoDemoStoryId } from "@/lib/buyer-cto-demo-tour";
import { findCtoDemoStory } from "@/lib/buyer-cto-demo-story-registry";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readOperatorScopeFromStorage } from "@/lib/operator-scope-storage";
import { SHOWCASE_DEMO_TENANT_NAME } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

export type TenantWorkspaceBoundaryBadgeProps = {
  readonly variant?: "header" | "compact";
};

function resolveLiveTenantLabel(): string {
  const scope = readOperatorScopeFromStorage();

  if (scope !== null && scope.tenantId.trim().length > 0) {
    return scope.tenantId.trim();
  }

  return "Your tenant";
}

export function TenantWorkspaceBoundaryBadge(props: TenantWorkspaceBoundaryBadgeProps): React.JSX.Element | null {
  const { variant = "header" } = props;
  const [workspaceName, setWorkspaceName] = useState("Healthcare");
  const demoMode = isBuyerPolishedOperatorShellEnv();
  const tenantName = demoMode ? SHOWCASE_DEMO_TENANT_NAME : resolveLiveTenantLabel();
  const tooltip = `Tenant: ${tenantName} · Workspace: ${workspaceName}`;

  useEffect(() => {
    function refreshWorkspace(): void {
      const story = findCtoDemoStory(readBuyerCtoDemoStoryId());

      setWorkspaceName(story?.label ?? "Default");
    }

    refreshWorkspace();
    window.addEventListener(ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, refreshWorkspace);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, refreshWorkspace);
    };
  }, []);

  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700"
            data-testid="tenant-workspace-boundary-badge-compact"
            tabIndex={0}
          >
            <Building2 className="h-4 w-4 text-neutral-600 dark:text-neutral-400" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[200px] items-center gap-1 truncate rounded-full border border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.badge,
        "text-neutral-600 dark:text-neutral-400",
      )}
      data-testid="tenant-workspace-boundary-badge"
      title={tooltip}
    >
      <Building2 className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">
        Tenant: {tenantName} · Workspace: {workspaceName}
      </span>
    </span>
  );
}
