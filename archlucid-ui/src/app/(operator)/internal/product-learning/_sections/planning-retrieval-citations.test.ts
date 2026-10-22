import { describe, expect, it } from "vitest";

import {
  isPlanningRetrievalCitation,
  listPlanningRetrievalCitations,
  planningRetrievalCitationKey,
} from "./planning-retrieval-citations";

describe("planning-retrieval-citations", () => {
  it("accepts the generated citation shape", () => {
    expect(
      isPlanningRetrievalCitation({
        signalId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        themeKey: "pattern:api-gateway",
        snippet: "Prior pilot signal about gateway latency",
      }),
    ).toBe(true);
  });

  it("accepts nullable theme and snippet fields", () => {
    expect(
      isPlanningRetrievalCitation({
        signalId: "signal-1",
        themeKey: null,
        snippet: null,
      }),
    ).toBe(true);
  });

  it("rejects non-objects and mistyped fields", () => {
    expect(isPlanningRetrievalCitation(null)).toBe(false);
    expect(isPlanningRetrievalCitation("signal")).toBe(false);
    expect(isPlanningRetrievalCitation({ signalId: 12 })).toBe(false);
    expect(isPlanningRetrievalCitation({ themeKey: 1 })).toBe(false);
    expect(isPlanningRetrievalCitation({ snippet: true })).toBe(false);
  });

  it("lists only typed citations from unknown arrays", () => {
    const listed = listPlanningRetrievalCitations([
      { signalId: "signal-1", snippet: "keep" },
      "skip",
      { signalId: 9 },
      null,
    ]);

    expect(listed).toEqual([{ signalId: "signal-1", snippet: "keep" }]);
  });

  it("returns an empty list when the value is not an array", () => {
    expect(listPlanningRetrievalCitations(undefined)).toEqual([]);
    expect(listPlanningRetrievalCitations({ signalId: "signal-1" })).toEqual([]);
  });

  it("prefers signalId then themeKey then snippet for list keys", () => {
    expect(planningRetrievalCitationKey({ signalId: "s1", themeKey: "t1", snippet: "n1" }, 0)).toBe("s1");
    expect(planningRetrievalCitationKey({ themeKey: "t1", snippet: "n1" }, 1)).toBe("t1");
    expect(planningRetrievalCitationKey({ snippet: "n1" }, 2)).toBe("n1");
    expect(planningRetrievalCitationKey({}, 3)).toBe("citation-3");
  });
});
