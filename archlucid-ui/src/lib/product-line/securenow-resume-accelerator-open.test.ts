import { beforeEach, describe, expect, it } from "vitest";

import { readSecureNowRecentAcceleratorOpens, recordSecureNowAcceleratorOpen } from "@/lib/product-line/securenow-resume-accelerator-open";

describe("securenow-resume-accelerator-open", () => {
  const scope = { tenantId: "t1", workspaceId: "w1" };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores recent opens newest-first", () => {
    recordSecureNowAcceleratorOpen(scope, { href: "/a", label: "A" });
    recordSecureNowAcceleratorOpen(scope, { href: "/b", label: "B" });
    const recent = readSecureNowRecentAcceleratorOpens(scope);

    expect(recent[0]?.href).toBe("/b");
    expect(recent[1]?.href).toBe("/a");
  });
});
