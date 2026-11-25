import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round139 ranked path Ask mounted contract", () => {
  it("remediation workbench handoff", () => {
    const remediation = readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx");
    expect(remediation).toContain("infra-remediation-ranked-path-ask-handoff");
    expect(remediation).toContain("urlSecurityEvidencePathId");
  });

  it("resource hub handoff", () => {
    const hub = readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx");
    expect(hub).toContain("infra-resource-hub-ranked-path-ask-handoff");
    expect(hub).toContain("urlSecurityEvidencePathId");
  });
});
