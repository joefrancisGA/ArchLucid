import { describe, expect, it } from "vitest";

import {
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
    expect(resolvePolicyPackDetailKind("demo-healthcare-claims-pack", null)).toBe("healthcare-claims");
    expect(resolvePolicyPackDetailBreadcrumbLabel("demo-healthcare-claims-pack", null)).toBe("Healthcare Claims");
  });

  it("returns unknown for unrecognized ids without API metadata", () => {
    expect(resolvePolicyPackDetailKind("missing-pack", null)).toBe("unknown");
    expect(resolvePolicyPackDetailBreadcrumbLabel("missing-pack", null)).toBe("Policy pack detail");
  });
});
