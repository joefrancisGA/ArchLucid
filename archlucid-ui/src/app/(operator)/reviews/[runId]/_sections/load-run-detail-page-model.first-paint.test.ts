import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const loaderSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "load-run-detail-page-model.ts"),
  "utf8",
);

describe("load-run-detail-page-model first paint (TB-2022)", () => {
  it("always fetches slim buyer-summary and never imports fat getRunDetail", () => {
    expect(loaderSource).toContain("getBuyerRunDetailSummary");
    expect(loaderSource).toContain("usedBuyerRunDetailSummary = true");
    expect(loaderSource).not.toMatch(/getRunDetail\b/);
    expect(loaderSource).not.toContain('getRunDetail,');
  });
});
