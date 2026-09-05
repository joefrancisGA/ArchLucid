import { describe, expect, it } from "vitest";

import { resolveProbeAwareRecoverySteps } from "./resolve-probe-aware-recovery-steps";

const baseSteps = [
  "Review execution stopped before the first pipeline stage. Check AI availability below to confirm whether platform AI is healthy.",
  "If the live probe reports an outage, open Report a problem and include this review id so support can investigate.",
  "When the live probe succeeds, click Re-run review to retry with the same intake.",
];

describe("resolveProbeAwareRecoverySteps", () => {
  it("shows automatic-check pending steps while the probe is idle or loading", () => {
    const idleSteps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: { status: "idle" },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
    });
    const loadingSteps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: { status: "loading" },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
    });

    expect(idleSteps.join(" ")).toContain("Checking live AI availability automatically");
    expect(loadingSteps.join(" ")).toContain("Checking live AI availability automatically");
    expect(idleSteps).not.toEqual(baseSteps);
  });

  it("returns no numbered steps when the live probe succeeds", () => {
    const steps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: {
        status: "loaded",
        result: {
          isAvailable: true,
          validated: true,
          aiSource: "managed-platform",
          summary: "ArchLucid-managed Azure OpenAI live probe succeeded for deployment 'gpt-5.6-terra'.",
          asOfUtc: "2026-09-01T11:24:56.000Z",
          checks: [],
          debug: {},
        },
      },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
    });

    expect(steps).toEqual([]);
  });

  it("returns no numbered steps when the probe succeeds on a terminal review failure", () => {
    const steps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: {
        status: "loaded",
        result: {
          isAvailable: true,
          validated: true,
          aiSource: "managed-platform",
          summary: "ArchLucid-managed Azure OpenAI live probe succeeded.",
          asOfUtc: "2026-09-01T11:24:56.000Z",
          checks: [],
          debug: {},
        },
      },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
      reviewTerminalFailure: true,
    });

    expect(steps).toEqual([]);
  });

  it("shows outage steps only after the live probe reports unavailability", () => {
    const steps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: {
        status: "loaded",
        result: {
          isAvailable: false,
          validated: true,
          aiSource: "managed-platform",
          summary: "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
          asOfUtc: "2026-09-01T11:24:56.000Z",
          checks: [],
          debug: {},
        },
      },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
    });

    expect(steps.join(" ")).toContain("ArchLucid-managed AI is unavailable");
    expect(steps.join(" ")).toContain("Report a problem");
  });

  it("shows retry guidance when automatic checks fail", () => {
    const steps = resolveProbeAwareRecoverySteps({
      baseSteps,
      probeState: { status: "error", message: "AI availability check timed out after 20s." },
      usesCustomerAiConnection: false,
      canConfigureWorkspaceAi: true,
    });

    expect(steps.join(" ")).toContain("Automatic AI availability checks could not finish");
    expect(steps.join(" ")).toContain("Check AI availability");
  });
});
