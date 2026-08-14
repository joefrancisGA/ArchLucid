import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const uiRoot = join(process.cwd());

function readUiSource(relativePath: string): string {
  return readFileSync(join(uiRoot, relativePath), "utf8");
}

describe("TB-2027 operator loader parallelism", () => {
  it("parallelizes run-detail mid-deferred and pipeline/stage timelines", () => {
    const source = readUiSource(
      "src/app/(operator)/architecture/reviews/[reviewId]/_sections/load-run-detail-deferred-model.ts",
    );

    expect(source).toContain("loadRunDetailMidDeferredModel");
    expect(source).toMatch(
      /loadRunDetailMidDeferredModel[\s\S]*?await Promise\.all\(\[\s*loadChangesSinceLastReviewBanner/,
    );
    expect(source).toContain("loadPipelineTimelineOnly");
    expect(source).toContain("loadStageTimelineOnly");
    expect(source).toMatch(
      /loadPipelineTimelineSections[\s\S]*?await Promise\.all\(\[\s*loadPipelineTimelineOnly/,
    );
  });

  // The tenant settings loader used to parallelize trial + digest. The digest schedule editor moved to the
  // Digests hub, leaving a single fetch here, so there is no longer a parallelism invariant to guard.

  it("uses allSettled for governance setup policy + routing signals", () => {
    const source = readUiSource(
      "src/app/(operator)/governance/setup/_sections/resolve-governance-setup-status.ts",
    );

    expect(source).toContain("Promise.allSettled");
    expect(source).toContain("getEffectivePolicyPacks()");
    expect(source).toContain("listAlertRoutingSubscriptions()");
  });

  it("parallelizes finding detail inspect + run footnote", () => {
    const source = readUiSource(
      "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/load-finding-detail-page-model.ts",
    );

    expect(source).toMatch(
      /await Promise\.all\(\[\s*loadFindingInspectForRouteCached\(runId, decodedFindingId, false\),\s*tryLoadRunExecutionFootnote\(runId\)/,
    );
  });
});
