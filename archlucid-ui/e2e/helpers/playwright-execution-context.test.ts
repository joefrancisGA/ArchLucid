import { describe, expect, it } from "vitest";

import { isDestroyedPlaywrightExecutionContext } from "./playwright-execution-context";

describe("isDestroyedPlaywrightExecutionContext", () => {
  it("matches Playwright navigation teardown errors", () => {
    expect(
      isDestroyedPlaywrightExecutionContext(
        new Error("page.evaluate: Execution context was destroyed, most likely because of a navigation."),
      ),
    ).toBe(true);
  });

  it("rejects unrelated failures", () => {
    expect(isDestroyedPlaywrightExecutionContext(new Error("POST /api/auth/bff-session failed 403"))).toBe(false);
    expect(isDestroyedPlaywrightExecutionContext("timeout")).toBe(false);
  });
});
