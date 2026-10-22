import { describe, expect, it } from "vitest";

import { buildInfraEvidenceAuditControlOptions } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

describe("buildInfraEvidenceAuditControlOptions", () => {
  it("deduplicates audit control matches from hub lineage", () => {
    const hub = {
      auditLineageLink: {
        available: true,
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        controlNumber: "AC-2",
        controlTitle: "Account management",
        matches: [
          {
            assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            controlNumber: "AC-2",
            controlTitle: "Account management",
            snapshotCreatedUtc: "2026-01-01T00:00:00Z",
          },
          {
            assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            controlId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            controlNumber: "AC-3",
            controlTitle: "Access enforcement",
            snapshotCreatedUtc: "2026-01-02T00:00:00Z",
          },
        ],
      },
    } as CloudResourceEvidenceHubResponse;

    expect(buildInfraEvidenceAuditControlOptions(hub)).toHaveLength(2);
  });
});
