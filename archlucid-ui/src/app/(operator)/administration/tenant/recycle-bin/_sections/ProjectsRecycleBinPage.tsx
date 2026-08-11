"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  coerceRecycleBinPayload,
  DEFAULT_RECYCLE_BIN_RETENTION_DAYS,
  recycleBinPageDescription,
  type WorkspaceBinRow,
} from "@/lib/projects-recycle-bin-payload";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { ProjectsRecycleBinPageHeader } from "./ProjectsRecycleBinPageHeader";
import { ProjectsRecycleBinEmptyState, ProjectsRecycleBinLoadingNotice } from "./ProjectsRecycleBinListStates";
import {
  ProjectsRecycleBinRestoreConfirmDialog,
  type ProjectsRecycleBinPendingRestore,
} from "./ProjectsRecycleBinRestoreConfirmDialog";
import { ProjectsRecycleDraftsPackageVocabularyRail } from "@/components/ProjectsRecycleDraftsPackageVocabularyRail";

const RECYCLE_BIN_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspacesRecycleBin}`;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

type WorkspaceRecycleBinTableProps = Readonly<{
  workspace: WorkspaceBinRow;
  canRestoreExecute: boolean;
  restoreBusyRow: string | null;
  onRequestRestore: (workspaceId: string, workspaceName: string, projectId: string, projectName: string) => void;
}>;

function WorkspaceRecycleBinTable(props: WorkspaceRecycleBinTableProps) {
  const { workspace, canRestoreExecute, restoreBusyRow, onRequestRestore } = props;

  return (
    <section
      className="space-y-3"
      data-testid={`projects-recycle-bin-workspace-${workspace.workspaceId}`}
      aria-labelledby={`projects-recycle-bin-workspace-heading-${workspace.workspaceId}`}
    >
      <h2
        className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        id={`projects-recycle-bin-workspace-heading-${workspace.workspaceId}`}
      >
        {workspace.name}
      </h2>
      <EnterpriseTable ariaLabel={`Deleted projects in ${workspace.name}`}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Project name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Deleted on</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Permanently removed on</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="w-[7.5rem] text-right">Restore</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {workspace.deletedProjects.map((project) => {
            const rowKey = `${workspace.workspaceId}:${project.projectId}`;

            return (
              <EnterpriseTableRow
                key={project.projectId}
                data-testid={`projects-recycle-bin-row-${project.projectId}`}
              >
                <EnterpriseTableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                  {project.name}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <time dateTime={project.deletedUtcIso}>{formatTimestamp(project.deletedUtcIso)}</time>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <time dateTime={project.purgeAfterUtcIso}>{formatTimestamp(project.purgeAfterUtcIso)}</time>
                </EnterpriseTableCell>
                <EnterpriseTableCell className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Restore project ${project.name}`}
                    data-testid="projects-recycle-bin-restore"
                    disabled={!canRestoreExecute || restoreBusyRow === rowKey}
                    title={canRestoreExecute ? undefined : "Execute authority required to restore"}
                    onClick={() => {
                      onRequestRestore(workspace.workspaceId, workspace.name, project.projectId, project.name);
                    }}
                  >
                    Restore
                  </Button>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}

/** Admin **Recycle Bin** — soft-deleted architecture projects scoped to this tenant (`GET /v1/tenant/workspaces/recycle-bin`). */
export function ProjectsRecycleBinPage() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();

  const canRestoreExecute = callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [retentionDays, setRetentionDays] = useState(DEFAULT_RECYCLE_BIN_RETENTION_DAYS);

  const [rows, setRows] = useState<WorkspaceBinRow[]>([]);

  const [restoreBusyRow, setRestoreBusyRow] = useState<string | null>(null);

  const [pendingRestore, setPendingRestore] = useState<ProjectsRecycleBinPendingRestore | null>(null);

  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRestoreMessage(null);

    try {
      const res = await fetch(
        RECYCLE_BIN_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setRows([]);
        setError(`Could not load recycle bin (${res.status}).`);

        return;
      }

      const json: unknown = await res.json();
      const parsed = coerceRecycleBinPayload(json);
      setRetentionDays(parsed.retentionDays);
      setRows(parsed.workspaces);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Recycle bin load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function restoreProject(workspaceId: string, projectId: string): Promise<void> {
    setRestoreBusyRow(`${workspaceId}:${projectId}`);
    setRestoreMessage(null);

    try {
      const encodedW = encodeURIComponent(workspaceId.trim());
      const encodedP = encodeURIComponent(projectId.trim());
      const path = `/api/proxy/${ApiV1Routes.tenantWorkspaces}/${encodedW}/projects/${encodedP}/restore`;

      const res = await fetch(
        path,
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        }),
      );

      if (res.status === 204) {
        setRestoreMessage("Project restored.");
        setPendingRestore(null);

        await reload();

        return;
      }

      if (res.status === 409) {
        setRestoreMessage(
          "Another active project already uses this name in the workspace — rename or remove it first.",
        );

        return;
      }

      if (res.status === 404) {
        setRestoreMessage("Project was not found or may have already been permanently removed.");

        return;
      }

      setRestoreMessage(`Restore failed (${res.status}).`);
    } finally {
      setRestoreBusyRow(null);
    }
  }

  const pageDescription = recycleBinPageDescription(retentionDays);

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="projects-recycle-bin-page">
      <ProjectsRecycleBinPageHeader
        loading={loading}
        subtitle={pageDescription}
        onRefresh={() => {
          void reload();
        }}
      />
      <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="projects-recycle" />
      {!isAuthorityLoading && !canRestoreExecute ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Restore requires Execute authority — you can browse deleted projects below, but restoring is unavailable for this signed-in principal.
        </p>
      ) : null}

      {error !== null ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="projects-recycle-bin-error">
          {error}
        </p>
      ) : null}

      {restoreMessage !== null ? (
        <p
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          role="status"
          data-testid="projects-recycle-bin-restore-message"
        >
          {restoreMessage}
        </p>
      ) : null}

      {loading && rows.length === 0 ? <ProjectsRecycleBinLoadingNotice /> : null}

      {!loading && rows.length === 0 && error === null ? (
        <ProjectsRecycleBinEmptyState retentionDays={retentionDays} />
      ) : null}

      {rows.map((workspace) => {
        return (
          <WorkspaceRecycleBinTable
            key={workspace.workspaceId}
            workspace={workspace}
            canRestoreExecute={canRestoreExecute}
            restoreBusyRow={restoreBusyRow}
            onRequestRestore={(workspaceId, workspaceName, projectId, projectName) => {
              setPendingRestore({
                workspaceId,
                workspaceName,
                projectId,
                projectName,
              });
            }}
          />
        );
      })}

      <ProjectsRecycleBinRestoreConfirmDialog
        busy={restoreBusyRow !== null}
        pending={pendingRestore}
        onCancel={() => {
          if (restoreBusyRow === null) {
            setPendingRestore(null);
          }
        }}
        onConfirm={() => {
          if (pendingRestore === null) {
            return;
          }

          void restoreProject(pendingRestore.workspaceId, pendingRestore.projectId);
        }}
      />
    </div>
  );
}
