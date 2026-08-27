import { describe, expect, it } from "vitest";

import {
  resolvePreferencesSaveEmphasizedStepId,
  resolvePreferencesSaveSteps,
} from "@/lib/preferences-save-checklist";

const explicitSynced = {
  isExplicit: true,
  mounted: true,
  accountSyncState: "synced" as const,
};

const implicitDefault = {
  isExplicit: false,
  mounted: true,
  accountSyncState: "idle" as const,
};

describe("preferences-save-checklist", () => {
  it("returns one checklist item per preferences section", () => {
    const steps = resolvePreferencesSaveSteps({
      appearance: implicitDefault,
      timeZone: implicitDefault,
      cloudPlatforms: implicitDefault,
      sampleReviewsOnOverview: implicitDefault,
      followUpLinkStrips: implicitDefault,
    });

    expect(steps.map((step) => step.id)).toEqual([
      "appearance",
      "time-zone",
      "cloud-platforms",
      "sample-reviews-on-overview",
      "follow-up-link-strips",
    ]);
  });

  it("shows Default until a preference is explicitly chosen", () => {
    const steps = resolvePreferencesSaveSteps({
      appearance: implicitDefault,
      timeZone: implicitDefault,
      cloudPlatforms: implicitDefault,
      sampleReviewsOnOverview: implicitDefault,
      followUpLinkStrips: implicitDefault,
    });

    expect(steps.every((step) => step.status === "default")).toBe(true);
  });

  it("shows Done for explicit synced preferences and Pending for explicit unsynced ones", () => {
    const steps = resolvePreferencesSaveSteps({
      appearance: explicitSynced,
      timeZone: {
        isExplicit: true,
        mounted: true,
        accountSyncState: "local-only",
      },
      cloudPlatforms: implicitDefault,
      sampleReviewsOnOverview: explicitSynced,
      followUpLinkStrips: implicitDefault,
    });

    expect(steps.find((step) => step.id === "appearance")?.status).toBe("done");
    expect(steps.find((step) => step.id === "time-zone")?.status).toBe("pending");
    expect(steps.find((step) => step.id === "cloud-platforms")?.status).toBe("default");
    expect(steps.find((step) => step.id === "sample-reviews-on-overview")?.status).toBe("done");
    expect(steps.find((step) => step.id === "follow-up-link-strips")?.status).toBe("default");
  });

  it("emphasizes the first default or pending step", () => {
    const steps = resolvePreferencesSaveSteps({
      appearance: explicitSynced,
      timeZone: {
        isExplicit: true,
        mounted: true,
        accountSyncState: "local-only",
      },
      cloudPlatforms: implicitDefault,
      sampleReviewsOnOverview: implicitDefault,
      followUpLinkStrips: implicitDefault,
    });

    expect(resolvePreferencesSaveEmphasizedStepId(steps)).toBe("time-zone");

    const allDoneSteps = resolvePreferencesSaveSteps({
      appearance: explicitSynced,
      timeZone: explicitSynced,
      cloudPlatforms: explicitSynced,
      sampleReviewsOnOverview: explicitSynced,
      followUpLinkStrips: explicitSynced,
    });

    expect(resolvePreferencesSaveEmphasizedStepId(allDoneSteps)).toBe("follow-up-link-strips");
  });
});
