import { describe, expect, it } from "vitest";

import { formatInfraEvidenceRecentScopeLabel } from "@/lib/infra-evidence/infra-evidence-recent-scope-label";

describe("formatInfraEvidenceRecentScopeLabel", () => {
  it("formats explorer labels with work queue and filters", () => {
    expect(formatInfraEvidenceRecentScopeLabel({
      surface: "explorer",
      workQueueLabel: "Open findings",
      namePrefix: "gateway",
      resourceGroup: "rg-net",
    })).toBe("Explorer · Open findings · name gateway · rg rg-net");
  });

  it("formats hub labels with resource and audit control names", () => {
    expect(formatInfraEvidenceRecentScopeLabel({
      surface: "hub",
      resourceDisplayName: "gateway",
      controlNumber: "AC-2",
      controlTitle: "Account management",
      workQueueLabel: "Open findings",
    })).toBe("gateway · AC-2 · Account management · Open findings");
  });

  it("formats ask labels with short identifiers for scoped entities", () => {
    expect(formatInfraEvidenceRecentScopeLabel({
      surface: "ask",
      resourceDisplayName: "gateway",
      findingId: "finding-abcdef12",
      snapshotId: "22222222-2222-2222-2222-222222222222",
    })).toBe("gateway · snapshot …22222222 · finding …abcdef12");
  });
});
