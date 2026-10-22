import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { listOperatorPrimaryCtaVerifiedEntries } from "@/lib/operator/operator-primary-cta-inventory";

const UI_ROOT = join(process.cwd());

const TB_1544_GUARD_FILE = "src/lib/operator/operator-primary-cta-dual-primary-guard.test.ts";

describe("operator primary CTA band regression (TB-1544)", () => {
  it("keeps the TB-1544 dual-primary Vitest guard on disk", () => {
    expect(existsSync(join(UI_ROOT, TB_1544_GUARD_FILE))).toBe(true);
    expect(readFileSync(join(UI_ROOT, TB_1544_GUARD_FILE), "utf8")).toContain("TB-1544");
  });

  it("extends the TB-1543 inventory allowlist with stable primary test ids", () => {
    const verified = listOperatorPrimaryCtaVerifiedEntries();

    expect(verified.length).toBeGreaterThanOrEqual(8);

    for (const entry of verified) {
      expect(entry.primaryTestId.trim().length).toBeGreaterThan(0);
      expect(entry.componentOrModule.trim().length).toBeGreaterThan(0);
    }
  });
});
