"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { deleteTenantWorkspaceProject } from "@/lib/delete-tenant-workspace-project";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
export function TenantWorkspaceProjectsCard(): React.JSX.Element {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const canDelete = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  const scope = getEffectiveBrowserProxyScopeHeaders();
  const workspaceId = scope["x-workspace-id"]?.trim() ?? "";
  const activeProjectId = scope["x-project-id"]?.trim() ?? "";

  const workspacesQuery = useTenantWorkspacesListQuery();
  const [pendingDelete, setPendingDelete] = useState<ProjectDeletePending | null>(null);
  const [deleteBusyProjectId, setDeleteBusyProjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>Architecture projects</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Soft-delete moves a project to the{" "}
          <Link className={OPERATOR_LINK.inline} href={PROJECTS_RECYCLE_BIN_PATH}>
            projects recycle bin
          </Link>{" "}
          for {workspaceContext.retentionDays} days. Committed architecture packages and audit history are not erased.
        </p>

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

              return (
                <li
                  key={project.projectId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                  data-testid={`tenant-workspace-project-row-${project.projectId}`}
                >
                  <div className="min-w-0">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {project.name}
                      {isActiveScope ? (
                        <span className={cn("ml-2 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          (current scope)
                        </span>
                      ) : null}
                    </p>
                    {isDefaultProject ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        Workspace default project
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabledReason !== undefined || deleteBusyProjectId !== null}
                      aria-describedby={
                        disabledReason !== undefined
                          ? `tenant-project-delete-hint-${project.projectId}`
                          : undefined
                      }
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
                    {disabledReason !== undefined ? (
                      <p
                        id={`tenant-project-delete-hint-${project.projectId}`}
                        className={cn("m-0 text-right text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      >
                        {disabledReason}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!canDelete && !isAuthorityLoading ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PROJECT_DELETE_EXECUTE_DISABLED_REASON}</p>
        ) : null}
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
