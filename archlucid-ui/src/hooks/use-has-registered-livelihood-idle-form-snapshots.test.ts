import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useHasRegisteredLivelihoodIdleFormSnapshots } from "@/hooks/use-has-registered-livelihood-idle-form-snapshots";
import {
  clearLivelihoodIdleFormSnapshotRegistryForTests,
  registerLivelihoodIdleFormSnapshot,
} from "@/lib/auth/livelihood-idle-form-snapshot";

describe("useHasRegisteredLivelihoodIdleFormSnapshots (LP-12)", () => {
  afterEach(() => {
    clearLivelihoodIdleFormSnapshotRegistryForTests();
  });

  it("tracks dirty livelihood snapshot registration", () => {
    const { result } = renderHook(() => useHasRegisteredLivelihoodIdleFormSnapshots());

    expect(result.current).toBe(false);

    act(() => {
      registerLivelihoodIdleFormSnapshot("finding-inspect-disposition:finding-001", {
        surfaceId: "finding-inspect-disposition",
        returnPath: "/architecture/reviews/run-001/findings/finding-001",
        entityKey: "finding-001",
        fields: { disposition: "accepted" },
        savedAtUtc: "2026-01-01T00:00:00.000Z",
      });
    });

    expect(result.current).toBe(true);

    act(() => {
      registerLivelihoodIdleFormSnapshot("finding-inspect-disposition:finding-001", null);
    });

    expect(result.current).toBe(false);
  });
});
