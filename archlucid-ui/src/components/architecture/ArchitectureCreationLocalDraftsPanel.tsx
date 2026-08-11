"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
} from "@/lib/architecture-draft-status";
import { trackArchitectureDraftResumeClick } from "@/lib/architecture-draft-resume-telemetry";
import { architectureDraftPath, ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { CONTINUE_DRAFT_LABEL } from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE,
  ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

const ARCHITECTURE_CREATION_RESUME_PREVIEW_LIMIT = 3;

function formatAbsoluteUpdatedTitle(updatedUtc: string): string {
  const parsed = parseIsoUtcMs(updatedUtc);

  if (Number.isNaN(parsed)) {
    return updatedUtc;
  }

  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolveResumeSectionTitle(entryCount: number): string {
  if (entryCount === 1) {
    return ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE;
  }

  return ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE;
}

/** `/architectures/new` — browser-local draft resume or empty guidance (TB-1459). */
export function ArchitectureCreationLocalDraftsPanel(): React.JSX.Element | null {
  const entries = useArchitectureDraftRegistryEntries();
  const [registryHydrated, setRegistryHydrated] = useState(false);

  useEffect(() => {
    setRegistryHydrated(true);
  }, []);

  if (!registryHydrated) {
    return null;
  }

  if (entries.length === 0) {
    return (
      <p
        className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-creation-no-drafts-guidance"
      >
        {ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE}
      </p>
    );
  }

  const previewEntries = entries.slice(0, ARCHITECTURE_CREATION_RESUME_PREVIEW_LIMIT);
  const sectionTitle = resolveResumeSectionTitle(entries.length);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/20"
      data-testid="architecture-creation-resume-drafts"
      aria-label={sectionTitle}
    >
      <h2 className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>{sectionTitle}</h2>
      <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY}
      </p>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {previewEntries.map((entry) => {
          const absoluteUpdated = formatAbsoluteUpdatedTitle(entry.lastUpdatedUtc);

          return (
            <li
              key={entry.architectureId}
              className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
              data-testid={`architecture-creation-resume-draft-${entry.architectureId}`}
            >
              <p className={cn("m-0 line-clamp-2 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {entry.displayName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusTag
                  kind={architectureDraftCustomerStatusTagKind(entry.customerStatus)}
                  label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
                />
                <span
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
                >
                  Updated {formatRelativeTime(entry.lastUpdatedUtc)} ({absoluteUpdated})
                </span>
              </div>
              <div className="mt-2">
                <Button variant="primary" size="sm" asChild>
                  <Link
                    href={architectureDraftPath(entry.architectureId)}
                    title={entry.displayName}
                    data-testid={`architecture-creation-resume-draft-continue-${entry.architectureId}`}
                    onClick={() => {
                      trackArchitectureDraftResumeClick("architectures-new", entry.architectureId);
                    }}
                  >
                    {CONTINUE_DRAFT_LABEL}
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ARCHITECTURES_LIST_PATH} data-testid="architecture-creation-resume-drafts-view-all">
            {ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL}
          </Link>
        </Button>
      </div>
    </section>
  );
}
