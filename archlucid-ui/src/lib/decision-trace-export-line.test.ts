import { describe, expect, it } from "vitest";

import {
  DECISION_TRACE_ID_NOT_STORED_LABEL,
  formatDecisionTraceExportLine,
} from "@/lib/decision-trace-export-line";

describe("decision-trace-export-line (P-04)", () => {
  it("labels omitted decision trace ids for exports", () => {
    expect(formatDecisionTraceExportLine(null)).toBe(DECISION_TRACE_ID_NOT_STORED_LABEL);
    expect(formatDecisionTraceExportLine("")).toBe(DECISION_TRACE_ID_NOT_STORED_LABEL);
    expect(formatDecisionTraceExportLine("trace-abc")).toBe("trace-abc");
  });
});
