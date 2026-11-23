import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round125 mounted contract", () => {
  it("attack path and digest honesty", () => {
    const attack = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx");
    expect(attack).toContain('data-testid="attack-path-report-vulnerable-empty-not-load-failure"');
    expect(attack).toContain('data-testid="attack-path-report-load-failure"');
    const errorAt = attack.indexOf("reportQuery.isError");
    const successAt = attack.indexOf("reportQuery.isSuccess");
    const retryAt = attack.indexOf('data-testid="attack-path-report-retry"');
    const tableAt = attack.indexOf('data-testid="attack-path-report-table-partial-capture-not-load-failure"');
    expect(errorAt).toBeGreaterThan(-1);
    expect(successAt).toBeGreaterThan(errorAt);
    expect(retryAt).toBeGreaterThan(errorAt);
    expect(retryAt).toBeLessThan(successAt);
    expect(tableAt).toBeGreaterThan(successAt);
    const digests = readUiSource("components/digests/DigestsBrowseContent.tsx");
    expect(digests).toContain('data-testid="digests-browse-scoped-and-subscription-filter-empty-not-load-failure"');
    expect(digests).toContain('data-testid="digests-browse-load-failure"');
    expect(digests).toContain("showEmptyComposition && failure === null");
  });
});
