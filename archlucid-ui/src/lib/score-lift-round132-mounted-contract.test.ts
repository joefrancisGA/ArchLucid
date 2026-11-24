import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round132 mounted contract", () => {
  it("infra workbench empty states off load failure branches", () => {
    const diagram = readUiSource("app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx");
    const reconErrAt = diagram.indexOf('testId="infra-diagram-reconcile-reconciliation-load-error"');
    const resultsAt = diagram.indexOf('reconciliation != null && reconciliationLoadState !== "error"');
    expect(reconErrAt).toBeGreaterThan(-1);
    expect(resultsAt).toBeGreaterThan(reconErrAt);

    const terraform = readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx");
    const loadErrAt = terraform.indexOf('data-testid="infra-terraform-load-error"');
    const emptyAt = terraform.indexOf('data-testid="infra-terraform-mapping-empty-not-load-failure"');
    expect(loadErrAt).toBeGreaterThan(-1);
    expect(terraform).toContain("!hasTerraformMapping && loadError == null");
    expect(emptyAt).toBeGreaterThan(loadErrAt);

    const diagrams = readUiSource("app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx");
    const diagramsLoadAt = diagrams.indexOf('testId="infra-diagrams-load-error-panel"');
    const familyAt = diagrams.indexOf('data-testid="infra-diagrams-evidence-family-empty-not-load-failure"');
    expect(diagramsLoadAt).toBeGreaterThan(-1);
    expect(familyAt).toBeGreaterThan(-1);
    const familyGateAt = diagrams.lastIndexOf("loadError == null", familyAt);
    expect(familyGateAt).toBeGreaterThan(-1);
    expect(familyGateAt).toBeLessThan(familyAt);

    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    const explorerLoadAt = explorer.indexOf('data-testid="infra-resource-explorer-load-error"');
    const explorerEmptyAt = explorer.indexOf('data-testid="infra-resource-explorer-empty-not-failure"');
    expect(explorerLoadAt).toBeGreaterThan(-1);
    expect(explorer).toContain("rows.length === 0 && loadError == null");
    expect(explorer).toContain("{loadError == null ? (");
    expect(explorerEmptyAt).toBeGreaterThan(explorerLoadAt);
  });
});
