import { describe, expect, it } from "vitest";

import {
  EXECUTION_MODE_NOT_STORED_LABEL,
  formatStructuralExecutionModeBadgeLabel,
  formatStructuralExecutionModeBuyerLabel,
  formatStructuralExecutionModeLabel,
  StructuralExecutionModeWire,
  structuralExecutionModeBadgeTitle,
} from "@/lib/structural-execution-mode";

describe("structural-execution-mode", () => {
  it("maps wire enum values to operator labels", () => {
    expect(formatStructuralExecutionModeLabel(StructuralExecutionModeWire.Simulator)).toBe("Simulator");
    expect(formatStructuralExecutionModeLabel(StructuralExecutionModeWire.Real)).toBe("Real");
    expect(formatStructuralExecutionModeLabel(StructuralExecutionModeWire.Fallback)).toBe("Fallback");
    expect(formatStructuralExecutionModeLabel(StructuralExecutionModeWire.Mixed)).toBe("Mixed");
  });

  it("documents Mixed aggregation copy for operators", () => {
    expect(structuralExecutionModeBadgeTitle(StructuralExecutionModeWire.Mixed)).toContain("deterministic substitution");
  });

  it("labels missing execution mode without inventing unknown", () => {
    expect(formatStructuralExecutionModeLabel(null)).toBe(EXECUTION_MODE_NOT_STORED_LABEL);
    expect(formatStructuralExecutionModeBadgeLabel(null)).toBe(EXECUTION_MODE_NOT_STORED_LABEL);
    expect(formatStructuralExecutionModeBuyerLabel(null)).toBe(EXECUTION_MODE_NOT_STORED_LABEL);
    expect(formatStructuralExecutionModeBadgeLabel(StructuralExecutionModeWire.Real)).toBe("Real execution");
  });
});
