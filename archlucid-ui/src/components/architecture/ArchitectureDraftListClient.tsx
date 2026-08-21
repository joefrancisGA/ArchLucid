"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ArchitecturesHubListSkeleton } from "@/app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSkeleton";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftResumeControl } from "@/components/architecture/ArchitectureDraftResumeControl";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
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
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { StatusTag } from "@/components/ui/status-tag";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import {
  useArchitectureDraftRegistryEntries,
  useArchitectureDraftRegistryHydrated,
} from "@/hooks/use-architecture-draft-registry-entries";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
  formatArchitectureDraftCreatedLabel,
  type ArchitectureDraftCustomerStatus,
} from "@/lib/architecture/architecture-draft-status";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  architectureDraftPath,
  ARCHITECTURES_NEW_PATH,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURES_HUB_EMPTY_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_TITLE,
  ARCHITECTURES_HUB_EMPTY_TITLE,
  ARCHITECTURES_HUB_FILTER_ALL_LABEL,
  ARCHITECTURES_HUB_FILTER_ARCHIVED_LABEL,
  ARCHITECTURES_HUB_FILTER_DRAFT_LABEL,
  ARCHITECTURES_HUB_FILTER_NO_REVIEW_LABEL,
  ARCHITECTURES_HUB_FILTER_READY_LABEL,
  ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER,
  ARCHITECTURES_HUB_PAGE_TITLE,
  ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL,
  ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL,
  ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL,
  ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL,
  ARCHITECTURES_HUB_TABLE_ACTIONS_COLUMN,
  ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN,
  ARCHITECTURES_HUB_TABLE_OWNER_COLUMN,
  ARCHITECTURES_HUB_TABLE_REVIEW_COLUMN,
  ARCHITECTURES_HUB_TABLE_STATUS_COLUMN,
  ARCHITECTURES_HUB_TABLE_UPDATED_COLUMN,
} from "@/lib/architectures-hub-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { cn } from "@/lib/utils";

type ArchitectureFilterId =
  | "all"
  | ArchitectureDraftCustomerStatus
  | "no-review";

type ArchitectureSortId = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

const FILTER_OPTIONS: ReadonlyArray<{ id: ArchitectureFilterId; label: string }> = [
  { id: "all", label: ARCHITECTURES_HUB_FILTER_ALL_LABEL },
  { id: "draft", label: ARCHITECTURES_HUB_FILTER_DRAFT_LABEL },
  { id: "ready-for-review", label: ARCHITECTURES_HUB_FILTER_READY_LABEL },
  { id: "no-review", label: ARCHITECTURES_HUB_FILTER_NO_REVIEW_LABEL },
  { id: "archived", label: ARCHITECTURES_HUB_FILTER_ARCHIVED_LABEL },
];

const SORT_OPTIONS: ReadonlyArray<{ id: ArchitectureSortId; label: string }> = [
  { id: "updated-desc", label: ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL },
  { id: "updated-asc", label: ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL },
  { id: "name-asc", label: ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL },
  { id: "name-desc", label: ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL },
];

function formatUpdatedListLabel(updatedUtc: string): string {
  const absolute = formatArchitectureDraftCreatedLabel(updatedUtc);
  const relative = formatRelativeTime(updatedUtc);

  if (absolute === null) {
    return `Updated ${relative}`;
  }

  return `Updated ${absolute} · ${relative}`;
}

function matchesSearch(entry: ArchitectureDraftRegistryEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const haystack = [entry.displayName, entry.ownerLabel, entry.architectureId].join(" ").toLowerCase();

  return haystack.includes(normalized);
}

function matchesFilter(entry: ArchitectureDraftRegistryEntry, filter: ArchitectureFilterId): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "no-review") {
    return entry.linkedReviewId === null;
  }

  return entry.customerStatus === filter;
}

function countForFilter(
  entries: readonly ArchitectureDraftRegistryEntry[],
  filter: ArchitectureFilterId,
): number {
  return entries.filter((entry) => matchesFilter(entry, filter)).length;
}

function compareEntries(
  left: ArchitectureDraftRegistryEntry,
  right: ArchitectureDraftRegistryEntry,
  sort: ArchitectureSortId,
): number {
  if (sort === "updated-desc") {
    return right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc);
  }

  if (sort === "updated-asc") {
    return left.lastUpdatedUtc.localeCompare(right.lastUpdatedUtc);
  }

  if (sort === "name-asc") {
    return left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" });
  }

  return right.displayName.localeCompare(left.displayName, undefined, { sensitivity: "base" });
}

function ArchitectureFilterChip(props: {
  readonly option: { id: ArchitectureFilterId; label: string };
  readonly count: number;
  readonly selected: boolean;
  readonly onSelect: (id: ArchitectureFilterId) => void;
}): React.JSX.Element {
  const labelWithCount = `${props.option.label} (${props.count})`;

  return (
    <FilterChip
      className={buyerFilterChipClass(props.selected, false)}
      aria-pressed={props.selected}
      aria-label={`Filter architectures: ${labelWithCount}`}
      onClick={() => props.onSelect(props.option.id)}
    >
      {labelWithCount}
    </FilterChip>
  );
}

