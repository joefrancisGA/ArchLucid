import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  type ExternallyManagedBoolean,
  useOptionallyControlledBoolean,
} from "@/hooks/use-optionally-controlled-boolean";

describe("useOptionallyControlledBoolean", () => {
  it("keeps internal state when external control is absent", () => {
    const { result } = renderHook(() => useOptionallyControlledBoolean(undefined));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it("delegates to the parent when managed externally", () => {
    const onChange = vi.fn();
    const external: ExternallyManagedBoolean = {
      value: false,
      onChange,
      managedExternally: true,
    };
    const { result, rerender } = renderHook(
      ({ control }) => useOptionallyControlledBoolean(control),
      { initialProps: { control: external } },
    );

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(onChange).toHaveBeenCalledWith(true);

    rerender({
      control: {
        ...external,
        value: true,
      },
    });

    expect(result.current[0]).toBe(true);
  });
});
