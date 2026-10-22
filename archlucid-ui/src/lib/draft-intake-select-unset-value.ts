/** Sentinel for Radix Select when draft-intake string state is unset (SelectItem values cannot be empty). */
export const DRAFT_INTAKE_SELECT_UNSET_VALUE = "__unset__";

export function resolveDraftIntakeSelectValue(value: string): string {
  return value.length > 0 ? value : DRAFT_INTAKE_SELECT_UNSET_VALUE;
}

export function resolveDraftIntakeSelectChange(selected: string): string {
  return selected === DRAFT_INTAKE_SELECT_UNSET_VALUE ? "" : selected;
}
