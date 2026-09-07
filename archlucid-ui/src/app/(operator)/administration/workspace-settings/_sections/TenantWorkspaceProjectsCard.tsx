"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { toast } from "sonner";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { deleteTenantWorkspaceProject } from "@/lib/delete-tenant-workspace-project";
import {
  parseProjectDeleteConfirmIdFromSearch,
  projectDeleteConfirmHrefFromSearch,
} from "@/lib/administration/project-delete-confirm-url";
import {
  parseTenantSettingsRoutingScopeOpenFromSearch,
  tenantSettingsRoutingScopeDisclosureHrefFromSearch,
} from "@/lib/administration/tenant-settings-routing-scope-disclosure-url";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import {
  PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON,
  PROJECT_DELETE_EXECUTE_DISABLED_REASON,
  PROJECT_DELETE_NAME_CONFLICT_MESSAGE,
  PROJECT_DELETE_NOT_FOUND_MESSAGE,
  PROJECT_DELETE_SUCCESS_TOAST_ACTION_LABEL,
  projectDeleteSuccessToastMessage,
} from "@/lib/projects-delete-confirm-copy";
import { DEFAULT_RECYCLE_BIN_RETENTION_DAYS } from "@/lib/projects-recycle-bin-payload";
import { PROJECTS_RECYCLE_BIN_PATH } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";
import {
  findTenantWorkspaceRow,
  isWorkspaceDefaultProject,
  type TenantWorkspaceProjectRow,
} from "@/lib/tenant-workspaces-list-payload";
import { invalidateTenantWorkspacesListCache } from "@/lib/tenant-workspaces-list-client";
import { cn } from "@/lib/utils";

import { ProjectDeleteConfirmDialog, type ProjectDeletePending } from "./ProjectDeleteConfirmDialog";
import { TenantSettingsOrganizationSummary } from "./TenantSettingsOrganizationSummary";

type Props = {
  readonly tenantDisplayName: string;
  readonly scope: Readonly<Record<string, string>>;
};

function resolveDeleteDisabledReason(input: {
  readonly canDelete: boolean;
  readonly isDefaultProject: boolean;
}): string | undefined {
  if (!input.canDelete) {
    return PROJECT_DELETE_EXECUTE_DISABLED_REASON;
  }

  if (input.isDefaultProject) {
    return PROJECT_DELETE_DEFAULT_PROJECT_DISABLED_REASON;
  }

  return undefined;
}

