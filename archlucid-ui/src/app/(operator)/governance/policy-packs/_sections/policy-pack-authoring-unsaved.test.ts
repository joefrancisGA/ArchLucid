import { describe, expect, it } from "vitest";

import { DEFAULT_CONTENT } from "./policy-packs-page-constants";
import {
  policyPackAuthoringHasUnsavedEdits,
  policyPackCreateFormHasUnsavedEdits,
  policyPackPublishFormHasUnsavedEdits,
} from "./policy-pack-authoring-unsaved";

describe("policy-pack-authoring-unsaved (LD-12)", () => {
  it("treats the default create form as clean", () => {
    expect(
      policyPackCreateFormHasUnsavedEdits({
        createJson: DEFAULT_CONTENT,
        name: "Baseline governance",
        description: "",
        packType: "ProjectCustom",
      }),
    ).toBe(false);
  });

  it("flags edited create JSON as dirty", () => {
    expect(
      policyPackCreateFormHasUnsavedEdits({
        createJson: '{"complianceRuleKeys":["edited"]}',
        name: "Baseline governance",
        description: "",
        packType: "ProjectCustom",
      }),
    ).toBe(true);
  });

  it("flags publish JSON that diverges from the loaded baseline", () => {
    expect(
      policyPackPublishFormHasUnsavedEdits({
        selectedPackId: "pack-1",
        publishBaselineJson: DEFAULT_CONTENT,
        publishJson: `${DEFAULT_CONTENT.slice(0, -1)}`,
      }),
    ).toBe(true);
  });

  it("combines create and publish dirty signals", () => {
    expect(
      policyPackAuthoringHasUnsavedEdits({
        createJson: DEFAULT_CONTENT,
        name: "Baseline governance",
        description: "",
        packType: "ProjectCustom",
        selectedPackId: "pack-1",
        publishBaselineJson: DEFAULT_CONTENT,
        publishJson: DEFAULT_CONTENT,
      }),
    ).toBe(false);
  });
});
