import { describe, expect, it } from "vitest";

import {
  expectSourceContains,
  expectSourceNotMatches,
  readRegisteredSource,
} from "@/testing/source-scan-harness";

const viewSource = readRegisteredSource("run-detail-page-view");
const presentationSource = readRegisteredSource("run-detail-page-presentation");

describe("RunDetailPageView FLJS (wave 15 item 4)", () => {
  it("defers run-detail-workspace-derive via dynamic import", () => {
    expectSourceContains(
      presentationSource,
      'await import("@/lib/run-detail-workspace-derive")',
      "run-detail-page-presentation",
    );
    // A value import would pull the derive module into the route's initial server chunk.
    expectSourceNotMatches(
      presentationSource,
      /^import\s+\{[^}]*\}\s+from\s+["']@\/lib\/run-detail-workspace-derive["']/m,
      "run-detail-page-presentation",
    );
    expectSourceNotMatches(
      viewSource,
      /from\s+["']@\/lib\/run-detail-workspace-derive["']/,
      "run-detail-page-view",
    );
  });
});
