import { describe, expect, it } from "vitest";

import {
  buildPolicyPackContentFromGuidedFields,
  guidedFieldsFromContentDocument,
} from "@/lib/policy-pack-guided-content";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

describe("buildPolicyPackContentFromGuidedFields", () => {
  it("maps newline-separated compliance keys and metadata lines", () => {
    const doc: PolicyPackContentDocument = buildPolicyPackContentFromGuidedFields({
      complianceRuleKeysText: "pci.foo\npci.bar",
      alertRuleIdsText: "",
      compositeAlertRuleIdsText: "",
      metadataLinesText: "vertical=healthcare",
    });

    expect(doc.complianceRuleKeys).toEqual(["pci.foo", "pci.bar"]);
    expect(doc.metadata?.vertical).toBe("healthcare");
  });

  it("round-trips guided field projection from an existing document", () => {
    const doc: PolicyPackContentDocument = buildPolicyPackContentFromGuidedFields({
      complianceRuleKeysText: "a,b",
      alertRuleIdsText: "alert-1",
      compositeAlertRuleIdsText: "c-1",
      metadataLinesText: "k=v",
    });
    const back = guidedFieldsFromContentDocument(doc);

    expect(buildPolicyPackContentFromGuidedFields(back).complianceRuleKeys).toEqual(doc.complianceRuleKeys);
  });

  it("omits pack.curatedRules.v1 from guided metadata lines (blob is edited elsewhere)", () => {
    const doc: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: [],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: { "pack.curatedRules.v1": '{"schemaVersion":1}', vertical: "saas" },
    };
    const back = guidedFieldsFromContentDocument(doc);

    expect(back.metadataLinesText).toBe("vertical=saas");
  });
});
