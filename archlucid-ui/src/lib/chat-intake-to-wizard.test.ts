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

  it("keeps wizard fields when chat intake omits values but clears strings and replaces empty lists", () => {
    const current = {
      ...buildDefaultWizardValues(),
      description: "Existing brief long enough for agents.",
      systemName: "KeepMe",
      environment: "production",
      constraints: ["Keep constraint"],
      cloudProvider: "Azure" as const,
    };

    const merged = mergeChatIntakeIntoWizardValues(current, {
      requestId: "ignored",
      description: "",
      systemName: null,
      environment: undefined,
      cloudProvider: null,
      constraints: [],
      requiredCapabilities: [],
      assumptions: [],
      inlineRequirements: [],
      policyReferences: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    expect(merged.systemName).toBe("KeepMe");
    expect(merged.environment).toBe("production");
    expect(merged.description).toBe("");
    expect(merged.constraints).toEqual([]);
    expect(merged.cloudProvider).toBe("Azure");
  });

  it("does not map unrecognized cloud providers to None", () => {
    const current = { ...buildDefaultWizardValues(), cloudProvider: "Azure" as const };

    const merged = mergeChatIntakeIntoWizardValues(current, {
      requestId: "ignored",
      description: null,
      systemName: null,
      environment: null,
      cloudProvider: "AzureStack",
      constraints: [],
      requiredCapabilities: [],
      assumptions: [],
      inlineRequirements: [],
      policyReferences: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    expect(merged.cloudProvider).toBe("Azure");
  });
});
