import { describe, expect, it } from "vitest";

import { buildDefaultSimulationRequestForRule, normalizeSimulateAlertRuleBody } from "@/lib/alert-rule-simulation";
import type { AlertRule } from "@/types/alerts";

const sampleRule: AlertRule = {
  ruleId: "r1",
  tenantId: "t1",
  workspaceId: "w1",
  projectId: "p1",
  name: "Test rule",
  ruleType: "CriticalRecommendationCount",
  severity: "Warning",
  thresholdValue: 5,
  isEnabled: true,
  targetChannelType: "DigestOnly",
  metadataJson: "{}",
  createdUtc: "2024-06-01T12:00:00Z",
};

describe("alert-rule-simulation helpers", () => {
  it("buildDefault clones the rule inside simpleRule and sets evaluation knobs", () => {
    const built = buildDefaultSimulationRequestForRule(sampleRule);

    expect(built.ruleKind).toBe("Simple");

    expect(built.simpleRule).toEqual(expect.objectContaining({ ruleId: "r1", thresholdValue: 5 }));

    expect(built.simpleRule).not.toBe(sampleRule);

    expect(built.recentRunCount).toBe(10);
    expect(built.useHistoricalWindow).toBe(true);
    expect(built.runProjectSlug).toBe("default");

    expect(built.runId).toBeNull();

    expect(built.comparedToRunId).toBeNull();
  });

  it("normalize accepts a round-tripped JSON payload from defaults", () => {
    const built = buildDefaultSimulationRequestForRule(sampleRule);
    const text = JSON.stringify(built);

    const parsed: unknown = JSON.parse(text);

    const normalized = normalizeSimulateAlertRuleBody(parsed);

    expect(typeof normalized).not.toBe("string");

    expect(normalized).toEqual(
      expect.objectContaining({
        ruleKind: "Simple",
        recentRunCount: 10,
        simpleRule: expect.objectContaining({ ruleId: "r1", thresholdValue: 5 }),
      }),
    );
  });

  it("normalize rejects Composite ruleKind for this pathway", () => {
    const res = normalizeSimulateAlertRuleBody({
      ruleKind: "Composite",
      simpleRule: {},
    });

    expect(typeof res).toBe("string");
  });

  it("normalize rejects bad runId type when included", () => {
    const res = normalizeSimulateAlertRuleBody({
      ...buildDefaultSimulationRequestForRule(sampleRule),
      runId: 123,
    });

    expect(res).toMatch(/runId must be null or a string when the field is included/i);
  });
});
