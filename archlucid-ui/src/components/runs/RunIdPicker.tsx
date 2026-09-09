"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RunSummary } from "@/types/authority";

import { RunIdPickerDropdownList } from "./RunIdPickerDropdownList";
import { useRunIdPicker } from "./use-run-id-picker";

type RunIdPickerProps = {
  value: string;
  onChange: (runId: string) => void;
  /** Called when the user explicitly selects a run from the dropdown (not on every keystroke). */
  onSelect?: (runId: string) => void;
  placeholder: string;
  label: string;
  /** Overrides default picker label typography (e.g. semibold form labels on search surfaces). */
  labelClassName?: string;
  projectId?: string;
  inputId?: string;
  /** When true, empty/failed run lists use the two-row Compare demo pair when demo spine fallback is enabled. */
  forCompare?: boolean;
  /** When true, only committed runs are listed (capped at 20). */
  committedOnly?: boolean;
  /**
   * When true (default), loads runs on mount and auto-selects the demo / first run when `value` is empty —
   * use `false` for paired Compare pickers when the parent prefills both sides.
   */
  preferAutoPick?: boolean;
  /** When true, primary line is a buyer-facing title; technical run id is shown underneath. */
  useBuyerFacingRunLabels?: boolean;
  /** Invoked when the user picks a row from the list (not on every keystroke). */
  onRunPicked?: (summary: RunSummary) => void;
  /** When set, limits picker rows to reviews of this architecture (AO-29). */
  architectureId?: string;
  /** When true, focus the combo input on mount (operator list vs compare-entry ergonomics). */
  autoFocus?: boolean;
};

/**
 * Run ID text field with debounced typeahead over recent runs (server list + local filter).
 */
export function RunIdPicker({
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  labelClassName,
  projectId = "default",
  inputId,
  forCompare = false,
  committedOnly = false,
  preferAutoPick = true,
  useBuyerFacingRunLabels = false,
  onRunPicked,
  architectureId,
  autoFocus = false,
}: RunIdPickerProps) {
  const picker = useRunIdPicker({
    value,
    onChange,
    onSelect,
    projectId,
    inputId,
    forCompare,
    committedOnly,
    preferAutoPick,
    useBuyerFacingRunLabels,
    onRunPicked,
    architectureId,
  });

  const popupContainerClass =
    (cn("absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-md dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.body));

  return (
    <div ref={picker.containerRef} className="relative max-w-xl">
      <Label
        htmlFor={picker.controlId}
        className={cn(
          "mb-1 block",
          labelClassName ?? cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body),
        )}
      >
        {label}
      </Label>
      <Input
        id={picker.controlId}
        role="combobox"
        value={picker.query}
        placeholder={placeholder}
        title={
          useBuyerFacingRunLabels
            ? "Type to filter reviews by title or id. Pick from the list or paste a review id directly."
            : undefined
        }
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={picker.open}
        aria-controls={picker.open ? `${picker.controlId}-listbox` : undefined}
        aria-activedescendant={
          picker.open && picker.activeIndex >= 0 && picker.filtered[picker.activeIndex] !== undefined
            ? `${picker.controlId}-option-${picker.activeIndex}`
            : undefined
        }
        autoFocus={autoFocus}
        onFocus={picker.handleFocus}
        /**
         * Options use `onMouseDown` + `preventDefault` so the input keeps focus while picking. That means another
         * click on the input does not refire `onFocus`, so the list would stay closed — reopen on click as well.
         */
        onClick={picker.handleFocus}
        onBlur={picker.scheduleClose}
        onKeyDown={picker.handleKeyDown}
        onChange={(e) => {
          picker.handleChange(e.target.value);
        }}
      />
      {picker.showRunPopup ? (
        <RunIdPickerDropdownList
          controlId={picker.controlId}
          popupContainerClass={popupContainerClass}
          popupUsesListbox={picker.popupUsesListbox}
          loading={picker.loading}
          loadError={picker.loadError}
          showNoMatches={picker.showNoMatches}
          filtered={picker.filtered}
          hiddenMatchCount={picker.hiddenMatchCount}
          activeIndex={picker.activeIndex}
          value={picker.value}
          useBuyerFacingRunLabels={picker.useBuyerFacingRunLabels}
          retrying={picker.runsQuery.isFetching}
          onRetry={() => void picker.runsQuery.refetch()}
          onSelectRun={picker.selectRun}
        />
      ) : null}
    </div>
  );
}
