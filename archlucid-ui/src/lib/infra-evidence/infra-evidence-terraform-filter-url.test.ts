import { describe, expect, it } from "vitest";

import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";

describe("infra-evidence-terraform-filter-url", () => {
  it("builds scoped terraform workbench href with audit params", () => {
    expect(
      buildTerraformWorkbenchHref({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      }),
    ).toBe(
      "/governance/infrastructure/terraform?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });
});
