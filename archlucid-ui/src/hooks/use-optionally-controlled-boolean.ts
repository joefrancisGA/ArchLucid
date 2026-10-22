"use client";

import { useCallback, useState } from "react";

export type ExternallyManagedBoolean = {
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  readonly managedExternally: true;
};

/** Parent-owned toggle when `managedExternally` is true; otherwise local state. */
export function useOptionallyControlledBoolean(
  external: ExternallyManagedBoolean | undefined,
  defaultInternal = false,
): readonly [boolean, (value: boolean) => void] {
  const [internalValue, setInternalValue] = useState(defaultInternal);
  const managedExternally = external?.managedExternally === true;
  const value = managedExternally ? external.value : internalValue;

  const setValue = useCallback(
    (next: boolean) => {
      if (managedExternally) {
        external.onChange(next);
      } else {
        setInternalValue(next);
      }
    },
    [external, managedExternally],
  );

  return [value, setValue] as const;
}
