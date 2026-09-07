"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ArchitecturesHubListSkeleton } from "@/app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSkeleton";
import { ArchitectureDraftCloneSnapshotControl } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { ArchitectureDraftDeleteControl } from "@/components/architecture/ArchitectureDraftDeleteControl";
import { ArchitectureDraftContinueLastRow } from "@/components/architecture/ArchitectureDraftContinueLastRow";
import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ArchitectureDraftResumeControl } from "@/components/architecture/ArchitectureDraftResumeControl";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
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
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftCustomerStatusTagKind,
} from "@/lib/architecture/architecture-draft-status";
import {
  architectureDraftPath,
  ARCHITECTURES_NEW_PATH,
  resolveArchitectureReviewHref,
  reviewDetailPath,
  startReviewFromDraftContextHref,
} from "@/lib/architecture/architecture-routes";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import {
  ARCHITECTURES_HUB_EMPTY_BODY,
  ARCHITECTURES_HUB_EMPTY_TITLE,
  ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER,
  ARCHITECTURES_HUB_PAGE_TITLE,
  ARCHITECTURES_HUB_TABLE_ACTIONS_COLUMN,
  ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN,
  ARCHITECTURES_HUB_TABLE_OWNER_COLUMN,
  ARCHITECTURES_HUB_TABLE_REVIEW_COLUMN,
  ARCHITECTURES_HUB_TABLE_STATUS_COLUMN,
  ARCHITECTURES_HUB_TABLE_UPDATED_COLUMN,
} from "@/lib/architectures-hub-copy";
import {
  ARCHITECTURES_HUB_FILTER_OPTIONS,
  architecturesHubFilterEmptyReason,
  architecturesHubFilterHrefFromSearch,
  architecturesHubSortHrefFromSearch,
  type ArchitectureHubFilterId,
} from "@/lib/architecture/architectures-hub-filters";
import {
  architecturesHubDomainHrefFromSearch,
  architecturesHubOwnerHrefFromSearch,
} from "@/lib/architecture/architectures-hub-owner-domain-url";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  DESIGN_TOKENS,
  OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import type { ArchitectureDraftListController } from "@/components/architecture/use-architecture-draft-list";

