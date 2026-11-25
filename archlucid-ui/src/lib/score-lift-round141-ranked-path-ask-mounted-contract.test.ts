import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
function readUiSource(relativePath: string) {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}
describe("score lift round141 ranked path Ask mounted contract", () => {
  it("resource explorer handoff", () => {
    const explorer = readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx");
    expect(explorer).toContain("infra-resource-explorer-ranked-path-ask-handoff");
    expect(explorer).toContain("urlSecurityEvidencePathId");
  });
  it("terraform workbench handoff", () => {
    const terraform = readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx");
    expect(terraform).toContain("infra-terraform-ranked-path-ask-handoff");
    expect(terraform).toContain("urlSecurityEvidencePathId");
  });
});