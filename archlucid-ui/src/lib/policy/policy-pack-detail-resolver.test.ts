import { describe, expect, it } from "vitest";

import {
  BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID,
  isBundledResponsibleAiPlatformPack,
  isResponsibleAiPolicyPackId,
  resolvePolicyPackDetailBreadcrumbLabel,
  resolvePolicyPackDetailKind,
} from "@/lib/policy/policy-pack-detail-resolver";
import {
  CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF,
} from "@/lib/samples/customer-intake-modernization/definition";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";

describe("policy-pack-detail-resolver", () => {
  it("maps bundled Responsible AI ids without numeric aliases", () => {
    expect(isResponsibleAiPolicyPackId("1")).toBe(false);
    expect(resolvePolicyPackDetailKind("1", null)).toBe("unknown");
    expect(resolvePolicyPackDetailKind(BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID, null)).toBe("responsible-ai");
    expect(resolvePolicyPackDetailBreadcrumbLabel(BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID, null)).toBe(
      RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL,
    );
  });

  it("maps registered sample privacy pack ids via the sample registry", () => {
    expect(resolvePolicyPackDetailKind("demo-enterprise-privacy-pack", null)).toBe("healthcare-claims");
    expect(resolvePolicyPackDetailBreadcrumbLabel("demo-enterprise-privacy-pack", null)).toBe("Enterprise Privacy");
    expect(resolvePolicyPackDetailKind("demo-healthcare-claims-pack", null)).toBe("healthcare-claims");
    expect(resolvePolicyPackDetailKind(CUSTOMER_INTAKE_POLICY_PACK_DETAIL_HREF.split("/").pop()!, null)).toBe(
      "healthcare-claims",
    );
    expect(resolvePolicyPackDetailKind(CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF.split("/").pop()!, null)).toBe(
      "healthcare-claims",
    );
  });

  it("does not infer Responsible AI from pack name heuristics alone", () => {
    expect(
      resolvePolicyPackDetailKind("custom-pack", {
        policyPackId: "custom-pack",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Responsible AI policy pack",
        description: "",
        packType: "Custom",
        distributionScope: "Tenant",
        status: "Active",
        createdUtc: "2026-01-01T00:00:00.000Z",
        currentVersion: "1.0.0",
      }),
    ).toBe("unknown");
  });

  it("returns unknown for unrecognized ids without API metadata", () => {
    expect(resolvePolicyPackDetailKind("missing-pack", null)).toBe("unknown");
    expect(resolvePolicyPackDetailBreadcrumbLabel("missing-pack", null)).toBe("Policy pack detail");
  });

  it("treats platform-default Responsible AI packs as bundled defaults, not demo samples", () => {
    expect(isBundledResponsibleAiPlatformPack(BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID, null)).toBe(true);
    expect(isBundledResponsibleAiPlatformPack("missing-pack", null)).toBe(false);
    expect(
      isBundledResponsibleAiPlatformPack(BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID, {
        policyPackId: BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID,
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
