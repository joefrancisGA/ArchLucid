import { describe, expect, it } from "vitest";

import type { components } from "@/lib/api-types.generated";

import { agentOutputQualityGateConfigPaths, selectAgentOutputQualityGateRows } from "./quality-gate-config-summary";

type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

describe("selectAgentOutputQualityGateRows", () => {
  it("maps catalog paths into ordered rows when present", () => {
    const keys: ConfigSummaryKeyRow[] = [
      { configPath: agentOutputQualityGateConfigPaths.structuralWarnBelow, effectiveValue: "0.8", isSet: true },
      { configPath: "Other:Key", effectiveValue: "x", isSet: true },
      { configPath: agentOutputQualityGateConfigPaths.mode, effectiveValue: "WarnOnly", isSet: true },
      { configPath: agentOutputQualityGateConfigPaths.semanticWarnBelow, effectiveValue: "0.62", isSet: false },
    ];
    const result = selectAgentOutputQualityGateRows(keys);

    expect(result).toHaveLength(3);
    expect(result[0]?.label).toBe("Mode");
    expect(result[0]?.row?.effectiveValue).toBe("WarnOnly");
    expect(result[1]?.row?.effectiveValue).toBe("0.8");
    expect(result[2]?.row?.effectiveValue).toBe("0.62");
  });

  it("returns null slots when catalog rows are absent", () => {
    const result = selectAgentOutputQualityGateRows([]);

    expect(result.every((r) => r.row === null)).toBe(true);
  });
});
