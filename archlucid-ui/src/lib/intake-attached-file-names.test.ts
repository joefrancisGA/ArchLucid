import { describe, expect, it } from "vitest";

import { appendIntakeAttachedFileNames, extractAttachedIntakeFileNames } from "@/lib/intake-attached-file-names";

const GENERATED_BRIEF = [
  'Architecture review intake for "Retail API modernization review".',
  "Evaluate the attached materials for architecture structure, cost, compliance, security, and policy-pack violations.",
  "Treat each upload as architecture evidence unless a more specific category was supplied.",
].join(" ");

describe("extractAttachedIntakeFileNames", () => {
  it("reads dash-prefixed names from the generated intake brief", () => {
    const description = `${GENERATED_BRIEF}\n\nAttached files:\n- ARCHITECTURE_HANDBOOK.docx\n- network-topology.pdf`;

    expect(extractAttachedIntakeFileNames(description)).toEqual([
      "ARCHITECTURE_HANDBOOK.docx",
      "network-topology.pdf",
    ]);
  });

  it("returns empty when the brief has no attached-files section", () => {
    expect(extractAttachedIntakeFileNames(GENERATED_BRIEF)).toEqual([]);
    expect(extractAttachedIntakeFileNames(null)).toEqual([]);
    expect(extractAttachedIntakeFileNames("")).toEqual([]);
  });

  it("accepts the legacy attached-architecture-evidence heading", () => {
    expect(extractAttachedIntakeFileNames("Attached architecture evidence:\n- brief.md")).toEqual(["brief.md"]);
  });
});

describe("appendIntakeAttachedFileNames", () => {
  it("appends a dash-prefixed attached-files block", () => {
    const brief = "Vertex tenant migration with private networking goals.";

    expect(appendIntakeAttachedFileNames(brief, ["handbook.docx"])).toBe(
      `${brief}\n\nAttached files:\n- handbook.docx`,
    );
  });

  it("replaces an existing attached-files block", () => {
    const brief = "Review scope.\n\nAttached files:\n- old.pdf";

    expect(appendIntakeAttachedFileNames(brief, ["new.docx", "topology.pdf"])).toBe(
      "Review scope.\n\nAttached files:\n- new.docx\n- topology.pdf",
    );
  });
});
