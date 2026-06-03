import { existsSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

const logoDir = path.resolve(__dirname, "../../public/logo");

describe("generate-brand-raster outputs", () => {
  it("commits raster assets at expected dimensions", async () => {
    const ogPath = path.join(logoDir, "og-default.png");
    const iconPath = path.join(logoDir, "icon-192.png");

    expect(existsSync(ogPath)).toBe(true);
    expect(existsSync(iconPath)).toBe(true);

    const ogMeta = await sharp(ogPath).metadata();
    const iconMeta = await sharp(iconPath).metadata();

    expect(ogMeta.width).toBe(1200);
    expect(ogMeta.height).toBe(630);
    expect(iconMeta.width).toBe(192);
    expect(iconMeta.height).toBe(192);
  });
});
