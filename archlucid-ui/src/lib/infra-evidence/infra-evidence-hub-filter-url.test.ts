import { describe, expect, it } from "vitest";

import {
  parseResourceHubTabFromSearch,
  buildInfrastructureAskHref,
  resourceExplorerFilterHrefFromSearch,
  resourceHubFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

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
});
