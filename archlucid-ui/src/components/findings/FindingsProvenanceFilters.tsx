import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import {
  GROUNDING_FILTER_OPTIONS,
  ORIGIN_FILTER_OPTIONS,
} from "@/components/findings/run-detail-findings-toolbar-presentation";

export function FindingsProvenanceFilters(props: {
  readonly idPrefix: string;
  readonly originFilter: FindingOriginFilter;
  readonly onOriginFilterChange: (filter: FindingOriginFilter) => void;
  readonly groundingFilter: FindingGroundingFilter;
  readonly onGroundingFilterChange: (filter: FindingGroundingFilter) => void;
}): React.JSX.Element {
  return (
    <>
      <div>
        <Label htmlFor={`${props.idPrefix}-origin`} className={OPERATOR_TYPOGRAPHY.helper}>
          Origin
        </Label>
        <select
          id={`${props.idPrefix}-origin`}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          value={props.originFilter}
          onChange={(event) => {
            props.onOriginFilterChange(event.target.value as FindingOriginFilter);
          }}
          data-testid={`${props.idPrefix}-origin`}
        >
          {ORIGIN_FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${props.idPrefix}-grounding`} className={OPERATOR_TYPOGRAPHY.helper}>
          Grounding
        </Label>
        <select
          id={`${props.idPrefix}-grounding`}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          value={props.groundingFilter}
          onChange={(event) => {
            props.onGroundingFilterChange(event.target.value as FindingGroundingFilter);
          }}
          data-testid={`${props.idPrefix}-grounding`}
        >
          {GROUNDING_FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
