"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const RECYCLE_BIN_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspacesRecycleBin}`;

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
    <div className="mx-auto max-w-3xl space-y-6" data-testid="projects-recycle-bin-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Projects recycle bin</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Soft-deleted architecture projects remain here until retention purges them. Restoring clears the deletion flag when
          the project name does not collide with another active project in the same workspace.
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
          <Link href="/settings/tenant" className="text-teal-800 underline dark:text-teal-300">
            Back to tenant settings
          </Link>
        </p>
      </div>

      {!isAuthorityLoading && !canRestoreExecute ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
          Restore requires Execute authority — you can browse deleted projects below, but restoring is unavailable for this signed-in principal.
        </p>
      ) : null}

      {error !== null ? (
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="projects-recycle-bin-error">
          {error}
        </p>
      ) : null}

      {restoreMessage !== null ? (
        <p
          className="m-0 text-sm text-neutral-700 dark:text-neutral-200"
          role="status"
          data-testid="projects-recycle-bin-restore-message"
        >
          {restoreMessage}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
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
          Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}

      {!loading && rows.length === 0 && error === null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">There are no soft-deleted projects for this tenant.</p>
          </CardContent>
        </Card>
      ) : null}

      {rows.map((w) => {
        return (
          <Card key={w.workspaceId} data-testid={`projects-recycle-bin-workspace-${w.workspaceId}`}>
            <CardHeader>
              <CardTitle className="text-base">{w.name}</CardTitle>
              <p className="m-0 text-xs font-mono text-neutral-500 dark:text-neutral-400">{w.workspaceId}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {w.deletedProjects.map((p) => {
                const rowKey = `${w.workspaceId}:${p.projectId}`;

                return (
                  <div
                    key={p.projectId}
                    data-testid={`projects-recycle-bin-row-${p.projectId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                  >
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                      <p className="m-0 text-xs font-mono text-neutral-500 dark:text-neutral-400">{p.projectId}</p>
                      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                        Deleted:{" "}
                        <time dateTime={p.deletedUtcIso}>{new Date(p.deletedUtcIso).toLocaleString()}</time>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-label={`Restore project ${p.name}`}
                      data-testid="projects-recycle-bin-restore"
                      disabled={!canRestoreExecute || restoreBusyRow === rowKey}
                      title={canRestoreExecute ? undefined : "Execute authority required to restore"}
                      onClick={() => {
                        void restoreProject(w.workspaceId, p.projectId);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
