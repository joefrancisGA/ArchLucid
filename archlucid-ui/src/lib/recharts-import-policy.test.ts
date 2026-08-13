import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  expectSourceContains,
  expectSourceNotMatches,
  readRegisteredSource,
} from "@/testing/source-scan-harness";
import { resolveSourceScanTargetPath } from "@/testing/source-scan-targets";

const SRC_ROOT = join(process.cwd(), "src");

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("recharts import policy (TB-570)", () => {
  it("imports recharts only from the sponsor trend chart module", () => {
    const allowed = resolveSourceScanTargetPath("sponsor-roi-systemic-issue-trend-chart");
    const rechartsImporters = collectSourceFiles(SRC_ROOT).filter((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return /from\s+["']recharts["']/.test(source);
    });

    expect(rechartsImporters).toEqual([allowed]);
  });

  it("loads the trend chart through a dynamic import in the sponsor ROI section", () => {
    const roiSectionSource = readRegisteredSource("sponsor-roi-summary-section");

    expectSourceContains(roiSectionSource, "dynamic(", "sponsor-roi-summary-section");
    expectSourceContains(
      roiSectionSource,
      "SponsorRoiSystemicIssueTrendChart",
      "sponsor-roi-summary-section",
    );
  });

  it("does not statically import recharts on operator home or reviews entry routes", () => {
    const hotPathTargetIds = [
      "operator-home-page-view",
      "operator-home-page",
      "reviews-hub-page",
      "run-detail-page",
    ] as const;

    for (const targetId of hotPathTargetIds) {
      const source = readRegisteredSource(targetId);

      expectSourceNotMatches(source, /from\s+["']recharts["']/, targetId);
    }
  });
});
