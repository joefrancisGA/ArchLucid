import { describe, expect, it } from "vitest";

import {
  appendArchitectureDraftRequirementsImport,
  architectureDraftRequirementsFileKey,
  newlyAddedArchitectureDraftRequirementFiles,
} from "@/lib/architecture/architecture-draft-requirements-import";

describe("architecture-draft-requirements-import", () => {
  it("appends extracted text with a file attribution section", () => {
    expect(
      appendArchitectureDraftRequirementsImport("Existing overview.", "reqs.md", "New requirement line."),
    ).toBe("Existing overview.\n\n---\nFrom reqs.md:\n\nNew requirement line.");
  });

  it("uses extracted text alone when overview is empty", () => {
    expect(appendArchitectureDraftRequirementsImport("", "reqs.txt", "Only file text.")).toBe("Only file text.");
  });

  it("detects newly added files by stable key", () => {
    const file = new File(["a"], "a.md", { type: "text/plain" });
    const key = architectureDraftRequirementsFileKey(file);
    const known = new Set<string>([key]);

    expect(newlyAddedArchitectureDraftRequirementFiles(known, [file])).toEqual([]);
    expect(newlyAddedArchitectureDraftRequirementFiles(new Set(), [file])).toEqual([file]);
  });
});