function ArchitectureHubFilterChip(props: {
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

type ArchitectureDraftListShellProps = {
  readonly controller: ArchitectureDraftListController;
};

export function ArchitectureDraftListShell(props: ArchitectureDraftListShellProps): React.JSX.Element {
  const {
    buyerPolishedShell,
    isHydrated,
    entries,
    searchQuery,
    setSearchQuery,
    currentSearch,
    activeFilter,
    activeSort,
    activeOwner,
    activeDomain,
    filterCounts,
    ownerOptions,
    domainOptions,
    filteredEntries,
    clearSearch,
    continueLastDraft,
    workspaceScopeTeaching,
    sortOptions,
  } = props.controller;
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);

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
            <ArchitectureHubFilterChip
              key={option.id}
              option={option}
              count={filterCounts.get(option.id) ?? 0}
              selected={activeFilter === option.id}
              href={architecturesHubFilterHrefFromSearch(currentSearch, option.id)}
            />
          ))}
        </FilterChipGroup>
        {ownerOptions.length > 0 ? (
          <FilterChipGroup aria-label="Filter architectures by owner" className="flex flex-wrap items-center gap-2">
            <FilterChip
              href={architecturesHubOwnerHrefFromSearch(currentSearch, "")}
              scroll={false}
              className={buyerFilterChipClass(activeOwner.length === 0, false)}
              aria-current={activeOwner.length === 0 ? "page" : undefined}
            >
              All owners
            </FilterChip>
            {ownerOptions.map((owner) => (
              <FilterChip
                key={owner}
                href={architecturesHubOwnerHrefFromSearch(currentSearch, owner)}
                scroll={false}
                className={buyerFilterChipClass(activeOwner === owner, false)}
                aria-current={activeOwner === owner ? "page" : undefined}
              >
                {owner}
              </FilterChip>
            ))}
          </FilterChipGroup>
        ) : null}
        {domainOptions.length > 0 ? (
          <FilterChipGroup aria-label="Filter architectures by domain" className="flex flex-wrap items-center gap-2">
            <FilterChip
              href={architecturesHubDomainHrefFromSearch(currentSearch, "")}
              scroll={false}
              className={buyerFilterChipClass(activeDomain.length === 0, false)}
              aria-current={activeDomain.length === 0 ? "page" : undefined}
            >
              All domains
            </FilterChip>
            {domainOptions.map((domain) => (
              <FilterChip
                key={domain}
                href={architecturesHubDomainHrefFromSearch(currentSearch, domain)}
                scroll={false}
                className={buyerFilterChipClass(activeDomain === domain, false)}
                aria-current={activeDomain === domain ? "page" : undefined}
              >
                {domain}
              </FilterChip>
            ))}
          </FilterChipGroup>
        ) : null}
        <FilterChipGroup aria-label="Sort architectures" className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {sortOptions.map((option) => (
            <FilterChip
              key={option.id}
              href={architecturesHubSortHrefFromSearch(currentSearch, option.id)}
              scroll={false}
              className={buyerFilterChipClass(activeSort === option.id, false)}
              aria-current={activeSort === option.id ? "page" : undefined}
              data-testid={`architecture-draft-list-sort-${option.id}`}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
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
              const parentArchitectureId = entry.parentArchitectureId?.trim() ?? "";
              const linkedReviewHref =
                entry.linkedReviewId !== null
                  ? workingMode && parentArchitectureId.length > 0
                    ? resolveArchitectureReviewHref(entry.linkedReviewId, parentArchitectureId)
                    : reviewDetailPath(entry.linkedReviewId)
                  : null;
              const startReviewHref = startReviewFromDraftContextHref({
                parentArchitectureId,
                legacyDraftId: entry.draftId,
              });

              return (
                <EnterpriseTableRow
                  key={entry.draftId}
                  data-testid={`architecture-draft-row-${entry.draftId}`}
                >
                  <EnterpriseTableCell>
                    <div className="space-y-1">
                      <Link
                        href={architectureDraftPath(entry.draftId)}
                        className={OPERATOR_LINK.nav}
                      >
                        {entry.displayName}
                      </Link>
                      {buyerPolishedShell ? (
                        <div data-testid={`architecture-draft-id-${entry.draftId}`}>
                          <TechnicalIdDisclosure label="Draft id" value={entry.draftId} />
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
                        href={linkedReviewHref ?? reviewDetailPath(entry.linkedReviewId)}
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
                      {entry.linkedReviewId !== null ? (
                        <Button type="button" variant="primary" size="sm" asChild>
                          <Link href={linkedReviewHref ?? reviewDetailPath(entry.linkedReviewId)}>
                            Continue in review
                          </Link>
                        </Button>
                      ) : (
                        <ArchitectureDraftResumeControl
                          draftId={entry.draftId}
                          label="Continue editing"
                          source="architectures-list"
                          testId={`architecture-draft-continue-${entry.draftId}`}
                          ariaLabel={`Continue editing ${entry.displayName}`}
                        />
                      )}
                      {entry.linkedReviewId !== null ? (
                        <ArchitectureDraftCloneSnapshotControl
                          draftId={entry.draftId}
                          testId={`architecture-draft-clone-snapshot-${entry.draftId}`}
                        />
                      ) : null}
                      {entry.linkedReviewId === null && entry.customerStatus !== "archived" ? (
                        <Button type="button" variant="primary" size="sm" asChild>
                          <Link href={startReviewHref}>Start review</Link>
                        </Button>
                      ) : null}
                      <ArchitectureDraftDeleteControl
                        draftId={entry.draftId}
                        displayName={entry.displayName}
                        linkedReviewId={entry.linkedReviewId}
                        customerStatus={entry.customerStatus}
                        createdByUserId={entry.createdByUserId ?? null}
                        testId={`architecture-draft-delete-${entry.draftId}`}
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
