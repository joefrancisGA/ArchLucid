"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ArchitecturesHubListSkeleton } from "@/app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSkeleton";
import { ArchitectureDraftDeleteControl } from "@/components/architecture/ArchitectureDraftDeleteControl";
import { ArchitectureDraftContinueLastRow } from "@/components/architecture/ArchitectureDraftContinueLastRow";
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
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
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
  ARCHITECTURES_HUB_EMPTY_TITLE,
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
import {
  ARCHITECTURES_HUB_FILTER_OPTIONS,
  architecturesHubClearSearchHrefFromSearch,
  architecturesHubFilterEmptyReason,
  architecturesHubFilterHrefFromSearch,
  architecturesHubSearchHrefFromSearch,
  countArchitecturesHubFilterMatches,
  matchesArchitecturesHubFilter,
  matchesArchitecturesHubSearch,
  parseArchitecturesHubFilter,
  parseArchitecturesHubSearchQuery,
  type ArchitectureHubFilterId,
} from "@/lib/architecture/architectures-hub-filters";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import { resolveContinueLastArchitectureDraftEntry } from "@/lib/architecture-draft-continue-last";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { cn } from "@/lib/utils";

type ArchitectureSortId = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

const SORT_OPTIONS: ReadonlyArray<{ id: ArchitectureSortId; label: string }> = [
  { id: "updated-desc", label: ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL },
  { id: "updated-asc", label: ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL },
  { id: "name-asc", label: ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL },
  { id: "name-desc", label: ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL },
];

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
  readonly option: { id: ArchitectureHubFilterId; label: string };
  readonly count: number;
  readonly selected: boolean;
  readonly href: string;
}): React.JSX.Element {
  const disabled = props.option.id !== "all" && props.count === 0;
  const disabledReasonId = `architecture-hub-filter-${props.option.id}-disabled-reason`;
  const labelWithCount = `${props.option.label} (${props.count})`;

  return (
    <span className="inline-flex">
      <FilterChip
        href={disabled ? undefined : props.href}
        scroll={false}
        className={buyerFilterChipClass(props.selected, disabled, props.count === 0)}
        aria-current={props.selected ? "page" : undefined}
        aria-label={`Filter architectures: ${labelWithCount}`}
        aria-describedby={disabled ? disabledReasonId : undefined}
        disabled={disabled}
      >
        {labelWithCount}
      </FilterChip>
      {disabled ? (
        <span id={disabledReasonId} className="sr-only">
          {architecturesHubFilterEmptyReason(props.option.id)}
        </span>
      ) : null}
    </span>
  );
}

/** Client-side architecture draft registry — search, filter, and sort saved drafts. */
export function ArchitectureDraftListClient(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlSearchQuery = parseArchitecturesHubSearchQuery(searchParams.get("q"));
  const activeFilter = parseArchitecturesHubFilter(searchParams.get("filter"));

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const isHydrated = useArchitectureDraftRegistryHydrated();
  const entries = useArchitectureDraftRegistryEntries();
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [activeSort, setActiveSort] = useState<ArchitectureSortId>("updated-desc");
  const scopeRecord = useOperatorScopeRecord();
  const workspaceScopeTeaching = resolveWorkspaceScopeEmptyTeachingForHub({
    listEmpty: entries.length === 0,
    scopeRecord,
    objectPlural: "architecture drafts",
  });

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = architecturesHubSearchHrefFromSearch(searchParams.toString(), searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [router, searchParams, searchQuery]);

  const filterCounts = useMemo(() => {
    const counts = new Map<ArchitectureHubFilterId, number>();

    for (const option of ARCHITECTURES_HUB_FILTER_OPTIONS) {
      counts.set(option.id, countArchitecturesHubFilterMatches(entries, option.id));
    }

    return counts;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(
        (entry) =>
          matchesArchitecturesHubSearch(entry, searchQuery) &&
          matchesArchitecturesHubFilter(entry, activeFilter),
      )
      .slice()
      .sort((left, right) => compareEntries(left, right, activeSort));
  }, [activeFilter, activeSort, entries, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    router.replace(architecturesHubClearSearchHrefFromSearch(currentSearch), { scroll: false });
  }, [currentSearch, router]);

  const continueLastDraft = useMemo(() => resolveContinueLastArchitectureDraftEntry(entries), [entries]);

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
      {continueLastDraft !== null ? <ArchitectureDraftContinueLastRow entry={continueLastDraft} /> : null}
      <ArchitectureDraftGuidanceDisclosure />
      <div
        className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center"
        data-testid="architecture-draft-list-toolbar"
      >
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && searchQuery.trim().length > 0) {
              event.preventDefault();
              clearSearch();
            }
          }}
          placeholder={ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER}
          aria-label={ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER}
          className={cn(
            "w-full lg:min-w-[12rem] lg:max-w-xs lg:flex-1",
            OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS,
          )}
          data-testid="architecture-draft-list-search"
        />
        <FilterChipGroup aria-label="Filter architectures" className="flex flex-wrap items-center gap-3">
          {ARCHITECTURES_HUB_FILTER_OPTIONS.map((option) => (
            <ArchitectureFilterChip
              key={option.id}
              option={option}
              count={filterCounts.get(option.id) ?? 0}
              selected={activeFilter === option.id}
              href={architecturesHubFilterHrefFromSearch(currentSearch, option.id)}
            />
          ))}
        </FilterChipGroup>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <label
            htmlFor="architecture-draft-list-sort"
            className={cn("m-0 shrink-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.nativeControlLabel)}
          >
            Sort by
          </label>
          <select
            id="architecture-draft-list-sort"
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value as ArchitectureSortId)}
            className={cn(
              "h-8 max-w-[12rem] rounded-md border border-al-border-subtle bg-al-surface-raised px-2 text-al-text-primary",
              OPERATOR_TYPOGRAPHY.nativeControlLabel,
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

      {filteredEntries.length > 0 ? (
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
              const updatedAt = formatInventoryUpdatedAtCell(entry.lastUpdatedUtc);

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
                  <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                    <time dateTime={entry.lastUpdatedUtc} title={updatedAt.absoluteTitle}>
                      {updatedAt.display}
                    </time>
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
                      <ArchitectureDraftDeleteControl
                        architectureId={entry.architectureId}
                        displayName={entry.displayName}
                        linkedReviewId={entry.linkedReviewId}
                        customerStatus={entry.customerStatus}
                        createdByUserId={entry.createdByUserId ?? null}
                        testId={`architecture-draft-delete-${entry.architectureId}`}
                      />
                    </div>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      ) : null}
    </div>
  );
}
