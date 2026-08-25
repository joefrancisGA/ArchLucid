import { describe, expect, it } from "vitest";

import { resolveNextPolicyPackInList } from "@/lib/resolve-next-policy-pack-in-list";
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

describe("resolveNextPolicyPackInList", () => {
  it("returns the next pack in recency order", () => {
    const next = resolveNextPolicyPackInList(
      [
        pack({ policyPackId: "pack-new", activatedUtc: "2026-02-01T00:00:00Z", name: "New pack" }),
        pack({ policyPackId: "pack-old", activatedUtc: "2025-01-01T00:00:00Z", name: "Old pack" }),
      ],
      "pack-new",
    );

    expect(next?.policyPackId).toBe("pack-old");
  });
});
