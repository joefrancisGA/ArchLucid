import { describe, expect, it } from "vitest";

import { buildGraphRedirectPath } from "./legacy-architecture-graph-redirect";

describe("buildGraphRedirectPath (TB-1808)", () => {
  it("returns bare /graph when search is empty", () => {
    expect(buildGraphRedirectPath({})).toBe("/graph");
  });

  it("copies scalar query params such as runId", () => {
    expect(buildGraphRedirectPath({ runId: "run-42" })).toBe("/graph?runId=run-42");
  });

  it("appends repeated keys from array values", () => {
    const path = buildGraphRedirectPath({ scope: ["read", "write"] });

    expect(path).toContain("/graph?");
    expect(path).toContain("scope=read");
    expect(path).toContain("scope=write");
  });
});
