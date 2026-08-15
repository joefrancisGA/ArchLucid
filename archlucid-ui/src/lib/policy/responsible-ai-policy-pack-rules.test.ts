import { describe, expect, it } from "vitest";

import { POLICY_PACK_CURATED_RULES_METADATA_V1 } from "@/lib/policy/policy-pack-curated-rules-constants";
import { resolveResponsibleAiPolicyRuleRows } from "@/lib/policy/responsible-ai-policy-pack-rules";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

describe("resolveResponsibleAiPolicyRuleRows", () => {
  it("returns template baseline rows when pack record is not loaded yet", () => {
    const result = resolveResponsibleAiPolicyRuleRows(null, { hasPackRecord: false });

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rulesSourceQualifier).toBe("Platform template baseline");
  });

  it("binds rows to complianceRuleKeys when pack content exists", () => {
    const content: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["ai-gov-001", "ai-gov-002"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: {},
    };

    const result = resolveResponsibleAiPolicyRuleRows(content, { hasPackRecord: true });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.ruleKey).toBe("ai-gov-001");
    expect(result.rulesSourceQualifier).toBeNull();
  });

  it("prefers curated rules from pack metadata when present", () => {
    const curatedJson = JSON.stringify({
      schemaVersion: 1,
      kind: "archlucid.policyPack.curatedRules.v1",
      pack: {
        name: "Responsible AI",
        description: "",
        version: "1.0.0",
        category: "AI Governance",
        isDefault: true,
        suggestedPackType: "PlatformDefault",
        policyPackContentDocumentPath: "",
      },
      rules: [
        {
          id: "ai-gov-001",
          title: "AI model registry documented",
          description: "Inventory models in the manifest.",
          severity: "Medium",
          remediationGuidance: "Add services.",
          evidenceHints: ["services[].ServiceName"],
          frameworkMappings: [],
        },
      ],
    });

    const content: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["ai-gov-001"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: { [POLICY_PACK_CURATED_RULES_METADATA_V1]: curatedJson },
    };

    const result = resolveResponsibleAiPolicyRuleRows(content, { hasPackRecord: true });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.ruleName).toBe("AI model registry documented");
    expect(result.rows[0]?.evidenceExpected).toContain("services[].ServiceName");
  });

  it("falls back to template baseline when pack record exists without published content", () => {
    const result = resolveResponsibleAiPolicyRuleRows(null, { hasPackRecord: true });

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rulesSourceQualifier).toBe("Published pack content unavailable — platform template baseline");
  });
});
