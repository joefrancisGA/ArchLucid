import { describe, expect, it } from "vitest";

import { mapConfigLintReadiness } from "@/lib/map-config-lint-readiness";

describe("mapConfigLintReadiness", () => {
  it("returns blocked when blocking findings exist", () => {
    const copy = mapConfigLintReadiness({
      canAdmin: true,
      lint: { blockingCount: 2, advisoryCount: 0, loadFailed: false },
    });

    expect(copy.status).toBe("blocked");
  });

  it("returns attention when only advisory findings exist", () => {
    const copy = mapConfigLintReadiness({
      canAdmin: true,
      lint: { blockingCount: 0, advisoryCount: 1, loadFailed: false },
    });

    expect(copy.status).toBe("attention");
  });
});
