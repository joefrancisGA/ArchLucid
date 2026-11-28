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

  it("keeps valid pins when stored rows are malformed", () => {
    const key = "securenow-pinned-accelerator-paths:t1:w1";
    const alpha = { href: "/a", label: "A" };
    const bravo = { href: "/b", label: "B" };
    window.localStorage.setItem(key, JSON.stringify([
      alpha, null, { href: 42, label: "invalid" }, { href: "/missing" }, bravo,
    ]));

    expect(readSecureNowPinnedAcceleratorPaths(scope)).toEqual([alpha, bravo]);
    unpinSecureNowAcceleratorPath(scope, alpha.href);
    expect(readSecureNowPinnedAcceleratorPaths(scope)).toEqual([bravo]);

    const charlie = { href: "/c", label: "C" };
    pinSecureNowAcceleratorPath(scope, charlie);
    expect(readSecureNowPinnedAcceleratorPaths(scope)).toEqual([charlie, bravo]);
  });

  it("unpins by href", () => {
    pinSecureNowAcceleratorPath(scope, { href: "/d", label: "D" });
    unpinSecureNowAcceleratorPath(scope, "/d");

    expect(readSecureNowPinnedAcceleratorPaths(scope).some((row) => row.href === "/d")).toBe(false);
  });
});
