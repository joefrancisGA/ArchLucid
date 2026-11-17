import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round63 mounted contract", () => {
  it("compare, digests browse, attack path, ask page, patterns, decision register", () => {
    expect(
      readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelPartialInventoryFootnote.tsx"),
    ).toContain("compare-results-partial-inventory-footnote");
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain(
      "digests-browse-scoped-filter-empty-state",
    );
    expect(
      readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx"),
    ).toContain("attack-path-report-table-partial-capture");
    expect(readUiSource("app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx")).toContain(
      "infrastructure-ask-page-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx")).toContain(
      "REMEDIATION_PATTERNS_FILTER_NO_MATCH_NOT_LOAD_FAILURE_LINE",
    );
    expect(readUiSource("app/(operator)/governance/decision-register/DecisionRegisterPageShell.tsx")).toContain(
      "decision-register-filter-empty-not-load-failure",
    );
  });
});