import { describe, expect, it } from "vitest";

import { resolveScopeGateOpenTransition } from "./scope-gate-open-setter";

describe("resolveScopeGateOpenTransition", () => {
  it("still syncs URL when ref already matches resolved but React state lags after external URL sync", () => {
    const { resolved, shouldSyncUrl } = resolveScopeGateOpenTransition(true, false);

    expect(resolved).toBe(false);
    expect(shouldSyncUrl).toBe(true);
  });

  it("does not sync URL when state is already at the resolved gate value", () => {
    expect(resolveScopeGateOpenTransition(false, false).shouldSyncUrl).toBe(false);
    expect(resolveScopeGateOpenTransition(true, true).shouldSyncUrl).toBe(false);
    expect(resolveScopeGateOpenTransition(true, (open) => !open).shouldSyncUrl).toBe(true);
  });
});
