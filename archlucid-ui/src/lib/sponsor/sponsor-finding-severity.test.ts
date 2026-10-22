import { describe, expect, it } from "vitest";

import { severityFromTrace, severitySortRank } from "./sponsor-finding-severity";

describe("severityFromTrace", () => {
  it("maps empty to Not recorded", () => {
    expect(severityFromTrace("")).toBe("Not recorded");
    expect(severityFromTrace(null)).toBe("Not recorded");
  });

  it("keeps critical and severe distinct from high", () => {
    expect(severityFromTrace("Critical")).toBe("Critical");
    expect(severityFromTrace("severe")).toBe("Severe");
    expect(severityFromTrace("high")).toBe("High");
  });

  it("maps medium", () => {
    expect(severityFromTrace("Medium confidence")).toBe("Medium");
  });

  it("maps low", () => {
    expect(severityFromTrace("Low")).toBe("Low");
  });

  it("does not treat unrelated substrings as severity buckets", () => {
    expect(severityFromTrace("Allowlist misconfiguration")).toBe("Allowlist misconfiguration");
    expect(severitySortRank("Allowlist misconfiguration")).toBe(50);
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
