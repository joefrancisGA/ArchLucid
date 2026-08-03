import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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
  it("imports recharts only from the executive trend chart module", () => {
    const rechartsImporters = collectSourceFiles(SRC_ROOT).filter((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return /from\s+["']recharts["']/.test(source);
    });

    expect(rechartsImporters).toEqual([
      join(SRC_ROOT, "components", "ExecutiveRoiSystemicIssueTrendChart.tsx"),
    ]);
  });

  it("loads the trend chart through a dynamic import in the executive ROI section", () => {
    const roiSectionSource = readFileSync(
      join(SRC_ROOT, "app", "(operator)", "architecture", "executive-dashboard", "_sections", "ExecutiveRoiSummarySection.tsx"),
      "utf8",
    );

    expect(roiSectionSource).toContain("dynamic(");
    expect(roiSectionSource).toContain("ExecutiveRoiSystemicIssueTrendChart");
  });

  it("does not statically import recharts on operator home or reviews entry routes", () => {
    const hotPathModules = [
      join(SRC_ROOT, "app", "(operator)", "_sections", "OperatorHomePageView.tsx"),
      join(SRC_ROOT, "app", "(operator)", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "reviews", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "reviews", "[runId]", "page.tsx"),
    ];

    for (const modulePath of hotPathModules) {
      const source = readFileSync(modulePath, "utf8");

      expect(source).not.toMatch(/from\s+["']recharts["']/);
    }
  });
});
