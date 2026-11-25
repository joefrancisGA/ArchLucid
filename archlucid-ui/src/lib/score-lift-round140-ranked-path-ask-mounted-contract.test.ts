import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round140 ranked path Ask mounted contract", () => {
  it("diagrams workbench handoff", () => {
    const diagrams = readUiSource("app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx");
    expect(diagrams).toContain("infra-diagrams-ranked-path-ask-handoff");
    expect(diagrams).toContain("urlSecurityEvidencePathId");
  });

  it("diagram reconcile workbench handoff", () => {
    const reconcile = readUiSource("app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx");
    expect(reconcile).toContain("infra-diagram-reconcile-ranked-path-ask-handoff");
    expect(reconcile).toContain("urlSecurityEvidencePathId");
  });
});
