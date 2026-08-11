import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";
import {
  MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE,
  MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK,
  MODEL_GOVERNANCE_AI_USAGE_HEADING,
  MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK,
  MODEL_GOVERNANCE_AI_USAGE_WHY_TWO,
  buildModelGovernanceAiUsageVocabulary,
  resolveModelGovernanceAiUsagePeerLink,
} from "@/lib/model-governance-ai-usage-vocabulary";

describe("model-governance-ai-usage-vocabulary (TB-2286)", () => {
  it("explains why model governance and AI usage stay separate and deep-links both", () => {
    const model = buildModelGovernanceAiUsageVocabulary();

    expect(model.heading).toBe(MODEL_GOVERNANCE_AI_USAGE_HEADING);
    expect(model.whyTwo).toBe(MODEL_GOVERNANCE_AI_USAGE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("profile");
    expect(model.whyTwo.toLowerCase()).toContain("estimate");
    expect(model.compactLine).toBe(MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE);

    expect(model.modelGovernanceLink).toEqual(MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK);
    expect(model.modelGovernanceLink.href).toBe(MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH);
    expect(model.modelGovernanceLink.href).toBe("/administration/model-governance");

    expect(model.aiUsageLink).toEqual(MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK);
    expect(model.aiUsageLink.href).toBe(AI_USAGE_SETTINGS_PATH);
    expect(model.aiUsageLink.href).toBe("/administration/ai-usage");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveModelGovernanceAiUsagePeerLink("model-governance")).toEqual(
      MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK,
    );
    expect(resolveModelGovernanceAiUsagePeerLink("ai-usage")).toEqual(
      MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK,
    );
  });
});
