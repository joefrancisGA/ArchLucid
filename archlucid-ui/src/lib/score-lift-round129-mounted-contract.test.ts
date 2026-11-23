import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round129 mounted contract", () => {
  it("golden lineage, share package, itsm create, and connection category bands", () => {
    const golden = readUiSource("components/GoldenManifestExportMenu.tsx");
    expect(golden).toContain('data-testid="golden-manifest-lineage-verify-http-failure"');
    expect(golden).toContain('data-testid="golden-manifest-lineage-verify-http-failure-more-formats"');

    const share = readUiSource("components/ShareReviewPackageButton.tsx");
    const commitAt = share.indexOf('data-testid="share-review-package-commit-disabled-line"');
    const postSealAt = share.indexOf('data-testid="share-review-package-post-seal-api-failure"');
    expect(commitAt).toBeGreaterThan(-1);
    expect(postSealAt).toBeGreaterThan(-1);
    expect(share).toContain("shareDisabledReason !== null && !committed");
    expect(share).toContain("sharePostSealApiFailure ?");

    const itsm = readUiSource("components/itsm/ItsmOutboundQuickActions.tsx");
    const connectorOffAt = itsm.indexOf('data-testid="itsm-create-connector-off-not-failed-create"');
    const corrFailureAt = itsm.indexOf('data-testid="itsm-create-correlation-load-failure"');
    expect(connectorOffAt).toBeGreaterThan(-1);
    expect(corrFailureAt).toBeGreaterThan(-1);
    const earlyReturnSlice = itsm.slice(0, connectorOffAt);
    expect(earlyReturnSlice).toContain("!correlationsError");
    expect(earlyReturnSlice).not.toContain('data-testid="itsm-create-correlation-load-failure"');

    const connection = readUiSource("components/integrations/ConnectorOperationsDashboard.tsx");
    const pinnedAt = connection.indexOf("workspaceSubscriptionScopePinned ?");
    expect(pinnedAt).toBeGreaterThan(-1);
    const elseAt = connection.indexOf(") : (", pinnedAt);
    const pinnedBranch = connection.slice(pinnedAt, elseAt);
    const categoryOnlyAt = connection.indexOf('data-testid="connection-status-category-only-filter-empty"');
    expect(pinnedBranch).not.toContain('data-testid="connection-status-category-only-filter-empty"');
    expect(categoryOnlyAt).toBeGreaterThan(elseAt);
  });
});
