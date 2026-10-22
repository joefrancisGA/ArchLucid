import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildGraphRedirectPath } from "./legacy-architecture-graph-redirect";

describe("buildGraphRedirectPath (TB-1808 / TB-1810)", () => {
  it("returns bare evidence graph path when search is empty", () => {
    expect(buildGraphRedirectPath({})).toBe(EVIDENCE_GRAPH_PATH);
  });

  it("copies scalar query params such as runId", () => {
    expect(buildGraphRedirectPath({ runId: "run-42" })).toBe(`${EVIDENCE_GRAPH_PATH}?runId=run-42`);
  });

  it("appends repeated keys from array values", () => {
    const path = buildGraphRedirectPath({ scope: ["read", "write"] });

    expect(path).toContain(`${EVIDENCE_GRAPH_PATH}?`);
    expect(path).toContain("scope=read");
    expect(path).toContain("scope=write");
  });
});
