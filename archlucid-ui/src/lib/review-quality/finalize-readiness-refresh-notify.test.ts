import { describe, expect, it, vi } from "vitest";

import {
  notifyFinalizeReadinessRefresh,
  subscribeFinalizeReadinessRefresh,
} from "@/lib/review-quality/finalize-readiness-refresh-notify";

describe("finalize-readiness-refresh-notify", () => {
  it("notifies subscribers scoped to the same run id", () => {
    const listener = vi.fn();

    subscribeFinalizeReadinessRefresh("run-123", listener);
    notifyFinalizeReadinessRefresh("run-123");
    notifyFinalizeReadinessRefresh("run-456");

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
