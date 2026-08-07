import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_DECISION_DELTA_REQUIRED_DEFERRED_COMPONENTS,
  RUN_DETAIL_DECISION_DELTA_REQUIRED_LIB_EXPORTS,
  RUN_DETAIL_DECISION_DELTA_REQUIRED_PAGE_COMPONENTS,
} from "@/lib/run-detail-decision-delta-alignment";
import { RUN_DETAIL_DECISION_DELTA_TOP_N } from "@/lib/run-detail-decision-delta";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("run-detail-decision-delta-alignment", () => {
  it("keeps top-N aligned with assessment spec", () => {
    expect(RUN_DETAIL_DECISION_DELTA_TOP_N).toBe(3);
  });

  it("wires decision delta deferred section on committed review detail", () => {
    const pageView = readRepoFile("archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageView.tsx");
    const deferred = readRepoFile(
      "archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailDecisionDeltaDeferred.tsx",
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
      "archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailDecisionDeltaPanel.tsx",
    );

    expect(panel).toContain("RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID");
    expect(panel).toContain("RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID");
  });

  it("keeps lib exports available for drift guards", () => {
    const libSource = readRepoFile("archlucid-ui/src/lib/run-detail-decision-delta.ts");

    for (const exportName of RUN_DETAIL_DECISION_DELTA_REQUIRED_LIB_EXPORTS) {
      expect(libSource).toContain(exportName);
    }
  });
});
