import { describe, expect, it } from "vitest";

import {
  deriveReplayValidationOutcome,
  formatReplayDurationLabel,
  replayValidationActionLabel,
  replayValidationModeDefinition,
  replayValidationOutcomeLabel,
} from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";

function buildResponse(overrides: Partial<ReplayResponse["validation"]> = {}): ReplayResponse {
  return {
    runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    mode: "ReconstructOnly",
    replayedUtc: "2026-07-11T12:00:00.000Z",
    validation: {
      contextPresent: true,
      graphPresent: true,
      findingsPresent: true,
      manifestPresent: true,
      tracePresent: true,
      artifactsPresent: true,
      manifestHashMatches: true,
      artifactBundlePresentAfterReplay: true,
      notes: [],
      ...overrides,
    },
  };
}

describe("replayValidationModeDefinition", () => {
  it("describes each validation depth with AI and mutability details", () => {
    expect(replayValidationModeDefinition("ReconstructOnly").aiUsageLabel).toBe("None");
    expect(replayValidationModeDefinition("RebuildManifest").aiUsageLabel).toBe("Limited");
    expect(replayValidationModeDefinition("RebuildArtifacts").aiUsageLabel).toBe("Full");
  });

  it("uses mode-aware primary action labels", () => {
    expect(replayValidationActionLabel("ReconstructOnly", false)).toBe("Check stored package");
    expect(replayValidationActionLabel("RebuildManifest", false)).toBe("Rebuild outputs");
    expect(replayValidationActionLabel("RebuildArtifacts", false)).toBe("Run full validation");
  });
});

describe("deriveReplayValidationOutcome", () => {
  it("returns valid for a clean read-only validation", () => {
    expect(deriveReplayValidationOutcome({ response: buildResponse(), failure: null })).toBe("valid");
  });

  it("returns valid_with_warnings when notes are present", () => {
    expect(
      deriveReplayValidationOutcome({
        response: buildResponse({ notes: ["Minor drift in artifact metadata."] }),
        failure: null,
      }),
    ).toBe("valid_with_warnings");
  });

  it("returns invalid when critical checks fail", () => {
    expect(
      deriveReplayValidationOutcome({
        response: buildResponse({ manifestHashMatches: false }),
        failure: null,
      }),
    ).toBe("invalid");
  });

  it("returns incomplete when optional artifacts are missing", () => {
    expect(
      deriveReplayValidationOutcome({
        response: buildResponse({ artifactsPresent: false }),
        failure: null,
      }),
    ).toBe("incomplete");
  });

  it("returns failed and canceled states", () => {
    expect(
      deriveReplayValidationOutcome({
        response: null,
        failure: { title: "Failed", message: "x", status: 500, correlationId: null },
      }),
    ).toBe("failed");
    expect(deriveReplayValidationOutcome({ response: null, failure: null, canceled: true })).toBe("canceled");
  });
});

describe("replayValidationOutcomeLabel", () => {
  it("maps precise result states", () => {
    expect(replayValidationOutcomeLabel("valid")).toBe("Valid");
    expect(replayValidationOutcomeLabel("valid_with_warnings")).toBe("Valid with warnings");
    expect(replayValidationOutcomeLabel("invalid")).toBe("Invalid");
    expect(replayValidationOutcomeLabel("incomplete")).toBe("Incomplete");
    expect(replayValidationOutcomeLabel("failed")).toBe("Failed");
    expect(replayValidationOutcomeLabel("canceled")).toBe("Cancelled");
  });
});

describe("formatReplayDurationLabel", () => {
  it("formats short and long durations", () => {
    expect(formatReplayDurationLabel(500)).toBe("< 1 sec");
    expect(formatReplayDurationLabel(65000)).toBe("1 min 5 sec");
  });
});
