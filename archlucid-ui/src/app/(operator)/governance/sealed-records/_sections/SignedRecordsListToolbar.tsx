"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  signedRecordsListSearchHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-search";
import {
  signedRecordsListIntegrityHrefFromSearch,
  type SignedRecordsListIntegrityFilter,
} from "@/lib/signed-records/signed-records-list-integrity-url";
import { cn } from "@/lib/utils";

import {
  SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY,
  SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_PLACEHOLDER,
  SIGNED_RECORDS_LIST_TOOLBAR_ARIA_LABEL,
} from "./signed-records-list-copy";

export type { SignedRecordsListIntegrityFilter } from "@/lib/signed-records/signed-records-list-integrity-url";

export type SignedRecordsListToolbarProps = {
  readonly searchQuery: string;
  readonly integrityFilter: SignedRecordsListIntegrityFilter;
  readonly disabled?: boolean;
  readonly onSearchQueryChange: (value: string) => void;
};

const INTEGRITY_OPTIONS: readonly { id: SignedRecordsListIntegrityFilter; label: string }[] = [
  { id: "all", label: SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY },
  { id: "sealed", label: "Finalized" },
  { id: "needs-attention", label: "Needs attention" },
  { id: "unavailable", label: "Record unavailable" },
];

/** Client-side register controls — filters the loaded page; server cursor paging stays unchanged. */
export function SignedRecordsListToolbar(props: SignedRecordsListToolbarProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "";
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
          onKeyDown={(event) => {
            if (event.key === "Escape" && props.searchQuery.trim().length > 0) {
              event.preventDefault();
              const clearedHref = signedRecordsListSearchHrefFromSearch(searchParams.toString(), "");
              router.replace(clearedHref, { scroll: false });
              props.onSearchQueryChange("");
            }
          }}
        />
      </div>
      <div className="min-w-[200px] space-y-1">
        <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.label)} id="signed-records-list-integrity-filter-label">
          {SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL}
        </span>
        <FilterChipGroup
          aria-labelledby="signed-records-list-integrity-filter-label"
          className="flex flex-wrap gap-2"
          data-testid="signed-records-list-integrity-filter"
        >
          {INTEGRITY_OPTIONS.map((option) => {
            const selected = props.integrityFilter === option.id;

            return (
              <FilterChip
                key={option.id}
                href={
                  controlsDisabled
                    ? undefined
                    : signedRecordsListIntegrityHrefFromSearch(currentSearch, option.id, pathname)
                }
                scroll={false}
                className={buyerFilterChipClass(selected, controlsDisabled)}
                aria-current={selected ? "page" : undefined}
                disabled={controlsDisabled}
              >
                {option.label}
              </FilterChip>
            );
          })}
        </FilterChipGroup>
      </div>
    </div>
  );
}
