"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { handleFilterChipGroupKeyDown } from "@/components/ui/filter-chip-group-keyboard";

export type FilterChipGroupProps = {
  readonly children: ReactNode;
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly className?: string;
  readonly "data-testid"?: string;
};

/** `role="group"` wrapper with arrow-key roving focus across child FilterChip links/buttons. */
export function FilterChipGroup(props: FilterChipGroupProps): React.JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);

  function onGroupKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (groupRef.current === null) {
      return;
    }

    handleFilterChipGroupKeyDown(event, groupRef.current);
  }

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      className={props.className}
      data-testid={props["data-testid"]}
      onKeyDown={onGroupKeyDown}
    >
      {props.children}
    </div>
  );
}
