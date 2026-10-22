import { describe, expect, it } from "vitest";

import {
  AgentOutputQualityGateOutcomeWire,
  formatQualityGateCareerExportBlockedReason,
  formatQualityGateModeStampLabel,
  shouldBlockWorkingCareerExportForQualityGate,
  shouldSuppressReadyToFinalizeForQualityGateHonesty,
} from "@/lib/governance/agent-output-quality-gate-career-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

describe("agent-output-quality-gate-career-honesty (DR-05)", () => {
  it("formats stamp label from recorded mode when present", () => {
    expect(formatQualityGateModeStampLabel("PilotStrict", "WarnOnly")).toBe("Quality gate: PilotStrict");
    expect(formatQualityGateModeStampLabel(null, "WarnOnly")).toBe("Quality gate: WarnOnly");
  });

  it("blocks Working real-mode career export when host is Real + WarnOnly", () => {
    expect(
      shouldBlockWorkingCareerExportForQualityGate({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        isSample: false,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(true);

    expect(
      formatQualityGateCareerExportBlockedReason({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        isSample: false,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toContain("WarnOnly");
  });

  it("allows PilotStrict host posture on real-mode Working runs", () => {
    expect(
      shouldBlockWorkingCareerExportForQualityGate({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        isSample: false,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "PilotStrict",
        aggregateQualityGateOutcome: AgentOutputQualityGateOutcomeWire.Accepted,
      }),
    ).toBe(false);
  });

  it("blocks Working real-mode career export when disposition is Warned", () => {
    expect(
      formatQualityGateCareerExportBlockedReason({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        isSample: false,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "PilotStrict",
        aggregateQualityGateOutcome: AgentOutputQualityGateOutcomeWire.Warned,
      }),
    ).toContain("Warned");
  });

  it("does not block simulator or sample runs", () => {
    expect(
      shouldBlockWorkingCareerExportForQualityGate({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(false);

    expect(
      shouldBlockWorkingCareerExportForQualityGate({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        isSample: true,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(false);
  });

  it("suppresses Ready to finalize when quality gate honesty applies", () => {
    expect(
      shouldSuppressReadyToFinalizeForQualityGateHonesty({
        workingDesk: true,
        structuralExecutionMode: StructuralExecutionModeWire.Real,
        hostAgentExecutionMode: "Real",
        hostQualityGateMode: "WarnOnly",
      }),
    ).toBe(true);
  });
});
