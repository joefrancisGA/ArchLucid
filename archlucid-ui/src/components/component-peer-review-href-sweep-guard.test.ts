import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Operate component modules that must not inline peer review href builders. */
const COMPONENT_SWEEP_RELATIVE_FILES = [
  "src/components/architecture/ArchitectureCreatedFindingsNextAction.tsx",
  "src/components/provenance/ProvenanceNextReviewFooterClient.tsx",
  "src/components/reviews/ReviewMeetingPacketButton.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailActivityTabComposition.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintNextReviewFooterClient.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectStickinessSummary.tsx",
  "src/app/(operator)/governance/approval-requests/[id]/lineage/_sections/GovernanceApprovalLineageDetailContent.tsx",
] as const;

const INLINE_PEER_RUN_HREF =
  /`\/architecture\/reviews\/\$\{(?:encodeURIComponent|encodeRunPath)\(/;

describe("component peer review href sweep guard", () => {
  it("does not inline peer run href builders in swept Operate components", () => {
    const uiRoot = process.cwd();
    const offenders: string[] = [];

    for (const rel of COMPONENT_SWEEP_RELATIVE_FILES) {
      const body = readFileSync(join(uiRoot, rel), "utf8");

      if (INLINE_PEER_RUN_HREF.test(body)) {
        offenders.push(rel);
      }
    }

    expect(offenders).toEqual([]);
  });
});
