import { describe, expect, it } from "vitest";

import {
  createEmptyVisualBuilderState,
  tryParseVisualBuilderFromContentJson,
  visualBuilderStateToContentJson,
} from "@/lib/policy-pack-visual-builder";

describe("policy-pack-visual-builder", () => {
  it("updates JSON preview when conditions change", () => {
    const state = createEmptyVisualBuilderState();
    const next = {
      ...state,
      root: {
        type: "group" as const,
        combinator: "and" as const,
        children: [
          {
            type: "leaf" as const,
            field: "finding.severity" as const,
            operator: "severityAtLeast" as const,
            value: "High",
          },
        ],
      },
    };

    const json = visualBuilderStateToContentJson(next);
    const parsed = JSON.parse(json) as { advisoryDefaults?: Record<string, string> };

    expect(parsed.advisoryDefaults?.severityFloor).toBe("High");
  });

  it("shows warning when JSON uses unsupported hand-edited predicate", () => {
    const json = JSON.stringify({
      complianceRuleIds: [],
      complianceRuleKeys: [],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: { severityFloor: "Critical" },
      metadata: {},
    });

    const result = tryParseVisualBuilderFromContentJson(json);

    expect(result.warning).toMatch(/visual predicate tree/i);
    expect(result.state.root.type).toBe("group");
  });
});
