"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  type ArchitectureDraftCustomerStatus,
} from "@/lib/architecture-draft-status";
import {
  listArchitectureDraftRegistryEntries,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import {
  architectureDraftPath,
  ARCHITECTURES_NEW_PATH,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function statusTagKind(status: ArchitectureDraftCustomerStatus): "ready" | "in-progress" | "needs-attention" {
  if (status === "ready-for-review") {
    return "ready";
  }

  if (status === "archived") {
    return "needs-attention";
  }

  return "in-progress";
}

function formatUpdatedLabel(updatedUtc: string): string {
  return new Date(updatedUtc).toLocaleString();
}

/** Client-side architecture draft registry — resume saved work without mixing drafts into reviews. */
export function ArchitectureDraftListClient(): React.JSX.Element {
  const [entries, setEntries] = useState<ArchitectureDraftRegistryEntry[]>([]);

  useEffect(() => {
    setEntries(listArchitectureDraftRegistryEntries());
  }, []);

  if (entries.length === 0) {
    return (
      <div className="space-y-3" data-testid="architecture-draft-list-empty">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          No saved architecture drafts yet. Start one to capture your system design and return later.
        </p>
        <Button type="button" variant="primary" size="sm" asChild>
          <Link href={ARCHITECTURES_NEW_PATH}>{CREATE_ARCHITECTURE_LABEL}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="architecture-draft-list">
      <ul className="m-0 list-none space-y-3 p-0">
        {entries.map((entry) => (
          <li
            key={entry.architectureId}
            className="rounded-lg border border-al-border-subtle bg-al-surface-raised p-4"
            data-testid={`architecture-draft-row-${entry.architectureId}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className={cn("m-0 font-medium text-al-text-primary")}>{entry.displayName}</p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
                  Owner: {entry.ownerLabel} · Updated {formatUpdatedLabel(entry.lastUpdatedUtc)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag
                    kind={statusTagKind(entry.customerStatus)}
                    label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
                  />
                  {entry.linkedReviewId !== null ? (
                    <Link
                      href={reviewDetailPath(entry.linkedReviewId)}
                      className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium text-teal-800 underline dark:text-teal-300")}
                    >
                      Review linked
                    </Link>
                  ) : (
                    <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>No review yet</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={architectureDraftPath(entry.architectureId)}>Continue editing</Link>
                </Button>
                {entry.linkedReviewId === null && entry.customerStatus !== "archived" ? (
                  <Button type="button" variant="primary" size="sm" asChild>
                    <Link href={startReviewFromArchitectureHref(entry.architectureId)}>Start review</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
