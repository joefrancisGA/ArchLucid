import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { BUYER_CTO_DEMO_READINESS_ARIA } from "@/lib/buyer/buyer-polish-copy";
import { DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME } from "@/lib/demo-readiness-evidence-copy";

const CTO_DEMO_CHROME_PATTERN = /cto\s*demo|cto-demo/i;

function readRepoRelativeSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("demo-readiness-admin-cto-chrome-guard (TB-1410)", () => {
  it("uses internal-demo vocabulary for the admin panel aria region", () => {
    expect(BUYER_CTO_DEMO_READINESS_ARIA).toBe("Internal demo readiness checks");
    expect(BUYER_CTO_DEMO_READINESS_ARIA).not.toMatch(CTO_DEMO_CHROME_PATTERN);
  });

  it("uses a run-of-show download filename without cto-demo chrome", () => {
    expect(DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME).toBe("archlucid-internal-demo-runofshow.md");
    expect(DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME).not.toMatch(CTO_DEMO_CHROME_PATTERN);
  });

  it("does not hardcode legacy cto-demo download or aria strings in the admin panel", () => {
    const panelSource = readRepoRelativeSource("src/components/operator-home/BuyerCtoDemoReadinessPanel.tsx");

    expect(panelSource).not.toContain("archlucid-cto-demo-runofshow.md");
    expect(panelSource).not.toMatch(/aria-label=\{?"CTO demo/i);
  });
});
