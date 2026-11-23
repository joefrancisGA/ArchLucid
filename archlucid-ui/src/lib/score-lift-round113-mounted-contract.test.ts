import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round113 mounted contract", () => {
  it("hub audit, terraform, overview audit, digests setup", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-audit-stored-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-terraform-not-mapped-stored-empty-not-load-failure"');
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain('data-testid="resource-hub-overview-audit-unavailable-not-load-failure"');
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain(
      'data-testid="digests-browse-setup-empty-not-load-failure"',
    );
  });
});
