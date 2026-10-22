import { describe, expect, it } from "vitest";

import {
  buyerGovernanceApprovalDisplayLabel,
  governanceGateLabelFromManifestStatus,
  governanceGateOperatorFootnote,
  governanceGatePersistedStatusHint,
} from "@/lib/governance/governance-gate-display";

describe("governanceGateLabelFromManifestStatus", () => {
  it("distinguishes missing status from stored empty status", () => {
    expect(governanceGateLabelFromManifestStatus(null)).toBe("Manifest status was not stored.");
    expect(governanceGateLabelFromManifestStatus("")).toBe("Status not recognized");
    expect(governanceGateLabelFromManifestStatus("   ")).toBe("Status not recognized");
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

  it("labels unrecognized statuses honestly", () => {
    expect(governanceGateLabelFromManifestStatus("Draft")).toBe("Status not recognized");
    expect(governanceGateLabelFromManifestStatus("InReview")).toBe("Status not recognized");
  });
});

describe("governanceGatePersistedStatusHint", () => {
  it("includes the raw manifest status", () => {
    expect(governanceGatePersistedStatusHint("Draft")).toBe("Persisted manifest status: Draft");
  });
});

describe("governanceGateOperatorFootnote", () => {
  it("surfaces operator gate when buyer copy differs", () => {
    expect(governanceGateOperatorFootnote("Passed", "Approved with monitoring")).toBe("Operator gate: Passed");
  });
});

describe("buyerGovernanceApprovalDisplayLabel", () => {
  it("maps Passed to procurement language", () => {
    expect(buyerGovernanceApprovalDisplayLabel("Passed")).toBe("Approved with monitoring");
  });

  it("passes through other gate labels", () => {
    expect(buyerGovernanceApprovalDisplayLabel("Pending")).toBe("Pending");
    expect(buyerGovernanceApprovalDisplayLabel("Failed")).toBe("Failed");
  });

  it("returns Not configured for empty strings", () => {
    expect(buyerGovernanceApprovalDisplayLabel(null)).toBe("Not configured");
    expect(buyerGovernanceApprovalDisplayLabel("")).toBe("Not configured");
    expect(buyerGovernanceApprovalDisplayLabel("   ")).toBe("Not configured");
  });
});
