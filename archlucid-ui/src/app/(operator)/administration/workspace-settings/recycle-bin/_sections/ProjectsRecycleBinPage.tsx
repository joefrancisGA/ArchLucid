"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ProjectsRecycleDraftsPackageVocabularyRail } from "@/components/ProjectsRecycleDraftsPackageVocabularyRail";
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
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { readApiFailureMessage } from "@/lib/api-error";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  type ProjectsRecycleBinFeedback,
  recycleBinFeedbackCalloutClass,
  recycleBinFeedbackStatusKind,
} from "@/lib/projects-recycle-bin-feedback";
import {
  PROJECTS_RECYCLE_BIN_AUDIT_TRAIL_ATTRIBUTION_NOTE,
  PROJECTS_RECYCLE_BIN_DELETED_BY_NOT_RECORDED,
  PROJECTS_RECYCLE_BIN_LOAD_ERROR_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_LOAD_UNEXPECTED_ERROR,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFLICT_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_ERROR_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_SUCCESS_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_ROW_AUDIT_TRAIL_LINK_LABEL,
} from "@/lib/projects-recycle-bin-page-copy";
import {
  coerceRecycleBinPayload,
  recycleBinPageDescription,
  type WorkspaceBinRow,
} from "@/lib/projects-recycle-bin-payload";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";
import { whyDisabledNeedsRole } from "@/lib/why-disabled-cta";

import { ProjectsRecycleBinEmptyState, ProjectsRecycleBinLoadingNotice } from "./ProjectsRecycleBinListStates";
import { ProjectsRecycleBinPageHeader } from "./ProjectsRecycleBinPageHeader";
import {
  ProjectsRecycleBinRestoreConfirmDialog,
  type ProjectsRecycleBinPendingRestore,
} from "./ProjectsRecycleBinRestoreConfirmDialog";

