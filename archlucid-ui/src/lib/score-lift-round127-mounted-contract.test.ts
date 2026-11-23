import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round127 mounted contract", () => {
  it("attack path unevaluated and digest empty gates", () => {
    const attack = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx");
    expect(attack).toContain('data-testid="attack-path-report-unevaluated-empty-not-load-failure"');
    const errorStart = attack.indexOf("reportQuery.isError");
    const successStart = attack.indexOf("reportQuery.isSuccess");
    const loadFailureAt = attack.indexOf('data-testid="attack-path-report-load-failure"');
    const unevaluatedOnlyAt = attack.indexOf('data-testid="attack-path-report-unevaluated-only-not-load-failure"');
    expect(errorStart).toBeGreaterThan(-1);
    expect(successStart).toBeGreaterThan(errorStart);
    expect(loadFailureAt).toBeGreaterThan(errorStart);
    expect(loadFailureAt).toBeLessThan(successStart);
    expect(unevaluatedOnlyAt).toBeGreaterThan(successStart);
  const errorSlice = attack.slice(errorStart, successStart);
    expect(errorSlice).not.toContain('data-testid="attack-path-report-unevaluated-only-not-load-failure"');
    const digests = readUiSource("components/digests/DigestsBrowseContent.tsx");
    expect(digests).toContain("showEmptyComposition && failure === null");
    expect(digests).toContain("setupIncomplete && digests.length > 0 && failure === null");
    const hook = readUiSource("components/digests/use-digests-browse-content.ts");
    expect(hook).toContain("const showEmptyComposition: boolean = !loading && digests.length === 0 && failure === null");
  });
});
