"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY,
  SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_LABEL,
  SIGNED_RECORDS_LIST_SEARCH_PLACEHOLDER,
  SIGNED_RECORDS_LIST_TOOLBAR_ARIA_LABEL,
} from "./signed-records-list-copy";

export type SignedRecordsListIntegrityFilter = "all" | "sealed" | "needs-attention" | "unavailable";

export type SignedRecordsListToolbarProps = {
  readonly searchQuery: string;
  readonly integrityFilter: SignedRecordsListIntegrityFilter;
  readonly disabled?: boolean;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onIntegrityFilterChange: (value: SignedRecordsListIntegrityFilter) => void;
};

/** Client-side register controls — filters the loaded page; server cursor paging stays unchanged. */
export function SignedRecordsListToolbar(props: SignedRecordsListToolbarProps): React.JSX.Element {
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
      <div className="min-w-[200px] space-y-1">
        <Label htmlFor="signed-records-list-integrity-filter" className={OPERATOR_TYPOGRAPHY.label}>
          {SIGNED_RECORDS_LIST_FILTER_INTEGRITY_LABEL}
        </Label>
        <Select
          value={props.integrityFilter}
          disabled={controlsDisabled}
          onValueChange={(value) => props.onIntegrityFilterChange(value as SignedRecordsListIntegrityFilter)}
        >
          <SelectTrigger
            id="signed-records-list-integrity-filter"
            className={cn("w-full", OPERATOR_TYPOGRAPHY.body)}
            data-testid="signed-records-list-integrity-filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{SIGNED_RECORDS_LIST_FILTER_ALL_INTEGRITY}</SelectItem>
            <SelectItem value="sealed">Finalized</SelectItem>
            <SelectItem value="needs-attention">Needs attention</SelectItem>
            <SelectItem value="unavailable">Record unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
