import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round112 mounted contract", () => {
  it("hub drift, diagram, remediation, digests delivery attempts", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-drift-stored-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-diagram-stored-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-remediation-stored-empty-not-load-failure"');
    expect(readUiSource("components/digests/DigestsBrowseDetailPanel.tsx")).toContain(
      'data-testid="digests-browse-delivery-attempts-empty-not-load-failure"',
    );
  });
});
