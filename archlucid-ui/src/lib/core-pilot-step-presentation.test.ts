import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_FINAL_STEP_INDEX,
  resolveCorePilotStepPresentation,
  resolveFirstRunWizardMode,
  shouldShowWizardModeToggle,
} from "@/lib/core-pilot-step-presentation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveCorePilotStepPresentation", () => {
  it("returns default step action for non-final steps", () => {
    const presentation = resolveCorePilotStepPresentation(0, {
      hasCommittedManifest: false,
      latestCommittedRunId: null,
    });

    expect(presentation.label).toBe("Start or open review");
    expect(presentation.href).toBe("/architecture/reviews/new");
  });

  it("links final step to sample review when tenant has no committed package", () => {
    const presentation = resolveCorePilotStepPresentation(CORE_PILOT_FINAL_STEP_INDEX, {
      hasCommittedManifest: false,
      latestCommittedRunId: null,
    });

    expect(presentation.label).toBe("Open sample finalized review");
    expect(presentation.href).toBe(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);
  });

  it("links final step to committed review when tenant has a package", () => {
    const runId = "run-committed-001";
    const presentation = resolveCorePilotStepPresentation(CORE_PILOT_FINAL_STEP_INDEX, {
      hasCommittedManifest: true,
      latestCommittedRunId: runId,
    });

    expect(presentation.label).toBe("Open finalized review");
    expect(presentation.href).toBe(`/architecture/reviews/${runId}`);
  });
});

describe("resolveFirstRunWizardMode", () => {
  it("defaults first-run tenants to quick start", () => {
    expect(
      resolveFirstRunWizardMode({ hasCommittedManifest: false, storedMode: null }),
    ).toBe("quick");
  });

  it("honors stored full mode when tenant opts in before first commit", () => {
    expect(
      resolveFirstRunWizardMode({ hasCommittedManifest: false, storedMode: "full" }),
    ).toBe("full");
  });

  it("defaults returning tenants to full wizard when no stored preference", () => {
    expect(
      resolveFirstRunWizardMode({ hasCommittedManifest: true, storedMode: null }),
    ).toBe("full");
  });
});

describe("shouldShowWizardModeToggle", () => {
  it("hides mode toggle until first-run operator opts into advanced configuration", () => {
    expect(shouldShowWizardModeToggle(false, false)).toBe(false);
    expect(shouldShowWizardModeToggle(false, true)).toBe(true);
  });

  it("shows mode toggle for tenants with a committed review", () => {
    expect(shouldShowWizardModeToggle(true, false)).toBe(true);
  });
});
