import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isGovernanceLineageIncomplete,
  resolveGovernanceApprovalLineage,
} from "@/lib/governance-lineage-demo-fallback";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

function emptyLineage(): GovernanceLineageResult {
  return {
    approvalRequest: {
      approvalRequestId: "claims-intake-approval-001",
      runId: "claims-intake-modernization-run",
      manifestVersion: "",
      sourceEnvironment: "",
      targetEnvironment: "",
      status: "",
      requestedBy: "",
      requestedUtc: "",
    },
    topFindings: [],
    promotions: [],
  };
}

describe("governance-lineage-demo-fallback", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects incomplete lineage payloads", () => {
    expect(isGovernanceLineageIncomplete(emptyLineage())).toBe(true);
  });

  it("returns curated fallback when API lineage is incomplete for showcase approval id", () => {
    const resolved = resolveGovernanceApprovalLineage("claims-intake-approval-001", emptyLineage());

    expect(resolved).not.toBeNull();
    expect(resolved?.approvalRequest.status).toBe("Approved");
    expect(resolved?.topFindings.length).toBeGreaterThan(0);
    expect(resolved?.promotions.length).toBeGreaterThan(0);
  });
});
