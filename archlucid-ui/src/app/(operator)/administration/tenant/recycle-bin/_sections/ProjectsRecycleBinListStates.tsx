"use client";

import Link from "next/link";

import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_HREF,
  PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_LINK_LABEL,
  PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_HREF,
  PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_LINK_LABEL,
  PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE,
  PROJECTS_RECYCLE_BIN_LOADING_NOTICE,
} from "@/lib/projects-recycle-bin-page-copy";
import { recycleBinEmptyStateBody, recycleBinEmptyStateRetentionHint } from "@/lib/projects-recycle-bin-payload";
import { cn } from "@/lib/utils";

/** First-load and refresh loading chrome for Projects recycle bin (TB-1291). */
export function ProjectsRecycleBinLoadingNotice(): React.JSX.Element {
  return (
    <div aria-busy="true" data-testid="projects-recycle-bin-loading-notice">
      <OperatorLoadingNotice>{PROJECTS_RECYCLE_BIN_LOADING_NOTICE}</OperatorLoadingNotice>
    </div>
  );
}

export type ProjectsRecycleBinEmptyStateProps = {
  readonly retentionDays: number | null;
};

/** Happy-empty recycle bin with quiet status and delete-surface orientation (TB-1291 / TB-1181). */
export function ProjectsRecycleBinEmptyState(props: ProjectsRecycleBinEmptyStateProps): React.JSX.Element {
  const emptyBody = recycleBinEmptyStateBody(props.retentionDays);
  const retentionHint = recycleBinEmptyStateRetentionHint(props.retentionDays);

  return (
    <div data-testid="projects-recycle-bin-empty-state">
      <OperatorEmptyState title={PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE}>
        <div className={cn(OPERATOR_LAYOUT.sectionHeadingStack)}>
          <StatusTag
            data-testid="projects-recycle-bin-empty-status"
            kind="ready"
            label={PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL}
          />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{emptyBody}</p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Delete a project from{" "}
            <Link
              className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-400"
              href={PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_HREF}
              data-testid="projects-recycle-bin-empty-delete-surface-link"
            >
              {PROJECTS_RECYCLE_BIN_EMPTY_DELETE_SURFACE_LINK_LABEL}
            </Link>{" "}
            {retentionHint}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Soft-deleted projects are also removed from the active list in{" "}
            <Link
              className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-400"
              href={PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_HREF}
            >
              {PROJECTS_RECYCLE_BIN_EMPTY_ARCHITECTURES_LINK_LABEL}
            </Link>
            .
          </p>
        </div>
      </OperatorEmptyState>
    </div>
  );
}
