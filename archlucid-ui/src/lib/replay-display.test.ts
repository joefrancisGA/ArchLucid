import { describe, expect, it } from "vitest";

import {
  replayModeLabel,
  replayModeShortLabel,
  replayValidationActionLabel,
  sortReplayNotes,
} from "./replay-display";

describe("replayModeLabel", () => {
  it("returns known descriptions", () => {
    expect(replayModeLabel("ReconstructOnly")).toContain("Validate only");
    expect(replayModeLabel("RebuildManifest")).toContain("Rebuild evidence trail");
  });

  it("falls back to raw mode", () => {
    expect(replayModeLabel("UnknownMode")).toBe("UnknownMode");
  });
});

describe("replayModeShortLabel", () => {
  it("returns short labels without API enum names", () => {
    expect(replayModeShortLabel("ReconstructOnly")).toBe("Validate only");
    expect(replayModeShortLabel("RebuildArtifacts")).toBe("Regenerate exported artifacts");
  });
});

describe("replayValidationActionLabel", () => {
  it("uses validate review package for validate-only mode", () => {
    expect(replayValidationActionLabel("ReconstructOnly", false)).toBe("Validate review package");
    expect(replayValidationActionLabel("RebuildManifest", false)).toBe("Run validation");
    expect(replayValidationActionLabel("ReconstructOnly", true)).toBe("Validating…");
  });
});

describe("sortReplayNotes", () => {
  it("sorts lines with en locale", () => {
    expect(sortReplayNotes(["b", "a", "a2"])).toEqual(["a", "a2", "b"]);
  });
});
