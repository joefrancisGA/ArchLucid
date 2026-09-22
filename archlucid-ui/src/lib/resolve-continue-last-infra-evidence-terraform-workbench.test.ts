import { describe, expect, it, beforeEach } from "vitest";

import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import {
  listRecentInfraEvidenceTerraformWorkbenchTargets,
  resolveContinueLastInfraEvidenceTerraformWorkbench,
} from "@/lib/resolve-continue-last-infra-evidence-terraform-workbench";

describe("resolve-continue-last-infra-evidence-terraform-workbench", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("preserves audit scope ids when resolving continue-last target", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href:
              "/infrastructure/terraform?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=33333333-3333-3333-3333-333333333333&auditEvidenceSnapshotId=44444444-4444-4444-4444-444444444444&controlId=55555555-5555-5555-5555-555555555555",
            label: "gateway-ip",
            kind: "page",
            visitedAtUtc: "2026-09-20T12:00:00Z",
          },
        ],
      }),
    );

    const target = resolveContinueLastInfraEvidenceTerraformWorkbench("security");

    expect(target).not.toBeNull();
    expect(target?.href).toContain("assessmentId=33333333-3333-3333-3333-333333333333");
    expect(target?.href).toContain("auditEvidenceSnapshotId=44444444-4444-4444-4444-444444444444");
    expect(target?.href).toContain("controlId=55555555-5555-5555-5555-555555555555");
    expect(target?.snapshotId).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("lists up to five recent terraform mapping targets", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/infrastructure/terraform?cloudResourceId=11111111-1111-1111-1111-111111111111",
            label: "one",
            kind: "page",
            visitedAtUtc: "2026-09-21T12:00:00Z",
          },
          {
            href: "/infrastructure/terraform?cloudResourceId=22222222-2222-2222-2222-222222222222",
            label: "two",
            kind: "page",
            visitedAtUtc: "2026-09-20T12:00:00Z",
          },
        ],
      }),
    );

    const targets = listRecentInfraEvidenceTerraformWorkbenchTargets("security", 5);

    expect(targets).toHaveLength(2);
    expect(targets[0]?.label).toBe("one");
    expect(targets[1]?.label).toBe("two");
  });
});
