import { describe, expect, it, beforeEach } from "vitest";

import {
  pinSecureNowAcceleratorPath,
  readSecureNowPinnedAcceleratorPaths,
  SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD,
  SECURENOW_PINNED_ACCELERATOR_PATHS_LIMIT,
  unpinSecureNowAcceleratorPath,
} from "@/lib/product-line/securenow-pinned-accelerator-paths";

const scope = { tenantId: "t1", workspaceId: "w1" };

describe("securenow-pinned-accelerator-paths", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not imply entitlement in lead copy", () => {
    expect(SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD).toContain("not tenant bookmarks");
  });

  it("caps pinned paths at three", () => {
    pinSecureNowAcceleratorPath(scope, { href: "/a", label: "A" });
    pinSecureNowAcceleratorPath(scope, { href: "/b", label: "B" });
    pinSecureNowAcceleratorPath(scope, { href: "/c", label: "C" });
    pinSecureNowAcceleratorPath(scope, { href: "/d", label: "D" });

    const pinned = readSecureNowPinnedAcceleratorPaths(scope);

    expect(pinned.length).toBe(SECURENOW_PINNED_ACCELERATOR_PATHS_LIMIT);
    expect(pinned.some((row) => row.href === "/d")).toBe(true);
    expect(pinned.some((row) => row.href === "/a")).toBe(false);
  });

  it("unpins by href", () => {
    unpinSecureNowAcceleratorPath(scope, "/d");

    expect(readSecureNowPinnedAcceleratorPaths(scope).some((row) => row.href === "/d")).toBe(false);
  });
});
