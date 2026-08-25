import { describe, expect, it } from "vitest";

import { resolveContinueLastPolicyPack } from "@/lib/resolve-continue-last-policy-pack";
import type { PolicyPack } from "@/types/policy-packs";

function pack(overrides: Partial<PolicyPack> = {}): PolicyPack {
  return {
    policyPackId: "pack-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    name: "Baseline pack",
    description: "desc",
    packType: "custom",
    distributionScope: "workspace",
    status: "active",
    createdUtc: "2026-01-01T00:00:00Z",
    activatedUtc: "2026-01-02T00:00:00Z",
    currentVersion: "1.0.0",
    ...overrides,
  };
}

describe("resolveContinueLastPolicyPack", () => {
  it("prefers the most recently activated pack when no recent view exists", () => {
    const match = resolveContinueLastPolicyPack([
      pack({ policyPackId: "pack-old", activatedUtc: "2025-01-01T00:00:00Z" }),
      pack({ policyPackId: "pack-new", activatedUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(match?.policyPackId).toBe("pack-new");
  });

  it("returns null when no packs exist", () => {
    expect(resolveContinueLastPolicyPack([])).toBeNull();
  });
});
