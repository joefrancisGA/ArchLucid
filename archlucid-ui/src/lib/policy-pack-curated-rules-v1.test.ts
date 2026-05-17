import { describe, expect, it } from "vitest";

import type { PolicyPackContentDocument } from "@/types/policy-packs";

import {
  composePolicyPackContentForPublish,
  CURATED_RULES_DOCUMENT_KIND,
  extractCuratedRulesFromPackMetadata,
  hydrateCuratedFromContentDocument,
  POLICY_PACK_CURATED_RULES_METADATA_V1,
  tryParseCuratedRulesDocumentJson,
} from "./policy-pack-curated-rules-v1";
import type { GuidedPolicyFields } from "./policy-pack-guided-content";

/**
 * Frozen excerpt from `docs/samples/policy-packs/security-architecture-baseline-rules-v1.json` (parse/serialize contract).
 */
const FROZEN_SECURITY_BASELINE_RULES_SNIPPET = `{
  "schemaVersion": 1,
  "kind": "archlucid.policyPack.curatedRules.v1",
  "pack": {
    "name": "Security Architecture Baseline",
    "description": "Starter security posture checks",
    "version": "1.1.0",
    "category": "Security",
    "isDefault": true,
    "suggestedPackType": "ProjectCustom",
    "policyPackContentDocumentPath": "docs/samples/policy-packs/security-architecture-baseline.json"
  },
  "rules": [
    {
      "id": "sec-base-001",
      "title": "MFA enforced for privileged access",
      "description": "Privileged operator paths must assume phishing-resistant MFA.",
      "severity": "Critical",
      "remediationGuidance": "Document MFA expectations in governance.",
      "evidenceHints": [
        "azureExtractor.manifest.ScopeDescriptor",
        "relationships[].relationshipType"
      ],
      "frameworkMappings": [
        { "framework": "CIS Azure Foundations", "control": "1 Identity and Access Management" },
        { "framework": "OWASP ASVS", "requirement": "V2 Authentication" }
      ]
    }
  ]
}`;

describe("policy-pack-curated-rules-v1", () => {
  it("round-trips frozen security baseline snippet", () => {
    const first = tryParseCuratedRulesDocumentJson(FROZEN_SECURITY_BASELINE_RULES_SNIPPET);
    expect(first).not.toBeNull();
    expect(first?.kind).toBe(CURATED_RULES_DOCUMENT_KIND);
    expect(first?.rules).toHaveLength(1);
    expect(first?.rules[0]?.id).toBe("sec-base-001");
    expect(first?.rules[0]?.severity).toBe("Critical");

    const serialized = JSON.stringify(first, null, 2);
    const second = tryParseCuratedRulesDocumentJson(serialized);
    expect(second).toEqual(first);
  });

  it("composePolicyPackContentForPublish embeds metadata and unions compliance keys", () => {
    const guided: GuidedPolicyFields = {
      complianceRuleKeysText: "file-pack-key-one",
      alertRuleIdsText: "",
      compositeAlertRuleIdsText: "",
      metadataLinesText: "vertical=healthcare",
    };
    const parsed = tryParseCuratedRulesDocumentJson(FROZEN_SECURITY_BASELINE_RULES_SNIPPET);
    expect(parsed).not.toBeNull();

    const doc: PolicyPackContentDocument = composePolicyPackContentForPublish({
      guided,
      curated: parsed!,
      packContext: {
        name: "N",
        description: "D",
        version: "2.0.0",
        packType: "TenantCustom",
      },
    });

    expect(doc.complianceRuleKeys).toEqual(expect.arrayContaining(["file-pack-key-one", "sec-base-001"]));
    expect(doc.metadata[POLICY_PACK_CURATED_RULES_METADATA_V1]).toBeDefined();
    const nested = extractCuratedRulesFromPackMetadata(doc.metadata);
    expect(nested?.rules[0]?.id).toBe("sec-base-001");
  });

  it("hydrate splits curated ids from additional compliance keys", () => {
    const rawMeta = JSON.stringify(tryParseCuratedRulesDocumentJson(FROZEN_SECURITY_BASELINE_RULES_SNIPPET));
    const doc: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["sec-base-001", "other-key"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: { [POLICY_PACK_CURATED_RULES_METADATA_V1]: rawMeta },
    };
    const h = hydrateCuratedFromContentDocument(doc);
    expect(h.curated.rules.some((r) => r.id === "sec-base-001")).toBe(true);
    expect(h.additionalComplianceKeysText.split("\n")).toContain("other-key");
    expect(h.additionalComplianceKeysText.split("\n")).not.toContain("sec-base-001");
  });
});
