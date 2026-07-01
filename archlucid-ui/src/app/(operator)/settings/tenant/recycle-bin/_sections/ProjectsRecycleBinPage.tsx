"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const RECYCLE_BIN_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspacesRecycleBin}`;

const PAGE_DESCRIPTION =
  "Deleted projects are kept here until the retention period expires. You can restore a project if its name is not already used by an active project.";

const EMPTY_STATE_BODY =
  "Deleted projects will appear here until the retention period expires.";

type DeletedProjectRow = Readonly<{ projectId: string; name: string; deletedUtcIso: string }>;

type WorkspaceBinRow = Readonly<{
  workspaceId: string;
  name: string;
  deletedProjects: ReadonlyArray<DeletedProjectRow>;
}>;

type RecycleBinPayload = Readonly<{ workspaces?: ReadonlyArray<WorkspaceBinRow | null | undefined> }>;

function coercePayload(json: unknown): WorkspaceBinRow[] {
  if (json === null || typeof json !== "object") {
    return [];
  }
  const workspaces = (json as RecycleBinPayload).workspaces;
  if (!Array.isArray(workspaces)) {
    return [];
  }
  const out: WorkspaceBinRow[] = [];

  for (const w of workspaces) {
    if (w === null || typeof w !== "object") {
      continue;
    }
    const ws = w as {
      workspaceId?: string;
      id?: string;
      name?: string;
      displayName?: string;
      deletedProjects?: ReadonlyArray<{
        projectId?: string;
        id?: string;
        name?: string;
        displayName?: string;
        deletedUtc?: string;
      }>;
    };
    const wid = typeof ws.workspaceId === "string" ? ws.workspaceId : typeof ws.id === "string" ? ws.id : "";
    const wnameRaw =
      typeof ws.displayName === "string" && ws.displayName.trim().length > 0
        ? ws.displayName.trim()
        : typeof ws.name === "string" && ws.name.trim().length > 0
          ? ws.name.trim()
          : "Workspace";
    if (!wid.trim()) {
      continue;
    }
    const dps = ws.deletedProjects;
    if (!Array.isArray(dps)) {
      continue;
    }
    const projects: DeletedProjectRow[] = [];
    for (const p of dps) {
      if (p === null || typeof p !== "object") {
        continue;
      }
      const pid =
        typeof p.projectId === "string" ? p.projectId : typeof p.id === "string" ? p.id : "";
      const pnameRaw =
        typeof p.displayName === "string" && p.displayName.trim().length > 0
          ? p.displayName.trim()
          : typeof p.name === "string" && p.name.trim().length > 0
            ? p.name.trim()
            : "Project";
      const iso = typeof p.deletedUtc === "string" ? p.deletedUtc.trim() : "";
      if (!pid.trim() || !iso) {
        continue;
      }
      projects.push({
        projectId: pid.trim(),
        name: pnameRaw,
        deletedUtcIso: iso,
      });
    }
    if (projects.length > 0) {
      out.push({ workspaceId: wid.trim(), name: wnameRaw, deletedProjects: projects });
    }
  }

  return out;
}

function formatDeletedOn(deletedUtcIso: string): string {
  return new Date(deletedUtcIso).toLocaleString();
}

type WorkspaceRecycleBinTableProps = Readonly<{
  workspace: WorkspaceBinRow;
  canRestoreExecute: boolean;
  restoreBusyRow: string | null;
  onRestore: (workspaceId: string, projectId: string) => void;
}>;

function WorkspaceRecycleBinTable(props: WorkspaceRecycleBinTableProps) {
  const { workspace, canRestoreExecute, restoreBusyRow, onRestore } = props;

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
                  <time dateTime={project.deletedUtcIso}>{formatDeletedOn(project.deletedUtcIso)}</time>
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
                      onRestore(workspace.workspaceId, project.projectId);
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

  const [rows, setRows] = useState<WorkspaceBinRow[]>([]);

  const [restoreBusyRow, setRestoreBusyRow] = useState<string | null>(null);

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
      setRows(coercePayload(json));
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

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="projects-recycle-bin-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Projects recycle bin</h1>
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{PAGE_DESCRIPTION}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          aria-label="Refresh recycle bin list"
          onClick={() => {
            void reload();
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

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

      {loading && rows.length === 0 ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}

      {!loading && rows.length === 0 && error === null ? (
        <Card>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>No deleted projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{EMPTY_STATE_BODY}</p>
          </CardContent>
        </Card>
      ) : null}

      {rows.map((workspace) => {
        return (
          <WorkspaceRecycleBinTable
            key={workspace.workspaceId}
            workspace={workspace}
            canRestoreExecute={canRestoreExecute}
            restoreBusyRow={restoreBusyRow}
            onRestore={(workspaceId, projectId) => {
              void restoreProject(workspaceId, projectId);
            }}
          />
        );
      })}
    </div>
  );
}
