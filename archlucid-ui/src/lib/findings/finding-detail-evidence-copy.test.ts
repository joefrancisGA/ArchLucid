import { describe, expect, it } from "vitest";

import {
  buildFindingDetailOrientationSources,
  buildFindingDetailSources,
} from "@/lib/findings/finding-detail-evidence-copy";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";

describe("finding-detail-evidence-copy", () => {
  it("excludes evidence trace from orientation Sources when the page surfaces that CTA", () => {
    const runId = "run-1";
    const findingId = "finding-1";
    const evidenceTraceHref = getFindingEvidenceTraceHref(runId, findingId);

    expect(buildFindingDetailSources(runId, findingId).some((source) => source.href === evidenceTraceHref)).toBe(
      true,
    );
    expect(
      buildFindingDetailOrientationSources(runId, findingId).some((source) => source.href === evidenceTraceHref),
    ).toBe(false);
  });
});
