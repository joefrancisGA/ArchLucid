import { describe, expect, it } from "vitest";

import {
  formatTrustEvidenceInstant,
  humanizeTrustEvidenceInstants,
  isTechnicalTrustEvidenceClause,
  splitTrustEvidenceDetail,
  trustEvidenceFieldTitleForDisplay,
} from "./trust-evidence-technical-detail";

describe("formatTrustEvidenceInstant", () => {
  it("formats a .NET seven-digit fractional instant as readable UTC", () => {
    expect(formatTrustEvidenceInstant("2026-08-09T17:18:02.2700188Z")).toBe("9 Aug 2026, 17:18 UTC");
  });

  it("omits the UTC suffix when the instant carries no zone", () => {
    expect(formatTrustEvidenceInstant("2026-01-31T04:05:06")).toBe("31 Jan 2026, 04:05");
  });

  it("returns non-timestamp input unchanged", () => {
    expect(formatTrustEvidenceInstant("not a timestamp")).toBe("not a timestamp");
  });
});

describe("humanizeTrustEvidenceInstants", () => {
  it("rewrites every instant inside a sentence", () => {
    expect(humanizeTrustEvidenceInstants("Version 1: committed 2026-08-09T17:18:02.2700188Z")).toBe(
      "Version 1: committed 9 Aug 2026, 17:18 UTC",
    );
  });

  it("leaves text without instants untouched", () => {
    expect(humanizeTrustEvidenceInstants("19 events")).toBe("19 events");
  });
});

describe("isTechnicalTrustEvidenceClause", () => {
  it("flags UUIDs, semver strings, and identifier keywords", () => {
    expect(isTechnicalTrustEvidenceClause("Bundle id db2fd94d-33df-4737-ac0e-fc38a96a2620")).toBe(true);
    expect(isTechnicalTrustEvidenceClause("Manifest version v1.0.0")).toBe(true);
    expect(isTechnicalTrustEvidenceClause("graph nodes: 0")).toBe(true);
    expect(isTechnicalTrustEvidenceClause("linked trace ids: 3")).toBe(true);
  });

  it("does not flag buyer-facing prose", () => {
    expect(isTechnicalTrustEvidenceClause("19 events")).toBe(false);
    expect(isTechnicalTrustEvidenceClause("Version 1: committed 2026-08-09T17:18:02Z")).toBe(false);
  });

  it("treats an empty clause as non-technical", () => {
    expect(isTechnicalTrustEvidenceClause("   ")).toBe(false);
  });
});

describe("splitTrustEvidenceDetail", () => {
  it("withholds every technical clause from the display copy", () => {
    const split = splitTrustEvidenceDetail("Manifest version v1.0.0; graph nodes: 0; linked trace ids: 3");

    expect(split.display).toBeNull();
    expect(split.technical).toBe("Manifest version v1.0.0; graph nodes: 0; linked trace ids: 3");
  });

  it("keeps prose clauses and humanizes their timestamps", () => {
    const split = splitTrustEvidenceDetail("Version 1: committed 2026-08-09T17:18:02.2700188Z");

    expect(split.display).toBe("Version 1: committed 9 Aug 2026, 17:18 UTC");
    expect(split.technical).toBeNull();
  });

  it("partitions a mixed detail line", () => {
    const split = splitTrustEvidenceDetail("19 events; Bundle id db2fd94d-33df-4737-ac0e-fc38a96a2620");

    expect(split.display).toBe("19 events");
    expect(split.technical).toBe("Bundle id db2fd94d-33df-4737-ac0e-fc38a96a2620");
  });

  it("returns nulls for blank and nullish detail", () => {
    expect(splitTrustEvidenceDetail(null)).toEqual({ display: null, technical: null });
    expect(splitTrustEvidenceDetail(undefined)).toEqual({ display: null, technical: null });
    expect(splitTrustEvidenceDetail("  ")).toEqual({ display: null, technical: null });
  });
});

describe("trustEvidenceFieldTitleForDisplay", () => {
  it("replaces the persisted bundle id label with a buyer-safe title", () => {
    expect(trustEvidenceFieldTitleForDisplay("Persisted artifact bundle id")).toBe("Deliverables bundle");
  });

  it("returns other titles trimmed but unchanged", () => {
    expect(trustEvidenceFieldTitleForDisplay(" Audit trail ")).toBe("Audit trail");
  });
});
