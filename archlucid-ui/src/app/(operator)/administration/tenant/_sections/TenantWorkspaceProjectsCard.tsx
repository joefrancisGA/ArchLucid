"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTenantWorkspaceProject } from "@/lib/delete-tenant-workspace-project";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ApiV1Routes } from "@/lib/api-v1-routes";
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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  findTenantWorkspaceRow,
  isWorkspaceDefaultProject,
  parseTenantWorkspacesListPayload,
  type TenantWorkspaceProjectRow,
} from "@/lib/tenant-workspaces-list-payload";
import { cn } from "@/lib/utils";

import { ProjectDeleteConfirmDialog, type ProjectDeletePending } from "./ProjectDeleteConfirmDialog";

const WORKSPACES_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ReadonlyArray<TenantWorkspaceProjectRow>>([]);
  const [retentionDays, setRetentionDays] = useState(DEFAULT_RECYCLE_BIN_RETENTION_DAYS);
  const [pendingDelete, setPendingDelete] = useState<ProjectDeletePending | null>(null);
  const [deleteBusyProjectId, setDeleteBusyProjectId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [workspacesResponse, recycleBinResponse] = await Promise.all([
        fetch(WORKSPACES_PATH, mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" })),
        fetch(
          `/api/proxy/${ApiV1Routes.tenantWorkspacesRecycleBin}`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
        ),
      ]);

      if (!workspacesResponse.ok) {
        setProjects([]);
        setError(`Could not load projects (${workspacesResponse.status}).`);

        return;
      }

      const workspacesJson: unknown = await workspacesResponse.json();
      const parsed = parseTenantWorkspacesListPayload(workspacesJson);
      const workspace = findTenantWorkspaceRow(parsed, workspaceId);

      if (workspace === null) {
        setProjects([]);
        setWorkspaceName("Workspace");
        setDefaultProjectId(null);
        setError("Select a workspace in the header switcher to manage its projects.");

        return;
      }

      setWorkspaceName(workspace.name);
      setDefaultProjectId(workspace.defaultProjectId);
      setProjects(workspace.projects);

      if (recycleBinResponse.ok) {
        const recycleJson: unknown = await recycleBinResponse.json();

        if (recycleJson !== null && typeof recycleJson === "object") {
          const days = (recycleJson as { retentionDays?: unknown }).retentionDays;

          if (typeof days === "number" && Number.isFinite(days) && days > 0) {
            setRetentionDays(days);
          }
        }
      }
    } catch (loadError) {
      setProjects([]);
      setError(loadError instanceof Error ? loadError.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const workspaceContext = useMemo(
    () => ({
      workspaceId,
      workspaceName,
      defaultProjectId,
    }),
    [defaultProjectId, workspaceId, workspaceName],
  );

  async function confirmDelete(): Promise<void> {
    if (pendingDelete === null) {
      return;
    }

    setDeleteBusyProjectId(pendingDelete.projectId);

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
      await reload();

      return;
    }

    if (result.status === 404) {
      setError(PROJECT_DELETE_NOT_FOUND_MESSAGE);
    } else if (result.status === 409) {
      setError(PROJECT_DELETE_NAME_CONFLICT_MESSAGE);
    } else {
      setError(result.message);
    }

    setPendingDelete(null);
    setDeleteBusyProjectId(null);
  }

  return (
    <Card data-testid="tenant-workspace-projects-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Architecture projects</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Soft-delete moves a project to the{" "}
          <Link className={OPERATOR_LINK.inline} href={PROJECTS_RECYCLE_BIN_PATH}>
            projects recycle bin
          </Link>{" "}
          for {retentionDays} days. Committed architecture packages and audit history are not erased.
        </p>

        {loading ? <p className="m-0">Loading projects…</p> : null}

        {!loading && error !== null ? (
          <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="tenant-workspace-projects-error">
            {error}
          </p>
        ) : null}

        {!loading && error === null && projects.length === 0 ? (
          <p className="m-0">No active projects are visible for the selected workspace.</p>
        ) : null}

        {!loading && error === null && projects.length > 0 ? (
          <ul className="m-0 list-none space-y-2 p-0" data-testid="tenant-workspace-projects-list">
            {projects.map((project) => {
              const isDefaultProject =
                defaultProjectId !== null && isWorkspaceDefaultProject(
                  {
                    workspaceId: workspaceContext.workspaceId,
                    name: workspaceContext.workspaceName,
                    defaultProjectId: workspaceContext.defaultProjectId,
                    projects,
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabledReason !== undefined || deleteBusyProjectId !== null}
                    title={disabledReason}
                    data-testid="tenant-workspace-project-delete"
                    onClick={() => {
                      setPendingDelete({
                        workspaceId: workspaceContext.workspaceId,
                        workspaceName: workspaceContext.workspaceName,
                        projectId: project.projectId,
                        projectName: project.name,
                      });
                    }}
                  >
                    Delete project
                  </Button>
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
        retentionDays={retentionDays}
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