/** Lists active projects in the current workspace and soft-deletes via the tenant API (TB-1179). */
export function TenantWorkspaceProjectsCard({ tenantDisplayName, scope }: Props): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_WORKSPACE_SETTINGS_PATH;
  const searchParams = useSearchParams();
  const deleteProjectIdParam = searchParams.get("deleteProjectId");
  const tenantSettingsRoutingScopeOpenParam = searchParams.get("tenantSettingsRoutingScopeOpen");
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const canDelete = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  const effectiveScope = getEffectiveBrowserProxyScopeHeaders();
  const workspaceId = effectiveScope["x-workspace-id"]?.trim() ?? "";
  const activeProjectId = effectiveScope["x-project-id"]?.trim() ?? "";

  const workspacesQuery = useTenantWorkspacesListQuery();
  const [pendingDelete, setPendingDeleteState] = useState<ProjectDeletePending | null>(null);
  const [deleteBusyProjectId, setDeleteBusyProjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [routingScopeOpen, setRoutingScopeOpenState] = useState(() =>
    parseTenantSettingsRoutingScopeOpenFromSearch(tenantSettingsRoutingScopeOpenParam),
  );

  const syncRoutingScopeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        tenantSettingsRoutingScopeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRoutingScopeOpen = useCallback(
    (open: boolean) => {
      setRoutingScopeOpenState(open);
      syncRoutingScopeOpenToUrl(open);
    },
    [syncRoutingScopeOpenToUrl],
  );

  useEffect(() => {
    setRoutingScopeOpenState(parseTenantSettingsRoutingScopeOpenFromSearch(tenantSettingsRoutingScopeOpenParam));
  }, [tenantSettingsRoutingScopeOpenParam]);

  const syncDeleteConfirmToUrl = useCallback(
    (projectId: string | null) => {
      router.replace(
        projectDeleteConfirmHrefFromSearch(searchParams.toString(), projectId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingDelete = useCallback(
    (value: SetStateAction<ProjectDeletePending | null>) => {
      setPendingDeleteState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncDeleteConfirmToUrl(next?.projectId ?? null);

        return next;
      });
    },
    [syncDeleteConfirmToUrl],
  );

  useEffect(() => {
    const deleteProjectId = parseProjectDeleteConfirmIdFromSearch(deleteProjectIdParam);

    if (deleteProjectId.length === 0) {
      return;
    }

    if (pendingDelete?.projectId === deleteProjectId) {
      return;
    }

    const payload = workspacesQuery.data;

    if (payload === undefined) {
      return;
    }

    const workspace = findTenantWorkspaceRow(payload, workspaceId);

    if (workspace === null) {
      return;
    }

    const project = workspace.projects.find((row) => row.projectId === deleteProjectId);

    if (project === undefined) {
      return;
    }

    setPendingDeleteState({
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
      projectId: project.projectId,
      projectName: project.name,
      isActiveScope: project.projectId === activeProjectId,
    });
  }, [activeProjectId, deleteProjectIdParam, pendingDelete?.projectId, workspaceId, workspacesQuery.data]);

  const workspaceContext = useMemo(() => {
    const payload = workspacesQuery.data;

    if (payload === undefined) {
      return {
        workspaceId,
        workspaceName: "Workspace",
        defaultProjectId: null as string | null,
        projects: [] as ReadonlyArray<TenantWorkspaceProjectRow>,
        retentionDays: DEFAULT_RECYCLE_BIN_RETENTION_DAYS,
        loadError: null as string | null,
      };
    }

    const workspace = findTenantWorkspaceRow(payload, workspaceId);

    if (workspace === null) {
      return {
        workspaceId,
        workspaceName: "Workspace",
        defaultProjectId: null,
        projects: [],
        retentionDays: payload.retentionDays,
        loadError: "Select a workspace in the header switcher to manage its projects.",
      };
    }

    return {
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
      defaultProjectId: workspace.defaultProjectId,
      projects: workspace.projects,
      retentionDays: payload.retentionDays,
      loadError: null,
    };
  }, [workspaceId, workspacesQuery.data]);

  const loading = workspacesQuery.isPending;
  const error =
    actionError
    ?? (workspacesQuery.isError
      ? toApiLoadFailure(workspacesQuery.error).message
      : workspaceContext.loadError);

  const allProjectsUndeletable =
    !loading
    && error === null
    && canDelete
    && workspaceContext.projects.length > 0
    && workspaceContext.projects.every((project) => {
      const isDefaultProject =
        workspaceContext.defaultProjectId !== null
        && isWorkspaceDefaultProject(
          {
            workspaceId: workspaceContext.workspaceId,
            name: workspaceContext.workspaceName,
            defaultProjectId: workspaceContext.defaultProjectId,
            projects: workspaceContext.projects,
          },
          project.projectId,
        );

      return resolveDeleteDisabledReason({ canDelete: true, isDefaultProject }) !== undefined;
    });

  async function confirmDelete(): Promise<void> {
    if (pendingDelete === null) {
      return;
    }

    setDeleteBusyProjectId(pendingDelete.projectId);
    setActionError(null);

    const result = await deleteTenantWorkspaceProject(pendingDelete.workspaceId, pendingDelete.projectId);

    if (result.ok) {
      const message = projectDeleteSuccessToastMessage(pendingDelete.projectName);
      toast.success(message, {
        action: {
          label: PROJECT_DELETE_SUCCESS_TOAST_ACTION_LABEL,
          onClick: () => {
            window.location.assign(PROJECTS_RECYCLE_BIN_PATH);
          },
        },
      });
      setPendingDelete(null);
      setDeleteBusyProjectId(null);
      await invalidateTenantWorkspacesListCache();

      return;
    }

    if (result.status === 404) {
      setActionError(PROJECT_DELETE_NOT_FOUND_MESSAGE);
    } else if (result.status === 409) {
      setActionError(PROJECT_DELETE_NAME_CONFLICT_MESSAGE);
    } else {
      setActionError(result.message);
    }

    setPendingDelete(null);
    setDeleteBusyProjectId(null);
  }

  return (
    <Card data-testid="tenant-workspace-projects-card">
      <CardHeader>
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>Active workspace and projects</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <TenantSettingsOrganizationSummary
          tenantDisplayName={tenantDisplayName}
          tenantId={scope["x-tenant-id"]}
        />

        <p className="m-0">
          Your active workspace and project are selected from the workspace switcher.
        </p>

        <p className="m-0">
          Soft-delete moves a project to the projects recycle bin for {workspaceContext.retentionDays} days. Committed
          architecture packages and audit history are not erased.
        </p>

        <Button asChild variant="outline" size="sm">
          <Link href={PROJECTS_RECYCLE_BIN_PATH} data-testid="tenant-settings-recycle-bin-link">
            Open projects recycle bin
          </Link>
        </Button>

        {loading ? <p className="m-0">Loading projects…</p> : null}

        {!loading && error !== null ? (
          <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="tenant-workspace-projects-error">
            {error}
          </p>
        ) : null}

        {!loading && error === null && workspaceContext.projects.length === 0 ? (
          <p className="m-0">No active projects are visible for the selected workspace.</p>
        ) : null}

        {!loading && error === null && workspaceContext.projects.length > 0 ? (
          <ul className="m-0 list-none space-y-2 p-0" data-testid="tenant-workspace-projects-list">
            {workspaceContext.projects.map((project) => {
              const isDefaultProject =
                workspaceContext.defaultProjectId !== null
                && isWorkspaceDefaultProject(
                  {
                    workspaceId: workspaceContext.workspaceId,
                    name: workspaceContext.workspaceName,
                    defaultProjectId: workspaceContext.defaultProjectId,
                    projects: workspaceContext.projects,
                  },
                  project.projectId,
                );
              const disabledReason = resolveDeleteDisabledReason({ canDelete, isDefaultProject });
              const isActiveScope = project.projectId === activeProjectId;
              const showDeleteButton = !allProjectsUndeletable && disabledReason === undefined;

              return (
                <li
                  key={project.projectId}
                  className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                  data-testid={`tenant-workspace-project-row-${project.projectId}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {project.name}
                    </p>
                    {isActiveScope ? (
                      <StatusTag kind="neutral" label="Current scope" data-testid="tenant-workspace-project-current-scope" />
                    ) : null}
                  </div>
                  {isDefaultProject ? (
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Workspace default project
                    </p>
                  ) : null}
                  {showDeleteButton ? (
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deleteBusyProjectId !== null}
                        data-testid="tenant-workspace-project-delete"
                        onClick={() => {
                          setPendingDelete({
                            workspaceId: workspaceContext.workspaceId,
                            workspaceName: workspaceContext.workspaceName,
                            projectId: project.projectId,
                            projectName: project.name,
                            isActiveScope,
                          });
                        }}
                      >
                        Delete project
                      </Button>
                    </div>
                  ) : null}
                  {!showDeleteButton && canDelete && disabledReason !== undefined ? (
                    <p
                      className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`tenant-project-delete-hint-${project.projectId}`}
                    >
                      {disabledReason}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {allProjectsUndeletable ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="tenant-workspace-projects-all-protected">
            Every visible project is protected from deletion here. The workspace default project cannot be removed until
            another project exists.
          </p>
        ) : null}

        {!canDelete && !isAuthorityLoading ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PROJECT_DELETE_EXECUTE_DISABLED_REASON}</p>
        ) : null}

        <CollapsibleSection title="Technical details — routing scope" open={routingScopeOpen} onToggle={setRoutingScopeOpen}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Internal browser-to-API routing carries scope identifiers on proxied requests. Values below reflect your
            current selection.
          </p>
          <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
            <li>
              Tenant: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-tenant-id"]}</span>
            </li>
            <li>
              Workspace: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-workspace-id"]}</span>
            </li>
            <li>
              Project: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-project-id"]}</span>
            </li>
          </ul>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Hosted deployments with more than one API instance should use a shared projection cache —{" "}
            <a
              className={OPERATOR_LINK.inline}
              href={toDocsBlobUrl("/docs/operations/PROJECTION_CACHE_AND_REPLICAS.md")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about projection cache and replicas
            </a>
            .
          </p>
        </CollapsibleSection>
      </CardContent>

      <ProjectDeleteConfirmDialog
        pending={pendingDelete}
        retentionDays={workspaceContext.retentionDays}
        busy={deleteBusyProjectId !== null}
        onCancel={() => {
          if (deleteBusyProjectId === null) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </Card>
  );
}
