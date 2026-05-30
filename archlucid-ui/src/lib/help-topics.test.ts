import { describe, expect, it } from "vitest";

import { getDocHref } from "./help-topics";

describe("getDocHref", () => {
  it("maps known repo paths to in-app help routes", () => {
    expect(getDocHref("docs/library/FIRST_RUN_WIZARD.md")).toBe("/help/getting-started");
    expect(getDocHref("docs/library/ALERTS.md")).toBe("/help/alerts");
  });

  it("preserves hash fragments on in-app routes", () => {
    expect(getDocHref("docs/library/OPERATOR_QUICKSTART.md#operator-ui")).toBe(
      "/help/getting-started#operator-ui",
    );
  });

  it("strips leading slash from the path before resolving", () => {
    expect(getDocHref("/docs/library/COMPARISON_REPLAY.md")).toBe("/help/comparison-replay");
  });

  it("returns help index for unknown doc paths", () => {
    expect(getDocHref("/docs/X.md")).toBe("/help");
  });

  it("returns null when docPath is empty or whitespace", () => {
    expect(getDocHref("")).toBeNull();
    expect(getDocHref("   ")).toBeNull();
  });
});
