import { describe, expect, it } from "vitest";

import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import {
  listRecentAuditEvidenceLineageTargets,
  resolveContinueLastAuditEvidenceLineage,
} from "@/lib/resolve-continue-last-audit-evidence-lineage";

describe("resolveContinueLastAuditEvidenceLineage", () => {
  it("returns the newest audit evidence control lineage href using the SecureNow namespace", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
            label: "Audit evidence lineage",
            kind: "page",
            visitedAtUtc: "2026-09-01T12:00:00Z",
          },
        ],
      }),
    );

    const target = resolveContinueLastAuditEvidenceLineage("security");

    expect(target).not.toBeNull();
    expect(target?.href).toBe("/compliance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3");
    expect(target?.controlId).toBe("ctrl-3");
  });

  it("lists up to eight recent lineage visits without duplicates", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
            label: "AC-2",
            kind: "page",
            visitedAtUtc: "2026-09-02T12:00:00Z",
          },
          {
            href: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
            label: "Duplicate",
            kind: "page",
            visitedAtUtc: "2026-09-01T12:00:00Z",
          },
          {
            href: "/governance/audit-evidence/assess-4/snapshots/snap-5/controls/ctrl-6",
            label: "AC-6",
            kind: "page",
            visitedAtUtc: "2026-08-31T12:00:00Z",
          },
        ],
      }),
    );

    const targets = listRecentAuditEvidenceLineageTargets("security");

    expect(targets).toHaveLength(2);
    expect(targets[0]?.href).toBe("/compliance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3");
    expect(targets[1]?.href).toBe("/compliance/audit-evidence/assess-4/snapshots/snap-5/controls/ctrl-6");
  });
});
