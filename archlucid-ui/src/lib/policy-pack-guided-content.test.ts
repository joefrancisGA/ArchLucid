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
});
