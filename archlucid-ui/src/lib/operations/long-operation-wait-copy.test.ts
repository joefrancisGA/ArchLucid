import { describe, expect, it } from "vitest";

import {
  buildLongOperationWaitCopy,
  LONG_OPERATION_ESCALATION_10S_MS,
  LONG_OPERATION_ESCALATION_30S_MS,
  LONG_OPERATION_TIMEOUT_HINT_MS,
  resolveLongOperationEscalationLevel,
} from "@/lib/operations/long-operation-wait-copy";

describe("long-operation-wait-copy", () => {
  it("escalates quiet → 10s → 30s → timeout without inventing percent", () => {
    expect(resolveLongOperationEscalationLevel(0)).toBe("quiet");
    expect(resolveLongOperationEscalationLevel(LONG_OPERATION_ESCALATION_10S_MS)).toBe("after10s");
    expect(resolveLongOperationEscalationLevel(LONG_OPERATION_ESCALATION_30S_MS)).toBe("after30s");
    expect(resolveLongOperationEscalationLevel(LONG_OPERATION_TIMEOUT_HINT_MS)).toBe("timeoutHint");
  });

  it("builds named-stage copy for each escalation band", () => {
    const quiet = buildLongOperationWaitCopy({
      operationLabel: "Finalizing architecture review",
      stageLabel: "Saving finalized review record",
      elapsedMs: 1_000,
    });
    expect(quiet.level).toBe("quiet");
    expect(quiet.headline).toBe("Saving finalized review record");
    expect(quiet.detail).not.toMatch(/%/);

    const after10 = buildLongOperationWaitCopy({
      operationLabel: "Finalizing architecture review",
      stageLabel: "Saving finalized review record",
      elapsedMs: LONG_OPERATION_ESCALATION_10S_MS,
    });
    expect(after10.level).toBe("after10s");
    expect(after10.detail).toMatch(/still in progress/i);
    expect(after10.detail).not.toMatch(/Named stages only/i);

    const after30 = buildLongOperationWaitCopy({
      operationLabel: "Generating sponsor report",
      stageLabel: "Building DOCX export",
      elapsedMs: LONG_OPERATION_ESCALATION_30S_MS,
    });
    expect(after30.level).toBe("after30s");
    expect(after30.detail).toMatch(/30–60 seconds/i);

    const timeout = buildLongOperationWaitCopy({
      operationLabel: "Answering your question",
      stageLabel: "Retrieving evidence",
      elapsedMs: LONG_OPERATION_TIMEOUT_HINT_MS,
    });
    expect(timeout.level).toBe("timeoutHint");
    expect(timeout.detail).toMatch(/longer than usual/i);
    expect(timeout.detail).not.toMatch(/%/);
  });
});
