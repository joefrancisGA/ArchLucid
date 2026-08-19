"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/StatusTag";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  defaultLabelsForScopeIds,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  SCOPE_HELP_CURRENT_SCOPE_PANEL_TITLE,
  SCOPE_HELP_CURRENT_SCOPE_SWITCHING_AVAILABLE,
  SCOPE_HELP_CURRENT_SCOPE_SWITCHING_UNAVAILABLE,
} from "@/lib/scope-help-evidence-copy";
import {
  formatScopeSwitcherTriggerLabel,
  isEffectiveDevDefaultScope,
  isScopeSwitchingAvailable,
  type ScopeSwitcherWorkspaceOption,
} from "@/lib/scope-switcher-display";
import { mapTenantWorkspaceToScopeSwitcherOption } from "@/lib/scope-switcher-workspace-from-tenant";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { BUYER_WORKSPACE_DISPLAY_NAME } from "@/lib/buyer/buyer-polish-copy";
import { cn } from "@/lib/utils";

function demoClaimsIntakeWorkspaceOption(): ScopeSwitcherWorkspaceOption {
  return {
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    name: BUYER_WORKSPACE_DISPLAY_NAME,
    projects: [{ projectId: DEV_SCOPE_PROJECT_ID, name: "Primary project" }],
  };
}

/** Live tenant, workspace, and project readout for `/help/scope`. */
export function ScopeHelpCurrentScopePanel(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [scopeTick, setScopeTick] = useState(0);

  const refreshScopeTick = useCallback(() => {
    setScopeTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeTick);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshScopeTick);
    };
  }, [refreshScopeTick]);

  const { workspaceId, projectId } = scope;
  const stored = useMemo(() => {
    void scopeTick;

    return readOperatorScopeFromStorage();
  }, [scopeTick]);

  const { workspaceLabel, projectLabel } = useMemo(() => {
    const defaults = defaultLabelsForScopeIds(workspaceId, projectId);

    if (stored === null) {
      return { workspaceLabel: defaults.workspace, projectLabel: defaults.project };
    }

    const workspace =
      stored.workspaceLabel.length > 0 ? stored.workspaceLabel : defaults.workspace;
    const project = stored.projectLabel.length > 0 ? stored.projectLabel : defaults.project;

    return { workspaceLabel: workspace, projectLabel: project };
  }, [stored, workspaceId, projectId]);

  const tenantContext = useMemo(() => {
    void scopeTick;

    return readActiveTenantContext(isBuyerPolishedOperatorShellEnv());
  }, [scopeTick]);

  const isSampleWorkspaceSession = isEffectiveDevDefaultScope(workspaceId, projectId);
  const workspacesQuery = useTenantWorkspacesListQuery({ enabled: !isSampleWorkspaceSession });
  const workspaces = useMemo((): ScopeSwitcherWorkspaceOption[] | null => {
    if (isSampleWorkspaceSession) {
      return [demoClaimsIntakeWorkspaceOption()];
    }

    if (workspacesQuery.isPending) {
      return null;
    }

    if (workspacesQuery.isError || workspacesQuery.data === undefined) {
      return [];
    }

    return workspacesQuery.data.workspaces.map(mapTenantWorkspaceToScopeSwitcherOption);
  }, [
    isSampleWorkspaceSession,
    workspacesQuery.data,
    workspacesQuery.isError,
    workspacesQuery.isPending,
  ]);
  const switcherLabel = formatScopeSwitcherTriggerLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession,
    includeProject: !isSampleWorkspaceSession,
  });
  const switchingAvailable = isScopeSwitchingAvailable(workspaces);

  return (
    <section
      className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")}
      data-testid="scope-help-current-scope-panel"
      aria-label={SCOPE_HELP_CURRENT_SCOPE_PANEL_TITLE}
    >
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SCOPE_HELP_CURRENT_SCOPE_PANEL_TITLE}</h2>
      <dl className="m-0 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Tenant</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="scope-help-current-tenant">
          {tenantContext.displayName}
        </dd>
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Workspace</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="scope-help-current-workspace">
          {workspaceLabel}
        </dd>
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Project</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="scope-help-current-project">
          {projectLabel}
        </dd>
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Top-bar label</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="scope-help-current-switcher-label">
          {switcherLabel}
        </dd>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind={isSampleWorkspaceSession ? "draft" : "ready"}
          label={isSampleWorkspaceSession ? "Sample" : "Connected"}
          data-testid="scope-help-current-scope-status"
        />
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="scope-help-switching-state">
          {switchingAvailable
            ? SCOPE_HELP_CURRENT_SCOPE_SWITCHING_AVAILABLE
            : SCOPE_HELP_CURRENT_SCOPE_SWITCHING_UNAVAILABLE}
        </p>
      </div>
    </section>
  );
}
