import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round131 mounted contract", () => {
  it("diagram stale off load error, DOCX, golden Markdown, run ZIP finalize", () => {
    const diagram = readUiSource("app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx");
    const loadErrorAt = diagram.indexOf('data-testid="infra-diagram-reconcile-load-error"');
    const staleAt = diagram.indexOf('data-testid="infra-diagram-reconcile-stale-snapshot-filter-empty-not-load-failure"');
    expect(loadErrorAt).toBeGreaterThan(-1);
    expect(staleAt).toBeGreaterThan(loadErrorAt);
    const staleGateAt = diagram.lastIndexOf("loadError == null", staleAt);
    expect(staleGateAt).toBeGreaterThan(-1);
    expect(staleGateAt).toBeLessThan(staleAt);

    const consulting = readUiSource("components/ConsultingDocxExportButton.tsx");
    expect(consulting).toContain('data-testid="consulting-docx-export-finalize-not-load-failure"');
    const whitelabel = readUiSource("components/ReviewBoardWhitelabelConsultingExportButton.tsx");
    expect(whitelabel).toContain('data-testid="whitelabel-consulting-export-finalize-not-load-failure"');

    const golden = readUiSource("components/GoldenManifestExportMenu.tsx");
    expect(golden).toContain('data-testid="golden-manifest-markdown-export-finalize-not-load-failure"');
    expect(golden).toContain('data-testid="golden-manifest-server-markdown-export-finalize-not-load-failure"');
    expect(golden).toContain('data-testid="golden-manifest-export-more-formats-trigger"');

    const runDetail = readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx");
    expect(runDetail).toContain('data-testid="run-detail-evidence-bundle-export-finalize-not-load-failure"');
    expect(runDetail).toContain('data-testid="run-detail-manifest-bundle-export-finalize-not-load-failure"');
    expect(runDetail).toContain("buyerMarkdownAsPrimaryButton");
  });
});
