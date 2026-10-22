import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("v8 quality-ROI prompt inventory (QR index)", () => {
  it("includes v8-quality-roi-00-index and composer prompts doc with QR-01 through QR-05", () => {
    const indexPath = join(REPO_ROOT, ".cursor/prompts/v8-quality-roi-00-index.md");
    const composerDocPath = join(REPO_ROOT, "docs/architecture/V8_QUALITY_ROI_COMPOSER_PROMPTS.md");

    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(composerDocPath)).toBe(true);

    const index = readFileSync(indexPath, "utf8");
    const composer = readFileSync(composerDocPath, "utf8");

    expect(index).toMatch(/QR-01/);
    expect(index).toMatch(/QR-05/);
    expect(composer).toMatch(/# QR-01/);
    expect(composer).toMatch(/# QR-05/);
    expect(composer).toMatch(/typed-engine-scored/);
  });
});
