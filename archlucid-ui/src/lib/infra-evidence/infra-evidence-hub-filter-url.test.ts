import { describe, expect, it } from "vitest";

import {
  parseResourceHubTabFromSearch,
  buildInfrastructureAskHref,
  buildResourceHubAuditLineageHref,
  buildResourceHubExplorerHref,
  buildResourceHubOverviewHref,
  buildResourceHubWorkCountHref,
  resolveResourceHubTabFromAskScope,
  resourceExplorerFilterHrefFromSearch,
  resourceHubFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { resolveResourceHubTabFromExplorerWorkQueue, formatResourceHubTabViewLabelFromExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";

describe("infra-evidence-hub-filter-url", () => {
  it("builds explorer filter href with trimmed filters", () => {
    expect(
      resourceExplorerFilterHrefFromSearch(
        "",
        { namePrefix: "gateway", resourceType: "Microsoft.Network/publicIPAddresses", resourceGroup: "rg-net" },
      ),
    ).toBe(
      "/governance/infrastructure/resources?namePrefix=gateway&resourceType=Microsoft.Network%2FpublicIPAddresses&resourceGroup=rg-net",
    );
  });

  it("defaults hub tab to overview and omits tab param", () => {
    expect(parseResourceHubTabFromSearch(null)).toBe("overview");
    expect(
      resourceHubFilterHrefFromSearch("11111111-1111-1111-1111-111111111111", "", { tab: "overview" }),
    ).toBe("/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111");
  });

  it("builds hub detail href with tab and audit lineage context", () => {
    expect(
      resourceHubFilterHrefFromSearch("11111111-1111-1111-1111-111111111111", "", {
        tab: "audit",
        assessmentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        auditEvidenceSnapshotId: "22222222-2222-2222-2222-222222222222",
        controlId: "33333333-3333-3333-3333-333333333333",
      }),
    ).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&assessmentId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&auditEvidenceSnapshotId=22222222-2222-2222-2222-222222222222&controlId=33333333-3333-3333-3333-333333333333",
    );
  });

  it("builds hub audit lineage href for audit evidence spine handoff", () => {
    expect(
      buildResourceHubAuditLineageHref("11111111-1111-1111-1111-111111111111", {
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        snapshotId: "22222222-2222-2222-2222-222222222222",
      }),
    ).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("builds Infrastructure Ask href with drift diff context", () => {
    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        diffId: "diff-1",
      }),
    ).toBe(
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
  });

  it("builds Infrastructure Ask href with finding context", () => {
    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        findingId: "finding-1",
      }),
    ).toBe(
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=finding-1",
    );
  });

  it("builds Infrastructure Ask href with remediation instance context", () => {
    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        instanceId: "instance-1",
      }),
    ).toBe(
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&instanceId=instance-1",
    );
  });

  it("builds Infrastructure Ask href with diagram correspondence context", () => {
    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        runId: "run-1",
        correspondenceId: "corr-1",
      }),
    ).toBe(
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&correspondenceId=corr-1&runId=run-1",
    );
  });

  it("builds Infrastructure Ask href with explorer work queue context", () => {
    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        workQueue: "open-findings",
      }),
    ).toBe(
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=open-findings",
    );
  });

  it("builds Infrastructure Ask href with diagram neighborhood seed context", () => {
    const armId = "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway";

    expect(
      buildInfrastructureAskHref({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        seedNodeId: armId,
      }),
    ).toBe(
      `/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&seedNodeId=${encodeURIComponent(armId)}`,
    );
  });

  it("resolves hub tab from Ask scope params", () => {
    expect(resolveResourceHubTabFromAskScope({ findingId: "finding-1" })).toBe("findings");
    expect(resolveResourceHubTabFromAskScope({ instanceId: "instance-1" })).toBe("remediation");
    expect(resolveResourceHubTabFromAskScope({
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    })).toBe("audit");
    expect(resolveResourceHubTabFromAskScope({ correspondenceId: "corr-1" })).toBe("diagram");
    expect(resolveResourceHubTabFromAskScope({ diffId: "diff-1" })).toBe("drift");
    expect(resolveResourceHubTabFromAskScope({})).toBeUndefined();
  });

  it("builds resource hub href from explorer work queue context", () => {
    expect(resolveResourceHubTabFromExplorerWorkQueue("open-findings")).toBe("findings");
    expect(resolveResourceHubTabFromExplorerWorkQueue("open-remediation")).toBe("remediation");
    expect(resolveResourceHubTabFromExplorerWorkQueue("recent-drift")).toBe("drift");
    expect(resolveResourceHubTabFromExplorerWorkQueue("all")).toBeUndefined();
    expect(buildResourceHubExplorerHref("11111111-1111-1111-1111-111111111111", "open-findings")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings",
    );
    expect(buildResourceHubExplorerHref("11111111-1111-1111-1111-111111111111")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
    );
  });

  it("formats explorer work queue hub tab view labels", () => {
    expect(formatResourceHubTabViewLabelFromExplorerWorkQueue("open-findings")).toBe("View findings in hub");
    expect(formatResourceHubTabViewLabelFromExplorerWorkQueue("open-remediation")).toBe("View remediation in hub");
    expect(formatResourceHubTabViewLabelFromExplorerWorkQueue("recent-drift")).toBe("View drift in hub");
    expect(formatResourceHubTabViewLabelFromExplorerWorkQueue("all")).toBeNull();
  });

  it("builds resource hub overview href with optional scope", () => {
    expect(buildResourceHubOverviewHref("11111111-1111-1111-1111-111111111111")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
    );
    expect(
      buildResourceHubOverviewHref("11111111-1111-1111-1111-111111111111", {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        runId: "run-1",
      }),
    ).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("builds resource hub href for explorer work count badges", () => {
    expect(buildResourceHubWorkCountHref("11111111-1111-1111-1111-111111111111", "findings")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings",
    );
    expect(buildResourceHubWorkCountHref("11111111-1111-1111-1111-111111111111", "remediation")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation",
    );
    expect(buildResourceHubWorkCountHref("11111111-1111-1111-1111-111111111111", "drift")).toBe(
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift",
    );
  });
});
