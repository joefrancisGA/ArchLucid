import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  consumeOperatorHomeRunsSnapshotStale,
  markOperatorHomeRunsSnapshotStale,
  notifyOperatorHomeLifecycleRefresh,
  subscribeOperatorHomeLifecycleRefresh,
} from "@/lib/operator/operator-home-lifecycle-notify";

describe("operator-home-lifecycle-notify", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("marks and consumes a stale runs snapshot flag once", () => {
    expect(consumeOperatorHomeRunsSnapshotStale()).toBe(false);

    markOperatorHomeRunsSnapshotStale();

    expect(consumeOperatorHomeRunsSnapshotStale()).toBe(true);
    expect(consumeOperatorHomeRunsSnapshotStale()).toBe(false);
  });

  it("notifies lifecycle refresh subscribers", () => {
    const listener = vi.fn();

    const unsubscribe = subscribeOperatorHomeLifecycleRefresh(listener);
    notifyOperatorHomeLifecycleRefresh();

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    notifyOperatorHomeLifecycleRefresh();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
