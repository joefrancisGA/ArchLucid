import { describe, expect, it } from "vitest";

import {
  formatResourceHubWorkbenchPrimaryHubLabel,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";

describe("infra-evidence-workbench-hub-scope", () => {
  it("parses audit scope from workbench search params", () => {
    const searchParams = new URLSearchParams(
      "assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );

    expect(parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams)).toEqual({
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });
    expect(parseInfraEvidenceWorkbenchAuditScopeFromSearch(new URLSearchParams("assessmentId=only"))).toBeNull();
  });

  it("formats workbench primary hub labels", () => {
    expect(formatResourceHubWorkbenchPrimaryHubLabel("drift")).toBe("View drift in hub");
    expect(formatResourceHubWorkbenchPrimaryHubLabel("diagram")).toBe("View diagram correspondence in hub");
    expect(formatResourceHubWorkbenchPrimaryHubLabel("remediation")).toBe("View remediation in hub");
  });

  it("merges snapshot, run, and audit scope into hub link patches", () => {
    expect(
      mergeWorkbenchHubScopePatch(
        "22222222-2222-2222-2222-222222222222",
        {
          assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        },
        "run-1",
      ),
    ).toEqual({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      runId: "run-1",
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });
  });
});
