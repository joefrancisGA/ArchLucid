import { describe, expect, it } from "vitest";

import {
  resolveFirstPilotOperatingRailShellCopy,
  resolveFirstPilotOperatingRailStepsForDisplay,
} from "@/lib/first-pilot-operating-rail-copy";

describe("resolveFirstPilotOperatingRailShellCopy", () => {
  it("returns operator rollout copy for full operator shell", () => {
    const copy = resolveFirstPilotOperatingRailShellCopy(false);

    expect(copy.heading).toBe("First-pilot operating path");
    expect(copy.intro).toContain("V1.1 connectors");
    expect(copy.showHeaderHelpLink).toBe(true);
    expect(copy.showStepTroubleshootLinks).toBe(true);
  });

  it("returns buyer-safe shell copy without roadmap language", () => {
    const copy = resolveFirstPilotOperatingRailShellCopy(true);

    expect(copy.heading).toBe("Guided review workflow");
    expect(copy.intro).not.toContain("V1.1");
    expect(copy.intro).not.toContain("First-pilot");
    expect(copy.showHeaderHelpLink).toBe(false);
    expect(copy.showStepTroubleshootLinks).toBe(false);
  });
});

describe("resolveFirstPilotOperatingRailStepsForDisplay", () => {
  it("returns operator step labels unchanged", () => {
    const steps = resolveFirstPilotOperatingRailStepsForDisplay(false);
    const execute = steps.find((step) => step.id === "execute-review");

    expect(execute?.title).toBe("Execute the review pipeline");
    expect(execute?.primaryLabel).toBe("Open reviews");
  });

  it("rewrites step labels for buyer-polished shell", () => {
    const steps = resolveFirstPilotOperatingRailStepsForDisplay(true);

    expect(steps.find((step) => step.id === "verify-setup")?.primaryLabel).toBe("Confirm readiness");
    expect(steps.find((step) => step.id === "ingest-evidence")?.primaryLabel).toBe("Upload evidence");
    expect(steps.find((step) => step.id === "create-review")?.title).toBe("Create review package");
    expect(steps.find((step) => step.id === "execute-review")?.title).toBe("Complete the guided assessment");
    expect(steps.find((step) => step.id === "execute-review")?.shortBody).not.toContain("pipeline");
    expect(steps.find((step) => step.id === "ingest-evidence")?.primaryLabel).not.toBe("Extract and upload");
  });
});
