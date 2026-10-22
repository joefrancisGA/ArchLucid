import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RunDetailFindingsSortKind } from "@/components/findings/run-detail-findings-toolbar-presentation";

export function FindingsSortSelect(props: {
  readonly id: string;
  readonly sort: RunDetailFindingsSortKind;
  readonly onSortChange: (sort: RunDetailFindingsSortKind) => void;
}): React.JSX.Element {
  return (
    <div>
      <Label htmlFor={props.id} className={OPERATOR_TYPOGRAPHY.helper}>
        Sort
      </Label>
      <select
        id={props.id}
        className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        value={props.sort}
        onChange={(event) => {
          props.onSortChange(event.target.value as RunDetailFindingsSortKind);
        }}
      >
        <option value="trust-then-severity">Trust then severity</option>
        <option value="severity-desc">Severity (high first)</option>
        <option value="severity-asc">Severity (low first)</option>
        <option value="title-asc">Title (AΓÇôZ)</option>
      </select>
    </div>
  );
}
