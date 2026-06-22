import { describe, expect, it } from "vitest";

import { mergeChatIntakeIntoWizardValues } from "@/lib/chat-intake-to-wizard";
import { buildDefaultWizardValues } from "@/lib/wizard-schema";

describe("mergeChatIntakeIntoWizardValues", () => {
  it("maps parsed chat intake onto wizard fields while preserving requestId", () => {
    const current = buildDefaultWizardValues();
    const originalRequestId = current.requestId;

    const merged = mergeChatIntakeIntoWizardValues(current, {
      requestId: "ignored-by-merge",
      description: "A long enough architecture brief for agents to analyze.",
      systemName: "PaymentsHub",
      environment: "staging",
      cloudProvider: "Azure",
      constraints: ["Private endpoints only"],
      requiredCapabilities: ["Card capture"],
      assumptions: ["Entra tenant exists"],
      inlineRequirements: ["Retain audit logs for 7 years"],
      policyReferences: ["SecurityBaseline"],
      topologyHints: ["Dual region"],
      securityBaselineHints: ["Encrypt at rest"],
    });

    expect(merged.requestId).toBe(originalRequestId);
    expect(merged.systemName).toBe("PaymentsHub");
    expect(merged.cloudProvider).toBe("Azure");
    expect(merged.constraints).toEqual(["Private endpoints only"]);
    expect(merged.inlineRequirements).toEqual(["Retain audit logs for 7 years"]);
  });
});