/** Client-side architecture draft registry — search, filter, and sort saved drafts. */
export function ArchitectureDraftListClient(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const isHydrated = useArchitectureDraftRegistryHydrated();
  const entries = useArchitectureDraftRegistryEntries();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ArchitectureFilterId>("all");
  const [activeSort, setActiveSort] = useState<ArchitectureSortId>("updated-desc");
  const scopeRecord = useOperatorScopeRecord();
  const workspaceScopeTeaching = resolveWorkspaceScopeEmptyTeachingForHub({
    listEmpty: entries.length === 0,
    scopeRecord,
    objectPlural: "architecture drafts",
  });

  const filterCounts = useMemo(() => {
    const counts = new Map<ArchitectureFilterId, number>();

    for (const option of FILTER_OPTIONS) {
      counts.set(option.id, countForFilter(entries, option.id));
    }

    return counts;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => matchesSearch(entry, searchQuery) && matchesFilter(entry, activeFilter))
      .slice()
      .sort((left, right) => compareEntries(left, right, activeSort));
  }, [activeFilter, activeSort, entries, searchQuery]);

  if (!isHydrated) {
    return <ArchitecturesHubListSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="mt-4 space-y-4" data-testid="architecture-draft-list-empty">
        {!buyerPolishedShell ? (
          <>
            <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="architecture-drafts" />
            <PathChooserCreateObjectVocabularyRail currentSurfaceId="architecture-drafts" />
          </>
        ) : null}
        {workspaceScopeTeaching !== null ? (
          <WorkspaceScopeEmptyTeaching
            title={workspaceScopeTeaching.title}
            body={workspaceScopeTeaching.body}
            ctaLabel={workspaceScopeTeaching.ctaLabel}
          />
        ) : (
          <EnterpriseCompactEmptyState
            title={ARCHITECTURES_HUB_EMPTY_TITLE}
            description={ARCHITECTURES_HUB_EMPTY_BODY}
            actions={[
              {
                label: CREATE_ARCHITECTURE_LABEL,
                href: ARCHITECTURES_NEW_PATH,
                variant: "primary",
              },
            ]}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4" data-testid="architecture-draft-list">
      {!buyerPolishedShell ? (
        <>
          <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="architecture-drafts" />
          <PathChooserCreateObjectVocabularyRail currentSurfaceId="architecture-drafts" />
        </>
      ) : null}
      <ArchitectureDraftGuidanceDisclosure />
      <div
        className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center"
        data-testid="architecture-draft-list-toolbar"
      >
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER}
          aria-label={ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER}
          className="w-full lg:min-w-[12rem] lg:max-w-xs lg:flex-1"
          data-testid="architecture-draft-list-search"
        />
        <div className="flex flex-wrap items-center gap-3">
          {FILTER_OPTIONS.map((option) => (
            <ArchitectureFilterChip
              key={option.id}
              option={option}
              count={filterCounts.get(option.id) ?? 0}
              selected={activeFilter === option.id}
              onSelect={setActiveFilter}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <label htmlFor="architecture-draft-list-sort" className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Sort by
          </label>
          <select
            id="architecture-draft-list-sort"
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value as ArchitectureSortId)}
            className={cn(
              "rounded-md border border-al-border-subtle bg-al-surface-raised px-2 py-1",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="architecture-draft-list-sort"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <EnterpriseCompactEmptyState
          title={ARCHITECTURES_HUB_EMPTY_FILTER_TITLE}
          description={ARCHITECTURES_HUB_EMPTY_FILTER_BODY}
        />
      ) : (
        <EnterpriseTable
          ariaLabel={ARCHITECTURES_HUB_PAGE_TITLE}
          data-testid="architecture-draft-list-table"
        >
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_STATUS_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_OWNER_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_UPDATED_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_REVIEW_COLUMN}</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>{ARCHITECTURES_HUB_TABLE_ACTIONS_COLUMN}</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {filteredEntries.map((entry) => {
              const updatedLabel = formatUpdatedListLabel(entry.lastUpdatedUtc);

              return (
                <EnterpriseTableRow
                  key={entry.architectureId}
                  data-testid={`architecture-draft-row-${entry.architectureId}`}
                >
                  <EnterpriseTableCell>
                    <div className="space-y-1">
                      <Link
                        href={architectureDraftPath(entry.architectureId)}
                        className={OPERATOR_LINK.nav}
                      >
                        {entry.displayName}
                      </Link>
                      {buyerPolishedShell ? (
                        <div data-testid={`architecture-draft-id-${entry.architectureId}`}>
                          <TechnicalIdDisclosure label="Draft id" value={entry.architectureId} />
                        </div>
                      ) : null}
                    </div>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <StatusTag
                      kind={architectureDraftCustomerStatusTagKind(entry.customerStatus)}
                      label={ARCHITECTURE_DRAFT_STATUS_LABELS[entry.customerStatus]}
                    />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{entry.ownerLabel}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <time dateTime={entry.lastUpdatedUtc}>{updatedLabel}</time>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {entry.linkedReviewId !== null ? (
                      <Link
                        href={reviewDetailPath(entry.linkedReviewId)}
                        className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
                      >
                        Review linked
                      </Link>
                    ) : (
                      <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>No review yet</span>
                    )}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <div className="flex flex-wrap gap-2">
                      <ArchitectureDraftResumeControl
                        architectureId={entry.architectureId}
                        label="Continue editing"
                        source="architectures-list"
                        testId={`architecture-draft-continue-${entry.architectureId}`}
                        ariaLabel={`Continue editing ${entry.displayName}`}
                      />
                      {entry.linkedReviewId === null && entry.customerStatus !== "archived" ? (
                        <Button type="button" variant="primary" size="sm" asChild>
                          <Link href={startReviewFromArchitectureHref(entry.architectureId)}>Start review</Link>
                        </Button>
                      ) : null}
                    </div>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </div>
  );
}
