import { describe, expect, it } from "vitest";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  operatorInferredConnectionPanelErrorFromUnknown,
  operatorInferredConnectionPanelErrorRecoveryScenario,
} from "@/lib/infra-evidence/operator-inferred-connection-panel-error";

function apiLoadFailure(message: string): ApiLoadFailureState {
  return {
    message,
    problem: { title: "Server error", status: 500 },
    correlationId: "corr-test",
    httpStatus: 500,
    retryAfterSeconds: null,
  };
}

describe("operatorInferredConnectionPanelErrorFromUnknown", () => {
  it("prefers ApiLoadFailureState.message over the fallback", () => {
    const panelError = operatorInferredConnectionPanelErrorFromUnknown(
      apiLoadFailure("Database Query Failed: table missing."),
      "Could not load proposed connections.",
      "load",
    );

    expect(panelError).toEqual({
      message: "Database Query Failed: table missing.",
      kind: "load",
    });
  });

  it("uses the fallback when the mapped message is blank", () => {
    const panelError = operatorInferredConnectionPanelErrorFromUnknown(
      apiLoadFailure("   "),
      "Could not load inference questionnaire items.",
      "load",
    );

    expect(panelError.message).toBe("Could not load inference questionnaire items.");
    expect(panelError.kind).toBe("load");
  });

  it("maps a thrown Error message", () => {
    const panelError = operatorInferredConnectionPanelErrorFromUnknown(
      new Error("Network down"),
      "Could not confirm the selected connection.",
      "mutation",
    );

    expect(panelError).toEqual({
      message: "Network down",
      kind: "mutation",
    });
  });
});

describe("operatorInferredConnectionPanelErrorRecoveryScenario", () => {
  it("maps load failures to api-problem", () => {
    expect(operatorInferredConnectionPanelErrorRecoveryScenario("load")).toBe("api-problem");
  });

  it("maps mutation failures to governance-mutation", () => {
    expect(operatorInferredConnectionPanelErrorRecoveryScenario("mutation")).toBe("governance-mutation");
  });
});
