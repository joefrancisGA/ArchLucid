import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round126 mounted contract", () => {
  it("compare, terraform, and diagram empty honesty", () => {
    const quality = readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel.tsx");
    expect(quality).toContain('data-testid="compare-quality-delta-zero-counts-one-unsealed"');
    expect(quality).toContain('data-testid="compare-quality-delta-zero-counts-one-unsealed-not-load-failure"');
    const band = readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareClassificationBandDeltaPanel.tsx");
    expect(band).toContain('data-testid="compare-classification-band-zero-counts-one-unsealed"');
    expect(band).toContain('data-testid="compare-classification-band-zero-counts-one-unsealed-not-load-failure"');
    const terraform = readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx");
    const loadErrorAt = terraform.indexOf('data-testid="infra-terraform-load-error"');
    const emptyAt = terraform.indexOf('testId="infra-terraform-empty-state"');
    const mappingAt = terraform.indexOf('data-testid="infra-terraform-mapping-empty-not-load-failure"');
    expect(loadErrorAt).toBeGreaterThan(-1);
    expect(emptyAt).toBeGreaterThan(loadErrorAt);
    expect(mappingAt).toBeGreaterThan(emptyAt);
    const diagrams = readUiSource("app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx");
    const familyAt = diagrams.indexOf('data-testid="infra-diagrams-evidence-family-empty"');
    const familyHonestyAt = diagrams.indexOf('data-testid="infra-diagrams-evidence-family-empty-not-load-failure"');
    expect(familyAt).toBeGreaterThan(-1);
    expect(familyHonestyAt).toBeGreaterThan(familyAt);
  });
});
