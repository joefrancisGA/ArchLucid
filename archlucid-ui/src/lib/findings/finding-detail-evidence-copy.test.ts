import { describe, expect, it } from "vitest";

import {
  buildFindingDetailOrientationSources,
  buildFindingDetailSources,
} from "@/lib/findings/finding-detail-evidence-copy";
import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
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

  it("routes findings queue Sources to compliance when product line is security", () => {
    const runId = "run-1";
    const findingId = "finding-1";

    expect(buildFindingDetailSources(runId, findingId, "security").some((source) => source.href === SECURENOW_FINDINGS_PATH)).toBe(
      true,
    );
    expect(
      buildFindingDetailOrientationSources(runId, findingId, "security").some(
        (source) => source.href === SECURENOW_FINDINGS_PATH,
      ),
    ).toBe(true);
  });
});
