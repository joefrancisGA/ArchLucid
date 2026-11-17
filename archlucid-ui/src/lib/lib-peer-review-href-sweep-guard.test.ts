import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Lib modules that must route review opens through desk-continuity helpers (no inline peer builders). */
const LIB_SWEEP_RELATIVE_FILES = [
  "src/lib/copy-finding-as-work-item-inspect.ts",
  "src/lib/copy-finding-as-work-item-trace-row.ts",
  "src/lib/draft-branch-compare-navigation.ts",
  "src/lib/evidence-trace-evidence-copy.ts",
  "src/lib/extract-upload-settings-evidence-copy.ts",
  "src/lib/findings/finding-detail-evidence-copy.ts",
  "src/lib/findings/finding-source-evidence-links.ts",
  "src/lib/findings/findings-withheld-band.ts",
  "src/lib/findings/review-findings-job-view-url.ts",
  "src/lib/operations/operation-location.ts",
  "src/lib/package-print-evidence-copy.ts",
  "src/lib/pilot-outcomes-report-diagnostics.ts",
  "src/lib/repeat-review-activation.ts",
  "src/lib/review-quality/finalize-readiness-block-action.ts",
  "src/lib/sponsor/sponsor-review-coverage-honesty.ts",
  "src/lib/sponsor/sponsor-scorecard-recommended-actions.ts",
  "src/lib/trust-evidence-product-links.ts",
] as const;

const INLINE_PEER_RUN_HREF =
  /`\/architecture\/reviews\/\$\{(?:encodeURIComponent|encodeRunPath)\(/;

describe("lib peer review href sweep guard", () => {
  it("does not inline peer run href builders in swept lib copy modules", () => {
    const uiRoot = process.cwd();
    const offenders: string[] = [];

    for (const rel of LIB_SWEEP_RELATIVE_FILES) {
      const body = readFileSync(join(uiRoot, rel), "utf8");

      if (INLINE_PEER_RUN_HREF.test(body)) {
        offenders.push(rel);
      }
    }

    expect(offenders).toEqual([]);
  });
});
