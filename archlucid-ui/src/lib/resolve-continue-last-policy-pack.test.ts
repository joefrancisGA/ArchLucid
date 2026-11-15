import { afterEach, describe, expect, it } from "vitest";

import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import {
  resolveContinueLastPolicyPack,
  resolveContinueLastPolicyPackDetail,
} from "@/lib/resolve-continue-last-policy-pack";
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
  afterEach(() => window.localStorage.removeItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY));

  it("returns null when input is not an array", () => {
    expect(resolveContinueLastPolicyPack(null)).toBeNull();
    expect(resolveContinueLastPolicyPack({})).toBeNull();
    expect(resolveContinueLastPolicyPack("nope")).toBeNull();
    expect(resolveContinueLastPolicyPack([])).toBeNull();
  });

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

  it("uses the newest valid instant and falls back to creation when activation is invalid", () => {
    const match = resolveContinueLastPolicyPack([
      pack({ policyPackId: "pack-invalid", activatedUtc: "invalid", createdUtc: "invalid" }),
      pack({ policyPackId: "pack-earlier", activatedUtc: "2026-02-01T09:00:00+02:00" }),
      pack({ policyPackId: "pack-later", activatedUtc: "", createdUtc: "2026-02-01T08:00:00" }),
    ]);

    expect(match?.policyPackId).toBe("pack-later");
  });

  it("labels recency fallback when no recent view exists", () => {
    const detail = resolveContinueLastPolicyPackDetail([
      pack({ policyPackId: "pack-old", activatedUtc: "2025-01-01T00:00:00Z" }),
      pack({ policyPackId: "pack-new", activatedUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(detail?.source).toBe("recency-fallback");
    expect(detail?.viewedAtUtc).toBeNull();
    expect(detail?.pack.policyPackId).toBe("pack-new");
  });

  it.each([
    { href: "/compliance/policy-packs/pack-visited", expectedId: "pack-visited", source: "recent-view" },
    { href: "/governance/policy-packs?packId=pack-visited", expectedId: "pack-visited", source: "recent-view" },
    { href: "/architecture/reviews/new?packId=pack-visited", expectedId: "pack-new", source: "recency-fallback" },
  ])("resolves policy pack history for $href", ({ href, expectedId, source }) => {
    window.localStorage.setItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY, JSON.stringify({
      schemaVersion: 2,
      entries: [{ href, label: "Recent page", kind: "page", visitedAtUtc: "2026-03-01T00:00:00Z" }],
    }));

    const detail = resolveContinueLastPolicyPackDetail([
      pack({ policyPackId: "pack-visited" }),
      pack({ policyPackId: "pack-new", activatedUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(detail?.pack.policyPackId).toBe(expectedId);
    expect(detail?.source).toBe(source);
  });
});
