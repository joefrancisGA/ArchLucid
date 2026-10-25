import { describe, expect, it } from "vitest";

import {
  EVALUATION_TRACE_NOT_STORED,
  EVALUATION_TRACE_STORED_EMPTY,
  formatQuickDecisionEvaluationTraceLabel,
} from "@/lib/findings/finding-evaluation-trace-copy";

describe("finding-evaluation-trace-copy", () => {
  it("distinguishes missing, stored-empty, and present evaluation traces", () => {
    expect(formatQuickDecisionEvaluationTraceLabel(null)).toBe(EVALUATION_TRACE_NOT_STORED);
    expect(formatQuickDecisionEvaluationTraceLabel("")).toBe(EVALUATION_TRACE_STORED_EMPTY);
    expect(formatQuickDecisionEvaluationTraceLabel("High")).toBe("High");
  });
});
