import { InteractiveChip, type InteractiveChipProps } from "@/components/ui/interactive-chip";

export type FilterChipProps = InteractiveChipProps;

/**
 * @deprecated Prefer {@link InteractiveChip} for filter/action chips.
 */
export function FilterChip(props: FilterChipProps) {
  return <InteractiveChip {...props} />;
}
