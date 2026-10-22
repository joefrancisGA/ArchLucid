"use client";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUYER_SPONSOR_SCORECARD_WINDOW_HELP } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SponsorTimeRange } from "@/lib/sponsor/sponsor-time-range";

const SPONSOR_TIME_RANGE_OPTIONS: readonly { readonly value: SponsorTimeRange; readonly label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "Last quarter" },
  { value: "year", label: "Last year" },
  { value: "all", label: "All time" },
];

export type SponsorTimeRangeSelectProps = {
  readonly id: string;
  readonly value: SponsorTimeRange;
  readonly onValueChange: (value: SponsorTimeRange) => void;
  readonly triggerTestId?: string;
  readonly showWindowHelp?: boolean;
};

/** Shared sponsor time-range control for ROI trend and scorecard surfaces (TB-1536). */
export function SponsorTimeRangeSelect({
  id,
  value,
  onValueChange,
  triggerTestId = "sponsor-time-range-select",
  showWindowHelp = true,
}: SponsorTimeRangeSelectProps): React.JSX.Element {
  return (
    <div className="shrink-0">
      <Label htmlFor={id} className={cn("mb-1 block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Time range
      </Label>
      <Select value={value} onValueChange={(next) => onValueChange(next as SponsorTimeRange)}>
        <SelectTrigger
          id={id}
          className={cn("w-[11rem]", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={triggerTestId}
        >
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {SPONSOR_TIME_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showWindowHelp ? (
        <p
          className={cn("m-0 mt-1 max-w-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="exec-roi-trend-window-help"
        >
          {BUYER_SPONSOR_SCORECARD_WINDOW_HELP}
        </p>
      ) : null}
    </div>
  );
}
