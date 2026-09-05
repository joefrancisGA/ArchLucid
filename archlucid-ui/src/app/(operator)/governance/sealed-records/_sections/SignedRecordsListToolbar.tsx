"use client";

import { useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  signedRecordsListDateRangeHrefFromSearch,
  type SignedRecordsListDateRangePreset,
} from "@/lib/signed-records/signed-records-list-date-range-url";
import {
  signedRecordsListIntegrityHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-integrity-url";

import {
  SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY,
  SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_PLACEHOLDER,
  SIGNED_RECORDS_LIST_TOOLBAR_ARIA_LABEL,
} from "./signed-records-list-copy";

const INTEGRITY_CHIP_OPTIONS: readonly { readonly id: SignedRecordsListIntegrityFilter; readonly label: string }[] = [
  { id: "all", label: SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY },
  { id: "sealed", label: "Finalized" },
  { id: "needs-attention", label: "Needs attention" },
  { id: "unavailable", label: "Record unavailable" },
];

export type SignedRecordsListIntegrityFilter = "all" | "sealed" | "needs-attention" | "unavailable";

const DATE_RANGE_OPTIONS: readonly { readonly id: SignedRecordsListDateRangePreset | null; readonly label: string }[] = [
  { id: null, label: "All dates" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export type SignedRecordsListToolbarProps = {
  readonly searchQuery: string;
  readonly integrityFilter: SignedRecordsListIntegrityFilter;
  readonly dateRangePreset: SignedRecordsListDateRangePreset | null;
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly disabled?: boolean;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onIntegrityFilterChange: (value: SignedRecordsListIntegrityFilter) => void;
  readonly onCustomFromUtcChange: (value: string) => void;
  readonly onCustomToUtcChange: (value: string) => void;
};

/** Client-side register controls — filters the loaded page; server cursor paging stays unchanged. */
export function SignedRecordsListToolbar(props: SignedRecordsListToolbarProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const controlsDisabled = props.disabled === true;

  return (
    <div
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label={SIGNED_RECORDS_LIST_TOOLBAR_ARIA_LABEL}
      data-testid="signed-records-list-toolbar"
    >
      <div className="min-w-[220px] flex-1 space-y-1">
        <Label htmlFor="signed-records-list-search" className={OPERATOR_TYPOGRAPHY.label}>
          {SIGNED_RECORDS_LIST_SEARCH_LABEL}
        </Label>
        <Input
          id="signed-records-list-search"
          type="search"
          value={props.searchQuery}
          disabled={controlsDisabled}
          placeholder={SIGNED_RECORDS_LIST_SEARCH_PLACEHOLDER}
          data-testid="signed-records-list-search-input"
          onChange={(event) => props.onSearchQueryChange(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className={OPERATOR_TYPOGRAPHY.label}>{SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL}</Label>
        <FilterChipGroup aria-label="Filter sealed records by integrity" className="flex flex-wrap gap-2">
          {INTEGRITY_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              href={signedRecordsListIntegrityHrefFromSearch(currentSearch, option.id)}
              scroll={false}
              className={buyerFilterChipClass(props.integrityFilter === option.id, controlsDisabled)}
              aria-current={props.integrityFilter === option.id ? "page" : undefined}
              disabled={controlsDisabled}
              data-testid={`signed-records-list-integrity-${option.id}`}
              onClick={() => props.onIntegrityFilterChange(option.id)}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="space-y-1">
        <Label className={OPERATOR_TYPOGRAPHY.label}>Sealed date range</Label>
        <FilterChipGroup aria-label="Filter sealed records by date range" className="flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <FilterChip
              key={option.id ?? "all"}
              href={signedRecordsListDateRangeHrefFromSearch(
                signedRecordsListIntegrityHrefFromSearch(currentSearch, props.integrityFilter),
                option.id,
              )}
              scroll={false}
              className={buyerFilterChipClass(props.dateRangePreset === option.id, controlsDisabled)}
              aria-current={props.dateRangePreset === option.id ? "page" : undefined}
              disabled={controlsDisabled}
              data-testid={`signed-records-list-range-${option.id ?? "all"}`}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="space-y-1">
        <Label htmlFor="signed-records-list-from" className={OPERATOR_TYPOGRAPHY.label}>
          From (custom)
        </Label>
        <Input
          id="signed-records-list-from"
          type="date"
          value={props.fromUtc}
          disabled={controlsDisabled}
          data-testid="signed-records-list-from-input"
          onChange={(event) => props.onCustomFromUtcChange(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signed-records-list-to" className={OPERATOR_TYPOGRAPHY.label}>
          To (custom)
        </Label>
        <Input
          id="signed-records-list-to"
          type="date"
          value={props.toUtc}
          disabled={controlsDisabled}
          data-testid="signed-records-list-to-input"
          onChange={(event) => props.onCustomToUtcChange(event.target.value)}
        />
      </div>
    </div>
  );
}
