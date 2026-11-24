import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round133 mounted contract", () => {
  it("drift, package changes, decision register, approvals off load failure", () => {
    const drift = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");
    const driftLoadAt = drift.indexOf('data-testid="infra-drift-load-error-panel"');
    expect(drift).toContain("if (loadError != null) {");
    expect(drift).toContain("return null;");
    const renderEmptyAt = drift.indexOf("const renderChangesEmptyState");
    expect(drift.indexOf("if (loadError != null)", renderEmptyAt)).toBeGreaterThan(renderEmptyAt);
    expect(drift).toContain("!loadingDiffs && loadError == null && selectedSnapshotId.length > 0 && diffs.length === 0");
    expect(drift).toContain("!loadingDiffs && loadError == null && selectedSnapshotId.length > 0 && diffs.length > 0 && visibleDiffs.length === 0");
    expect(driftLoadAt).toBeGreaterThan(-1);

    const packagePanel = readUiSource("components/PackageChangesSinceFinalizePanel.tsx");
    expect(packagePanel).toContain('data-testid="package-changes-since-finalize-timeline-load-failure"');
    expect(packagePanel).toContain('data-testid="package-changes-since-finalize-empty-not-load-failure"');
    expect(packagePanel).toContain("!props.timelineLoadFailure && entries.length === 0");

    const packageSection = readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPackageChangesSinceFinalizeSection.tsx");
    expect(packageSection).toContain("timelineLoadFailure={pipeline.pipelineTimelineFailure}");

    const decision = readUiSource("app/(operator)/governance/decision-register/DecisionRegisterPageShell.tsx");
    const loadAt = decision.indexOf('testId="decision-register-load-error"');
    const emptyAt = decision.indexOf('data-testid="decision-register-empty-not-load-failure"');
    const filterAt = decision.indexOf('data-testid="decision-register-filter-empty-not-load-failure"');
    expect(loadAt).toBeGreaterThan(-1);
    expect(decision).toContain("!loading && !loadError && !hasWorkspaceDecisions");
    expect(decision).toContain("!loading && !loadError && filtersExcludeMatches");
    expect(emptyAt).toBeGreaterThan(loadAt);
    expect(filterAt).toBeGreaterThan(loadAt);

    const approvals = readUiSource("app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx");
    expect(approvals).toContain("listFailure === null");
    expect(approvals).toContain('data-testid="governance-approval-status-filter-empty-not-load-failure"');
    const failureHonestyAt = approvals.indexOf("GovernanceWorkflowApprovalsListLoadFailureHonesty");
    const filterEmptyAt = approvals.indexOf("showStatusFilterEmpty");
    expect(failureHonestyAt).toBeLessThan(filterEmptyAt);
  });
});
