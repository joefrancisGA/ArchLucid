import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_DECISION_DELTA_REQUIRED_DEFERRED_COMPONENTS,
  RUN_DETAIL_DECISION_DELTA_REQUIRED_LIB_EXPORTS,
  RUN_DETAIL_DECISION_DELTA_REQUIRED_PAGE_COMPONENTS,
} from "@/lib/runs/run-detail-decision-delta-alignment";
import { RUN_DETAIL_DECISION_DELTA_TOP_N } from "@/lib/runs/run-detail-decision-delta";
import { REPO_ROOT } from "@/lib/testing/repo-paths";

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("run-detail-decision-delta-alignment", () => {
  it("keeps top-N aligned with assessment spec", () => {
    expect(RUN_DETAIL_DECISION_DELTA_TOP_N).toBe(3);
  });

  it("wires decision delta deferred section on committed review detail", () => {
    const pageView = readRepoFile("archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.tsx");
    const deferred = readRepoFile(
      "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDecisionDeltaDeferred.tsx",
    );

    for (const componentName of RUN_DETAIL_DECISION_DELTA_REQUIRED_PAGE_COMPONENTS) {
      expect(pageView).toContain(componentName);
    }

    for (const componentName of RUN_DETAIL_DECISION_DELTA_REQUIRED_DEFERRED_COMPONENTS) {
      expect(deferred).toContain(componentName);
    }
  });

  it("exports stable panel test ids", () => {
    const panel = readRepoFile(
      "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDecisionDeltaPanel.tsx",
    );

    expect(panel).toContain("RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID");
    expect(panel).toContain("RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID");
  });

  it("keeps lib exports available for drift guards", () => {
    const libSource = readRepoFile("archlucid-ui/src/lib/runs/run-detail-decision-delta.ts");

    for (const exportName of RUN_DETAIL_DECISION_DELTA_REQUIRED_LIB_EXPORTS) {
      expect(libSource).toContain(exportName);
    }
  });
});
