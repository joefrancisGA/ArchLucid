import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round77 mounted contract", () => {
  it("remediation active filters, golden manifest commit-first, catalog RP, category filter, attack path, findings job view", () => {
    expect(readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx")).toContain(
      "RemediationWorkbenchActiveFiltersSummaryLine",
    );
    expect(readUiSource("components/GoldenManifestExportMenu.tsx")).toContain(
      "golden-manifest-export-error-commit-before-seal",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogSection.tsx")).toContain(
      "policy-packs-catalog-load-failure",
    );
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      "connection-status-category-filter-empty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      "attack-path-report-unevaluated-only-not-load-failure",
    );
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx")).toContain(
      "governance-findings-job-view-filter-empty-not-load-failure",
    );
  });
});