import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const operatorDir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(join(operatorDir, "page.tsx"), "utf8");

describe("operator home Suspense streaming", () => {
  it("streams runs dashboard under Suspense without top-level await before return", () => {
    expect(pageSource).toContain("<Suspense");
    expect(pageSource).toContain("OperatorHomeRunsDashboardAsync");
    expect(pageSource).toContain("OperatorHomePageSuspenseFallback");
    expect(pageSource).toContain("CtoDemoSponsorLandingRedirectDeferred");
    expect(pageSource).not.toContain("loadOperatorHomeRunsDashboardModel");
    expect(pageSource).not.toMatch(/await\s+loadOperatorHomeRunsDashboardModel/);
    expect(pageSource).not.toContain("OperatorHomePageView");
  });
});
