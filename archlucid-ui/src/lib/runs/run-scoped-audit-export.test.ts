import { describe, expect, it } from "vitest";

import { buildRunScopedAuditExportParams } from "@/lib/runs/run-scoped-audit-export";

describe("buildRunScopedAuditExportParams", () => {
  it("returns a five-year window scoped to the run id", () => {
    const params = buildRunScopedAuditExportParams(" run-abc ");

    expect(params.runId).toBe("run-abc");
    expect(params.maxRows).toBe(10_000);
    expect(Date.parse(params.toUtcIso)).not.toBeNaN();
    expect(Date.parse(params.fromUtcIso)).not.toBeNaN();
    expect(new Date(params.toUtcIso).getTime()).toBeGreaterThan(new Date(params.fromUtcIso).getTime());
  });
});
