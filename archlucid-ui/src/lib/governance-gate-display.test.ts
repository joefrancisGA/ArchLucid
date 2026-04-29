import { describe, expect, it } from "vitest";

import { governanceGateLabelFromManifestStatus } from "@/lib/governance-gate-display";

describe("governanceGateLabelFromManifestStatus", () => {
  it("returns Not configured for empty status", () => {
    expect(governanceGateLabelFromManifestStatus(null)).toBe("Not configured");
    expect(governanceGateLabelFromManifestStatus("")).toBe("Not configured");
    expect(governanceGateLabelFromManifestStatus("   ")).toBe("Not configured");
  });

  it("maps finalized API values to Passed", () => {
    expect(governanceGateLabelFromManifestStatus("Committed")).toBe("Passed");
    expect(governanceGateLabelFromManifestStatus("committed")).toBe("Passed");
    expect(governanceGateLabelFromManifestStatus("Finalized")).toBe("Passed");
    expect(governanceGateLabelFromManifestStatus("Approved")).toBe("Passed");
  });

  it("maps failure-like values to Failed", () => {
    expect(governanceGateLabelFromManifestStatus("Failed")).toBe("Failed");
    expect(governanceGateLabelFromManifestStatus("rejected")).toBe("Failed");
    expect(governanceGateLabelFromManifestStatus("Blocked")).toBe("Failed");
  });

  it("maps not-required to Not required", () => {
    expect(governanceGateLabelFromManifestStatus("Not required")).toBe("Not required");
    expect(governanceGateLabelFromManifestStatus("not_required")).toBe("Not required");
    expect(governanceGateLabelFromManifestStatus("skipped")).toBe("Not required");
  });

  it("defaults other statuses to Pending", () => {
    expect(governanceGateLabelFromManifestStatus("Draft")).toBe("Pending");
    expect(governanceGateLabelFromManifestStatus("InReview")).toBe("Pending");
  });
});
