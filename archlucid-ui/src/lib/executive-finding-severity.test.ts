import { describe, expect, it } from "vitest";

import { severityFromTrace, severitySortRank } from "./executive-finding-severity";

describe("severityFromTrace", () => {
  it("maps empty to em dash", () => {
    expect(severityFromTrace("")).toBe("—");
    expect(severityFromTrace(null)).toBe("—");
  });

  it("maps critical/high/severe to High (legacy display bucket)", () => {
    expect(severityFromTrace("Critical")).toBe("High");
    expect(severityFromTrace("high")).toBe("High");
  });

  it("maps medium", () => {
    expect(severityFromTrace("Medium confidence")).toBe("Medium");
  });

  it("maps low", () => {
    expect(severityFromTrace("Low")).toBe("Low");
  });
});

describe("severitySortRank", () => {
  it("orders critical before high before medium", () => {
    expect(severitySortRank("Critical")).toBeLessThan(severitySortRank("High"));
    expect(severitySortRank("High")).toBeLessThan(severitySortRank("Medium"));
    expect(severitySortRank("Medium")).toBeLessThan(severitySortRank("Low"));
  });

  it("puts empty last", () => {
    expect(severitySortRank("High")).toBeLessThan(severitySortRank(""));
  });
});
