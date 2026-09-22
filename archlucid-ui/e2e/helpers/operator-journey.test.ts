import { describe, expect, it } from "vitest";

import { reviewDetailErrorShellMessage } from "./operator-journey";

describe("review detail readiness diagnostics", () => {
  it("includes visible error-shell text for the early terminal failure", () => {
    expect(reviewDetailErrorShellMessage("Something went wrong API returned 503")).toBe(
      "Review detail error shell is visible (Something went wrong). Visible text: Something went wrong API returned 503",
    );
  });
});