const RECYCLE_BIN_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspacesRecycleBin}`;

const RESTORE_DISABLED_REASON = whyDisabledNeedsRole("Execute authority");

function restoreFeedbackStatusLabel(kind: ProjectsRecycleBinFeedback["kind"]): string {
  switch (kind) {
    case "success":
      return PROJECTS_RECYCLE_BIN_RESTORE_SUCCESS_STATUS_LABEL;
    case "conflict":
      return PROJECTS_RECYCLE_BIN_RESTORE_CONFLICT_STATUS_LABEL;
    case "error":
      return PROJECTS_RECYCLE_BIN_RESTORE_ERROR_STATUS_LABEL;
    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
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
      {!canRestoreExecute ? (
        <WhyDisabledCtaHint
          id={`projects-recycle-bin-restore-disabled-hint-${workspace.workspaceId}`}
          reason={RESTORE_DISABLED_REASON}
          testId={`projects-recycle-bin-restore-disabled-hint-${workspace.workspaceId}`}
        />
      ) : null}
      <EnterpriseTable ariaLabel={`Deleted projects in ${workspace.name}`}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Project name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Deleted on</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Permanently removed on</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Deleted by</EnterpriseTableHeaderCell>
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
                  <time dateTime={project.deletedUtcIso}>{formatInstantForLocale(project.deletedUtcIso)}</time>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <time dateTime={project.purgeAfterUtcIso}>{formatInstantForLocale(project.purgeAfterUtcIso)}</time>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="space-y-1">
                    <span data-testid="projects-recycle-bin-deleted-by">{PROJECTS_RECYCLE_BIN_DELETED_BY_NOT_RECORDED}</span>
                    <Link
                      href={GOVERNANCE_AUDIT_PATH}
                      className={cn("block", OPERATOR_LINK.nav)}
                      data-testid={`projects-recycle-bin-audit-trail-${project.projectId}`}
                    >
                      {PROJECTS_RECYCLE_BIN_ROW_AUDIT_TRAIL_LINK_LABEL}
                    </Link>
                  </div>
                </EnterpriseTableCell>
                <EnterpriseTableCell className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Restore project ${project.name}`}
                    aria-describedby={
                      !canRestoreExecute
                        ? `projects-recycle-bin-restore-disabled-hint-${workspace.workspaceId}`
                        : undefined
                    }
                    data-testid="projects-recycle-bin-restore"
                    disabled={!canRestoreExecute || restoreBusyRow === rowKey}
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

  const [retentionDays, setRetentionDays] = useState<number | null>(null);

  const [rows, setRows] = useState<WorkspaceBinRow[]>([]);

  const [restoreBusyRow, setRestoreBusyRow] = useState<string | null>(null);

  const [pendingRestore, setPendingRestore] = useState<ProjectsRecycleBinPendingRestore | null>(null);

  const [restoreFeedback, setRestoreFeedback] = useState<ProjectsRecycleBinFeedback | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        RECYCLE_BIN_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setRows([]);
        setError(await readApiFailureMessage(res));

        return;
      }

      const json: unknown = await res.json();
      const parsed = coerceRecycleBinPayload(json);
      setRetentionDays(parsed.retentionDays);
      setRows(parsed.workspaces);
    } catch {
      setRows([]);
      setError(PROJECTS_RECYCLE_BIN_LOAD_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function restoreProject(workspaceId: string, projectId: string): Promise<void> {
    setRestoreBusyRow(`${workspaceId}:${projectId}`);
    setRestoreFeedback(null);

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
        setRestoreFeedback({ kind: "success", message: "Project restored." });
        setPendingRestore(null);

        await reload();

        return;
      }

      if (res.status === 409) {
        setRestoreFeedback({
          kind: "conflict",
          message: "Another active project already uses this name in the workspace — rename or remove it first.",
        });
        setPendingRestore(null);

        return;
      }

      if (res.status === 404) {
        setRestoreFeedback({
          kind: "error",
          message: "Project was not found or may have already been permanently removed.",
        });
        setPendingRestore(null);

        return;
      }

      setRestoreFeedback({ kind: "error", message: await readApiFailureMessage(res) });
      setPendingRestore(null);
    } finally {
      setRestoreBusyRow(null);
    }
  }

  const pageDescription = recycleBinPageDescription(retentionDays);

  return (
    <OperatorPageContainer
      variant="settings"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="projects-recycle-bin-page"
    >
      <ProjectsRecycleBinPageHeader
        loading={loading}
        subtitle={pageDescription}
        onRefresh={() => {
          setRestoreFeedback(null);
          void reload();
        }}
      />
      <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="projects-recycle" />
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="projects-recycle-bin-restore-residue-honesty"
      >
        {PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY}
      </p>
      {!isAuthorityLoading && !canRestoreExecute ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Restore requires Execute authority — you can browse deleted projects below, but restoring is unavailable for this
          signed-in principal.
        </p>
      ) : null}

      {error !== null ? (
        <div
          className={cn(DESIGN_TOKENS.callout.blocked, "space-y-2 px-3 py-3")}
          role="alert"
          data-testid="projects-recycle-bin-error"
        >
          <StatusTag kind="blocked" label={PROJECTS_RECYCLE_BIN_LOAD_ERROR_STATUS_LABEL} />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{error}</p>
        </div>
      ) : null}

      {restoreFeedback !== null ? (
        <div
          className={cn(recycleBinFeedbackCalloutClass(restoreFeedback.kind), "space-y-2 px-3 py-3")}
          role={restoreFeedback.kind === "success" ? "status" : "alert"}
          data-testid="projects-recycle-bin-restore-message"
          data-feedback-kind={restoreFeedback.kind}
        >
          <StatusTag
            kind={recycleBinFeedbackStatusKind(restoreFeedback.kind)}
            label={restoreFeedbackStatusLabel(restoreFeedback.kind)}
          />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{restoreFeedback.message}</p>
        </div>
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

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="projects-recycle-bin-audit-note">
        {PROJECTS_RECYCLE_BIN_AUDIT_TRAIL_ATTRIBUTION_NOTE}{" "}
        <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.nav}>
          audit trail
        </Link>
        .
      </p>
    </OperatorPageContainer>
  );
}
