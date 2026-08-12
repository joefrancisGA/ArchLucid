import { describe, expect, it } from "vitest";

import { applyGeneratedCuratedPolicyPack } from "@/lib/apply-generated-curated-policy-pack";
import {
  createEmptyCuratedRulesDocument,
  type CuratedRulesDocument,
} from "@/lib/policy-pack-curated-rules-v1";

describe("applyGeneratedCuratedPolicyPack", () => {
  it("maps pack metadata and composes publish JSON", () => {
    const document: CuratedRulesDocument = {
      ...createEmptyCuratedRulesDocument({
        name: "HIPAA Azure baseline",
        description: "Encrypt PHI workloads and audit overrides.",
        version: "1.1.0",
        suggestedPackType: "ProjectCustom",
      }),
      rules: [
        {
          id: "hipaa.encryption.at-rest",
          title: "Encrypt data at rest",
          description: "Customer-managed keys for PHI stores.",
          severity: "High",
          remediationGuidance: "Enable CMK on storage and databases.",
          evidenceHints: ["Key vault policy"],
          frameworkMappings: [{ framework: "HIPAA", control: "164.312" }],
        },
      ],
    };

    const result = applyGeneratedCuratedPolicyPack({
      document,
      existingName: "",
      existingDescription: "",
      publishVersion: "1.0.0",
      packType: "TenantCustom",
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.ruleCount).toBe(1);
    expect(result.name).toBe("HIPAA Azure baseline");
    expect(result.publishVersion).toBe("1.1.0");
    expect(result.contentJson).toContain("hipaa.encryption.at-rest");
  });

  it("preserves operator-edited name when already set", () => {
    const document: CuratedRulesDocument = {
      ...createEmptyCuratedRulesDocument({ name: "Generated title" }),
      rules: [
        {
          id: "rule.one",
          title: "Rule one",
          description: "Detail",
          severity: "Medium",
          remediationGuidance: "Fix it",
          evidenceHints: [],
          frameworkMappings: [],
        },
      ],
    };

    const result = applyGeneratedCuratedPolicyPack({
      document,
      existingName: "Operator-owned pack",
      existingDescription: "",
      publishVersion: "1.0.0",
      packType: "ProjectCustom",
    });

    expect(result.name).toBe("Operator-owned pack");
  });
});
