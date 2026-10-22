import { describe, expect, it } from "vitest";

import {
  replayModeLabel,
  replayModeShortLabel,
  replayValidationActionLabel,
  sortReplayNotes,
} from "./replay-display";

describe("replay-display compatibility", () => {
  it("returns updated mode labels", () => {
    expect(replayModeShortLabel("ReconstructOnly")).toBe("Check stored package");
    expect(replayModeLabel("RebuildManifest")).toContain("Regenerates selected derived outputs");
  });

  it("uses mode-aware action labels", () => {
    expect(replayValidationActionLabel("RebuildArtifacts", false)).toBe("Run full validation");
    expect(replayValidationActionLabel("ReconstructOnly", true)).toBe("Checking stored package…");
  });

  it("sorts validation notes", () => {
    expect(sortReplayNotes(["b", "a"])).toEqual(["a", "b"]);
  });
});
