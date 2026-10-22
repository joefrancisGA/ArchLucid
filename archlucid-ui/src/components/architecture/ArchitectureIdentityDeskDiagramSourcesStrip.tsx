"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { useArchitectureDeskDiagramSourcesQuery } from "@/hooks/use-architecture-desk-diagram-sources-query";
import {
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_EMPTY,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_ERROR_LABEL,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_LATEST_REVIEW_LABEL,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_RETRY_LABEL,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { formatArchitectureDeskDiagramSourceRow } from "@/lib/architecture-spine/read-architecture-desk-diagram-sources";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureIdentityDeskDiagramSourcesStripProps = {
  readonly latestReviewId: string | null | undefined;
};

/** AS-044: compact latest-review diagram source strip on the architecture identity desk. */
export function ArchitectureIdentityDeskDiagramSourcesStrip(
  props: ArchitectureIdentityDeskDiagramSourcesStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const latestReviewId = props.latestReviewId?.trim() ?? "";
  const enabled = isWorkingMode && latestReviewId.length > 0;
  const query = useArchitectureDeskDiagramSourcesQuery(latestReviewId, { enabled });
  const rows = query.data ?? [];

  if (!enabled) {
    return null;
  }

  if (query.isLoading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-diagram-sources-heading"
        data-testid="architecture-identity-desk-diagram-sources-loading"
      >
        <h2 id="architecture-identity-diagram-sources-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_TITLE}
        </h2>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_LOADING_LABEL}</p>
      </section>
    );
  }

  if (query.isError) {
    const blockedReason = query.blockedReason;

    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-diagram-sources-heading"
        data-testid="architecture-identity-desk-diagram-sources-error"
      >
        <h2 id="architecture-identity-diagram-sources-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_TITLE}
        </h2>
        <p
          className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}
          role={blockedReason !== null ? "alert" : undefined}
        >
          {blockedReason ?? ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_ERROR_LABEL}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void query.refetch()}
        >
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_RETRY_LABEL}
        </Button>
      </section>
    );
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="architecture-identity-diagram-sources-heading"
      data-testid="architecture-identity-desk-diagram-sources"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="architecture-identity-diagram-sources-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_TITLE}
        </h2>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_LATEST_REVIEW_LABEL}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-identity-desk-diagram-sources-empty">
          {ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_EMPTY}
        </p>
      ) : (
        <ul
          className={cn("m-0 mt-1 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-identity-desk-diagram-sources-list"
        >
          {rows.map((row) => (
            <li key={row.sourceKey}>{formatArchitectureDeskDiagramSourceRow(row)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
