import { describe, expect, it } from "vitest";

import { getDocHref } from "./help-topics";

describe("getDocHref", () => {
  it("maps known repo paths to in-app help routes", () => {
    expect(getDocHref("docs/library/FIRST_RUN_WIZARD.md")).toBe("/help/getting-started");
    expect(getDocHref("docs/library/ALERTS.md")).toBe("/help/alerts");
  });

  it("preserves hash fragments on in-app routes", () => {
    expect(getDocHref("docs/library/customer-facing/OPERATOR_QUICKSTART.md#operator-ui")).toBe(
      "/help/getting-started#operator-ui",
    );
  });

  it("strips leading slash from the path before resolving", () => {
    expect(getDocHref("/docs/library/COMPARISON_REPLAY.md")).toBe("/help/comparison-replay");
  });

  it("returns null for unmapped doc paths", () => {
    expect(getDocHref("/docs/X.md")).toBeNull();
    expect(getDocHref("docs/BUILD.md")).toBeNull();
  });

  it("maps internal runbooks registered in product documentation", () => {
    expect(getDocHref("docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBe("/help/first-value-20-minutes");
  });

  it("returns null when docPath is empty or whitespace", () => {
    expect(getDocHref("")).toBeNull();
    expect(getDocHref("   ")).toBeNull();
  });
});
