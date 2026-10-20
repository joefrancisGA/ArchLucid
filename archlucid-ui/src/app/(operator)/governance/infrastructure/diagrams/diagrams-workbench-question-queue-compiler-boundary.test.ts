import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const diagramsDir = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "governance",
  "infrastructure",
  "diagrams",
);

function readDiagramsSource(fileName: string): string {
  return readFileSync(join(diagramsDir, fileName), "utf8");
}

describe("diagrams workbench SecureNow question-queue compiler boundary", () => {
  it("keeps queue consumers outside DiagramsWorkbenchClient so React Compiler cannot inline them above the provider", () => {
    const workbench = readDiagramsSource("DiagramsWorkbenchClient.tsx");
    const fallback = readDiagramsSource("DiagramsWorkbenchSecureNowQuestionBarFallback.tsx");
    const viewer = readDiagramsSource("DiagramsWorkbenchSecureNowAwareDiagramViewer.tsx");
    const hookSource = readFileSync(
      join(process.cwd(), "src", "components", "infra-evidence", "securenow-question-queue-provider.tsx"),
      "utf8",
    );

    expect(workbench).not.toContain("useSecureNowQuestionQueue(");
    expect(workbench).toContain("DiagramsWorkbenchSecureNowQuestionBarFallback");
    expect(workbench).toContain("DiagramsWorkbenchSecureNowAwareDiagramViewer");
    expect(fallback).toContain('"use no memo"');
    expect(viewer).toContain('"use no memo"');
    expect(hookSource).toContain('"use no memo"');
  });
});
