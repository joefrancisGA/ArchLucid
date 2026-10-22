import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";

describe("resolveWorkingFindingsInstrumentHref (SG-019 / ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-abc";

  it("prefers nested architecture findings on Working when parent architecture is known", () => {
    expect(
      resolveWorkingFindingsInstrumentHref({
        architectureId,
        runId,
        filter: "all",
        isWorkingMode: true,
      }),
    ).toBe(`${architectureNestedFindingsPath(architectureId)}?runId=${encodeURIComponent(runId)}`);
  });

  it("falls back to governance findings queue when architecture is unknown or not Working", () => {
    expect(
      resolveWorkingFindingsInstrumentHref({
        architectureId,
        runId,
        isWorkingMode: false,
      }),
    ).toBe("/governance/findings?runId=run-abc");

    expect(
      resolveWorkingFindingsInstrumentHref({
        architectureId: null,
        runId,
        isWorkingMode: true,
      }),
    ).toBe("/governance/findings?runId=run-abc");
  });
});
