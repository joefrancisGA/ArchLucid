"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/StatusTag";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  defaultLabelsForScopeIds,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
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
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { BUYER_WORKSPACE_DISPLAY_NAME } from "@/lib/buyer/buyer-polish-copy";
import { cn } from "@/lib/utils";

const WORKSPACES_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;

type WorkspacesListPayload = {
  workspaces?: ReadonlyArray<{
    workspaceId?: string;
    id?: string;
    name?: string;
    displayName?: string;
    projects?: ReadonlyArray<{
      projectId?: string;
      id?: string;
      name?: string;
      displayName?: string;
    }>;
  }>;
};

function parseWorkspacesList(json: unknown): ScopeSwitcherWorkspaceOption[] {
  if (json === null || typeof json !== "object") {
    return [];
  }

  const root = json as WorkspacesListPayload;
  const raw = root.workspaces;

  if (!Array.isArray(raw)) {
    return [];
  }

  const out: ScopeSwitcherWorkspaceOption[] = [];

  for (const workspace of raw) {
    if (workspace === null || typeof workspace !== "object") {
      continue;
    }

    const workspaceId =
      (workspace as { workspaceId?: string; id?: string }).workspaceId ??
      (workspace as { id?: string }).id;

    if (typeof workspaceId !== "string" || workspaceId.trim().length === 0) {
      continue;
    }

    const workspaceName =
      typeof workspace.displayName === "string" && workspace.displayName.trim().length > 0
        ? workspace.displayName.trim()
        : typeof workspace.name === "string" && workspace.name.trim().length > 0
          ? workspace.name.trim()
          : "Workspace";
    const projects: ScopeSwitcherWorkspaceOption["projects"][number][] = [];
    const projectRows = workspace.projects;

    if (Array.isArray(projectRows)) {
      for (const project of projectRows) {
        if (project === null || typeof project !== "object") {
          continue;
        }

        const projectId =
          (project as { projectId?: string; id?: string }).projectId ??
          (project as { id?: string }).id;

        if (typeof projectId !== "string" || projectId.trim().length === 0) {
          continue;
        }

        const projectName =
          typeof project.displayName === "string" && project.displayName.trim().length > 0
            ? project.displayName.trim()
            : typeof project.name === "string" && project.name.trim().length > 0
              ? project.name.trim()
              : "Project";

        projects.push({ projectId: projectId.trim(), name: projectName });
      }
    }

    out.push({ workspaceId: workspaceId.trim(), name: workspaceName, projects });
  }

  return out;
}

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
  const [workspaces, setWorkspaces] = useState<ScopeSwitcherWorkspaceOption[] | null>(null);

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
  const switcherLabel = formatScopeSwitcherTriggerLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession,
    includeProject: !isSampleWorkspaceSession,
  });
  const switchingAvailable = isScopeSwitchingAvailable(workspaces);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaces(): Promise<void> {
      if (isEffectiveDevDefaultScope(workspaceId, projectId)) {
        if (!cancelled) {
          setWorkspaces([demoClaimsIntakeWorkspaceOption()]);
        }

        return;
      }

      try {
        const response = await fetch(
          WORKSPACES_PATH,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!response.ok) {
          if (!cancelled) {
            setWorkspaces([]);
          }

          return;
        }

        const json: unknown = await response.json();

        if (!cancelled) {
          setWorkspaces(parseWorkspacesList(json));
        }
      } catch {
        if (!cancelled) {
          setWorkspaces([]);
        }
      }
    }

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId]);

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
