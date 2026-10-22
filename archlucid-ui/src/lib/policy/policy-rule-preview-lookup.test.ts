import { describe, expect, it } from "vitest";

import {
  buildPolicyRulePreviewFallback,
  lookupPolicyRulePreviewInEffectivePacks,
} from "@/lib/policy/policy-rule-preview-lookup";
import type { ResolvedPolicyPack } from "@/types/policy-packs";
import { POLICY_PACK_CURATED_RULES_METADATA_V1 } from "@/lib/policy/policy-pack-curated-rules-constants";

const curatedMetadata = JSON.stringify({
  schemaVersion: 1,
  kind: "archlucid.policyPack.curatedRules.v1",
  pack: { name: "Security Architecture Baseline", version: "1.1.0" },
  rules: [
    {
      id: "sec-base-010",
      title: "Encrypt data at rest",
      description: "Sensitive data stores must use customer-managed encryption.",
      severity: "High",
      remediationGuidance: "Enable CMK on storage accounts.",
      evidenceHints: ["storage.encryption"],
      frameworkMappings: [],
    },
  ],
});

function effectivePack(contentJson: string): ResolvedPolicyPack {
  return {
    policyPackId: "sec-baseline-pack",
    name: "Security Architecture Baseline",
    version: "1.1.0",
    packType: "BuiltIn",
    contentJson,
  };
}

describe("policy-rule-preview-lookup", () => {
  it("lookupPolicyRulePreviewInEffectivePacks returns curated rule text", () => {
    const preview = lookupPolicyRulePreviewInEffectivePacks("sec-base-010", [
      effectivePack(
        JSON.stringify({
          complianceRuleKeys: ["sec-base-010"],
          complianceRuleIds: [],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: { [POLICY_PACK_CURATED_RULES_METADATA_V1]: curatedMetadata },
        }),
      ),
    ]);

    expect(preview).not.toBeNull();
    expect(preview?.ruleTitle).toBe("Encrypt data at rest");
    expect(preview?.description).toContain("customer-managed encryption");
    expect(preview?.hasCuratedRuleText).toBe(true);
    expect(preview?.packId).toBe("sec-baseline-pack");
  });

  it("buildPolicyRulePreviewFallback uses rule label and inferred pack name", () => {
    const preview = buildPolicyRulePreviewFallback({
      ruleId: "sec-base-010",
      ruleLabel: "Encrypt data at rest",
      packId: "sec-baseline-pack",
    });

    expect(preview.ruleTitle).toBe("Encrypt data at rest");
    expect(preview.packName).toBe("Security Architecture Baseline");
    expect(preview.hasCuratedRuleText).toBe(false);
  });
});
