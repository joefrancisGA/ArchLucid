import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS } from "@/lib/livelihood-day-sg-leftover-close";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";

const SRC_ROOT = join(process.cwd(), "src");

describe("livelihood-day SG leftover close (LY-021–023)", () => {
  it("keeps SG leftover test files named by LY close rows", () => {
    for (const row of LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS) {
      const path = join(SRC_ROOT, row.relativeTestPath);
      expect(existsSync(path), row.relativeTestPath).toBe(true);
      expect(readFileSync(path, "utf8")).toContain(row.marker);
    }
  });

  it("LY-021 findings work stays nested on the open architecture when ArchitectureId is known", () => {
    const architectureId = "architecture-identity-001";
    const href = resolveWorkingFindingsInstrumentHref({
      architectureId,
      runId: "run-abc",
      filter: "all",
      isWorkingMode: true,
    });

    expect(href).toBe(`${architectureNestedFindingsPath(architectureId)}?runId=run-abc`);
    expect(href).not.toBe("/governance/findings?runId=run-abc");
  });
});
