import { describe, expect, it } from "vitest";

import {
  isBundledResponsibleAiPlatformPack,
  resolvePolicyPackDetailBreadcrumbLabel,
  resolvePolicyPackDetailKind,
} from "@/lib/policy/policy-pack-detail-resolver";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";

describe("policy-pack-detail-resolver", () => {
  it("maps numeric id 1 to Responsible AI", () => {
    expect(resolvePolicyPackDetailKind("1", null)).toBe("responsible-ai");
    expect(resolvePolicyPackDetailBreadcrumbLabel("1", null)).toBe(RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL);
  });

  it("maps healthcare claims demo ids", () => {
    expect(resolvePolicyPackDetailKind("demo-enterprise-privacy-pack", null)).toBe("healthcare-claims");
    expect(resolvePolicyPackDetailBreadcrumbLabel("demo-enterprise-privacy-pack", null)).toBe("Enterprise Privacy");
  });

  it("does not map inactive healthcare demo pack aliases without API metadata", () => {
    expect(resolvePolicyPackDetailKind("demo-healthcare-claims-pack", null)).toBe("unknown");
    expect(resolvePolicyPackDetailBreadcrumbLabel("demo-healthcare-claims-pack", null)).toBe("Policy pack detail");
  });

  it("returns unknown for unrecognized ids without API metadata", () => {
    expect(resolvePolicyPackDetailKind("missing-pack", null)).toBe("unknown");
    expect(resolvePolicyPackDetailBreadcrumbLabel("missing-pack", null)).toBe("Policy pack detail");
  });

  it("treats responsible AI ids as bundled platform defaults, not demo samples", () => {
    expect(isBundledResponsibleAiPlatformPack("1", null)).toBe(true);
    expect(isBundledResponsibleAiPlatformPack("missing-pack", null)).toBe(false);
    expect(
      isBundledResponsibleAiPlatformPack("pack-1", {
        policyPackId: "pack-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Responsible AI",
        description: "",
        packType: "PlatformDefault",
        distributionScope: "Platform",
        status: "Active",
        createdUtc: "2026-01-01T00:00:00.000Z",
        currentVersion: "1.0.0",
      }),
    ).toBe(true);
  });
});
