import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round128 mounted contract", () => {
  it("hub findings, terraform scope, and compare governance diff", () => {
    const hub = readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx");
    expect(hub).toContain('data-testid="infra-resource-hub-findings-architecture-scope-and-severity-empty-not-load-failure"');
    expect(hub).toContain('data-testid="infra-resource-hub-findings-operational-security-stream-empty-not-load-failure"');
    const terraform = readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx");
    expect(terraform).toContain("urlCloudResourceId.length > 0 && loadError != null");
    const unscopedAt = terraform.indexOf('data-testid="infra-terraform-unscoped-panel"');
    const loadErrorAt = terraform.indexOf('data-testid="infra-terraform-load-error"');
    const unscopedBranch = terraform.lastIndexOf("urlCloudResourceId.length === 0", unscopedAt);
    expect(unscopedBranch).toBeGreaterThan(-1);
    expect(unscopedAt).toBeGreaterThan(unscopedBranch);
    const loadSlice = terraform.slice(unscopedAt, loadErrorAt);
    expect(loadSlice).not.toContain('data-testid="infra-terraform-load-error"');
    const compare = readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel.tsx");
    const loadingAt = compare.indexOf('testId="compare-governance-diff-loading"');
    const emptyAt = compare.indexOf('data-testid="compare-governance-diff-empty-not-load-failure"');
    const loadingBranch = compare.indexOf("if (loading)");
    expect(loadingBranch).toBeGreaterThan(-1);
    expect(loadingAt).toBeGreaterThan(loadingBranch);
    expect(emptyAt).toBeGreaterThan(loadingAt);
    const betweenLoadingAndEmpty = compare.slice(loadingAt, emptyAt);
    expect(betweenLoadingAndEmpty).toContain("if (view === null)");
  });
});
