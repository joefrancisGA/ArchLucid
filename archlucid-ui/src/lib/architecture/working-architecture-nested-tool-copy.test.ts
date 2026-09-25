import { describe, expect, it } from "vitest";

import {
  workingArchitectureNestedClaimDiscipline,
  workingArchitectureNestedContextStrip,
  workingArchitectureNestedKeyboardHint,
  workingArchitectureNestedSkipLinkLabel,
  type WorkingArchitectureNestedToolLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";

const TOOL_LABELS: readonly WorkingArchitectureNestedToolLabel[] = [
  "Ask",
  "Compare",
  "Draft",
  "Findings",
  "Graph",
  "Impact preview",
  "Review",
  "Start review",
  "Search",
];

describe("working-architecture-nested-tool-copy", () => {
  it("defines non-empty copy for every nested tool label", () => {
    for (const toolLabel of TOOL_LABELS) {
      expect(workingArchitectureNestedSkipLinkLabel(toolLabel).length).toBeGreaterThan(10);
      expect(workingArchitectureNestedContextStrip(toolLabel).length).toBeGreaterThan(20);
      expect(workingArchitectureNestedClaimDiscipline(toolLabel).length).toBeGreaterThan(20);
      expect(workingArchitectureNestedKeyboardHint(toolLabel).length).toBeGreaterThan(10);
    }
  });

  it("uses tool-specific keyboard hints for inhabited surfaces", () => {
    expect(workingArchitectureNestedKeyboardHint("Findings")).toContain("Alt+1–3");
    expect(workingArchitectureNestedKeyboardHint("Search")).toContain("/ search");
    expect(workingArchitectureNestedKeyboardHint("Draft")).toContain("Ctrl+Shift+S");
  });
});
