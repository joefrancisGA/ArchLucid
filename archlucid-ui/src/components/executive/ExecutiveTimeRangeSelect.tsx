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
import { BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ExecutiveTimeRange } from "@/lib/executive/executive-time-range";

const EXECUTIVE_TIME_RANGE_OPTIONS: readonly { readonly value: ExecutiveTimeRange; readonly label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "Last quarter" },
  { value: "year", label: "Last year" },
  { value: "all", label: "All time" },
];

export type ExecutiveTimeRangeSelectProps = {
  readonly id: string;
  readonly value: ExecutiveTimeRange;
  readonly onValueChange: (value: ExecutiveTimeRange) => void;
  readonly triggerTestId?: string;
  readonly showWindowHelp?: boolean;
};

/** Shared executive time-range control for ROI trend and scorecard surfaces (TB-1536). */
export function ExecutiveTimeRangeSelect({
  id,
  value,
  onValueChange,
  triggerTestId = "executive-time-range-select",
  showWindowHelp = true,
}: ExecutiveTimeRangeSelectProps): React.JSX.Element {
  return (
    <div className="shrink-0">
      <Label htmlFor={id} className={cn("mb-1 block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Time range
      </Label>
      <Select value={value} onValueChange={(next) => onValueChange(next as ExecutiveTimeRange)}>
        <SelectTrigger
          id={id}
          className={cn("w-[11rem]", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={triggerTestId}
        >
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {EXECUTIVE_TIME_RANGE_OPTIONS.map((option) => (
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
          {BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP}
        </p>
      ) : null}
    </div>
  );
}
