"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import {
  ASK_WORKSPACE_ALL_REVIEWS_VALUE,
  findRunSummaryById,
} from "@/components/ask-run-id-picker-helpers";
import type { RunSummary } from "@/types/authority";

export type AskRunIdPickerReviewListSelectProps = {
  readonly value: string;
  readonly onChange: (runId: string) => void;
  readonly items: readonly RunSummary[];
  readonly selectControlId: string;
  readonly disabled: boolean;
};

export function AskRunIdPickerReviewListSelect({
  value,
  onChange,
  items,
  selectControlId,
  disabled,
}: AskRunIdPickerReviewListSelectProps) {
  const trimmedValue = value.trim();
  const selectedRow = findRunSummaryById(items, value);
  const selectValue =
    trimmedValue.length === 0
      ? ASK_WORKSPACE_ALL_REVIEWS_VALUE
      : (selectedRow?.runId ?? (trimmedValue.length > 0 ? trimmedValue : undefined));
  const showOrphanDeepLink = trimmedValue.length > 0 && selectedRow === undefined;

  const handleValueChange = (next: string) => {
    if (next === ASK_WORKSPACE_ALL_REVIEWS_VALUE) {
      onChange("");

      return;
    }

    onChange(next);
  };

  return (
    <Select disabled={disabled} value={selectValue} onValueChange={handleValueChange}>
      <SelectTrigger id={selectControlId} className="font-mono">
        <SelectValue placeholder="All reviews in workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ASK_WORKSPACE_ALL_REVIEWS_VALUE}>All reviews in workspace</SelectItem>
        {items.map((row) => (
          <SelectItem key={row.runId} value={row.runId}>
            {buyerFacingReviewTitleFromSummary(row)}
          </SelectItem>
        ))}
        {showOrphanDeepLink ? <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
