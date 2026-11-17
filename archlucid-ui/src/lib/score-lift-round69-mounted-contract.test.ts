import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round69 mounted contract", () => {
  it("connection status, digest scoped filter, compare correlation results, hub audit, terraform, graph, sealed records", () => {
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      "ConnectionStatusEmptyPartialHonesty",
    );
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain(
      "DigestsBrowseScopedFilterPartialHonesty",
    );
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      "CompareFindingCorrelationPartialResultsHonesty",
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-audit-tab-partial-capture");
    expect(readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx")).toContain(
      "infra-terraform-mapping-empty-partial-capture",
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphIdlePlaceholder.tsx")).toContain(
      "GraphIdlePartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/governance/sealed-records/_sections/SignedRecordsListEmptyStates.tsx")).toContain(
      "SignedRecordsFilterEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient.tsx")).toContain(
      "SignedRecordsUnscopedListPartialHonesty",
    );
  });
});